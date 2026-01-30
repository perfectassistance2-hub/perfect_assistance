import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload Document API - Début (POST)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
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

    // Ne PAS utiliser getPublicUrl car le bucket est privé
    // On stocke juste le chemin du fichier (sans "documents/" au début)
    const fileUrl = fileName; // Exemple: "patientId/1234567890-document.pdf"

    // Créer l'entrée dans la base de données
    const { data: document, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        patientId,
        type,
        titre,
        description: description || null,
        urlFichier: fileUrl, // Stocker SEULEMENT le chemin relatif
        nomFichier: file.name,
        tailleFichier: file.size,
        typeMime: file.type,
        ajoutePar: 'patient',
        partageAvecMedecin: false,
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