import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    console.log('📊 Document Détail API - Début (GET)', documentId);

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;

    // Récupérer le document
    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('patientId', patientId)
      .single();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Document non trouvé' },
          { status: 404 }
        );
      }
      throw new Error(error.message);
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document
    });

  } catch (error: any) {
    console.error('💥 Erreur Document détail GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT pour mettre à jour le document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    console.log('📊 Document Détail API - Début (PUT)', documentId);

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const body = await request.json();

    const { titre, notes, partageAvecMedecin } = body;

    // Construire l'objet de mise à jour
    const updateData: any = {
      dateMiseAJour: new Date().toISOString()
    };

    if (titre !== undefined) {
      updateData.titre = titre;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (partageAvecMedecin !== undefined) {
      updateData.partageAvecMedecin = partageAvecMedecin;
    }

    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .eq('patientId', patientId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      document,
      message: 'Document mis à jour'
    });

  } catch (error: any) {
    console.error('💥 Erreur Document détail PUT:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE pour supprimer le document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    console.log('📊 Document Détail API - Début (DELETE)', documentId);

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;

    // Vérifier que le document appartient au patient
    const { data: document } = await supabaseAdmin
      .from('documents')
      .select('ajoutePar')
      .eq('id', documentId)
      .eq('patientId', patientId)
      .single();

    if (!document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    // Seul le patient peut supprimer ses propres documents
    if (document.ajoutePar !== 'patient') {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer ce document' },
        { status: 403 }
      );
    }

    // Supprimer le document
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('patientId', patientId);

    if (error) {
      console.error('❌ Erreur suppression:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Document supprimé'
    });

  } catch (error: any) {
    console.error('💥 Erreur Document détail DELETE:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}