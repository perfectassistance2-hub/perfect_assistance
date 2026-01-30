// Fichier: app/api/medecin/patients/[id]/documents/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id: patientId, documentId } = await params;
    const medecinId = user.userId;

    // Vérifier que le patient est affecté au médecin
    const { data: sejours } = await supabaseAdmin
      .from("sejours")
      .select("id")
      .eq("patientId", patientId)
      .eq("medecinId", medecinId)
      .limit(1);

    if (!sejours || sejours.length === 0) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer le document
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("patientId", patientId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document introuvable' },
        { status: 404 }
      );
    }

    // IMPORTANT: Vérifier que le document a été ajouté par le médecin
    if (document.ajoutePar !== 'medecin') {
      return NextResponse.json(
        { error: 'Vous ne pouvez supprimer que les documents que vous avez ajoutés' },
        { status: 403 }
      );
    }

    // Optionnel: Vérifier que c'est bien CE médecin qui l'a ajouté
    if (document.medecinPartageId && document.medecinPartageId !== medecinId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez supprimer que vos propres documents' },
        { status: 403 }
      );
    }

    // Supprimer le fichier du storage
    const { error: storageError } = await supabaseAdmin
      .storage
      .from('documents')
      .remove([document.urlFichier]);

    if (storageError) {
      console.error('⚠️ Erreur suppression fichier storage:', storageError);
      // On continue quand même pour supprimer l'entrée en base
    }

    // Supprimer l'entrée en base de données
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('❌ Erreur suppression DB:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    console.log('✅ Document supprimé:', documentId);

    return NextResponse.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur suppression document:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}