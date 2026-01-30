// Fichier: app/api/medecin/patients/[id]/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📤 Upload Document API - Médecin (POST)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Await params pour Next.js 15+
    const { id: patientId } = await params;
    const medecinId = user.userId; // user.userId correspond à medecins.id

    // Vérifier que le patient est bien affecté au médecin
    const { data: sejours, error: sejourError } = await supabaseAdmin
      .from("sejours")
      .select("id")
      .eq("patientId", patientId)
      .eq("medecinId", medecinId)
      .limit(1);

    if (sejourError || !sejours || sejours.length === 0) {
      return NextResponse.json(
        { error: 'Patient non affecté à ce médecin' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const titre = formData.get('titre') as string;
    const description = formData.get('description') as string;

    if (!file || !type || !titre) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 10 MB' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${patientId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload vers Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError);
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    // Stocker seulement le chemin relatif (le bucket est privé)
    const fileUrl = fileName;

    // Créer l'entrée dans la base de données
    // IMPORTANT: Le document ajouté par le médecin est automatiquement partagé
    const { data: document, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        patientId,
        type,
        titre,
        description: description || null,
        urlFichier: fileUrl,
        nomFichier: file.name,
        tailleFichier: file.size,
        typeMime: file.type,
        ajoutePar: 'medecin', // Indique que c'est ajouté par le médecin
        medecinPartageId: medecinId, // ID du médecin qui a ajouté
        partageAvecMedecin: true, // Automatiquement partagé
        dateTeleversement: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Erreur DB:', dbError);
      
      // Supprimer le fichier uploadé en cas d'erreur
      await supabaseAdmin.storage
        .from('documents')
        .remove([fileName]);
      
      throw new Error(`Erreur lors de la sauvegarde: ${dbError.message}`);
    }

    console.log('✅ Document ajouté avec succès:', document.id);

    return NextResponse.json({
      success: true,
      document,
      message: 'Document ajouté avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur Upload Document:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}