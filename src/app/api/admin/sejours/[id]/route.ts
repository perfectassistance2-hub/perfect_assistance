import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sejourId } = await params;
    console.log('🏥 Séjour Detail API - Début (GET)', sejourId);

    // Récupérer le séjour avec toutes les relations
    const { data: sejour, error } = await supabaseAdmin
      .from('sejours')
      .select(`
        *,
        patient:patients!patientId(
          id,
          prenom,
          nom,
          email,
          telephone,
          dateNaissance,
          pays,
          ville
        ),
        coordinateur:utilisateurs!coordinateurId(
          id,
          prenom,
          nom,
          email
        ),
        clinique:cliniques!cliniqueId(
          id,
          nom,
          adresse,
          ville,
          telephone,
          email
        ),
        medecin:medecins!medecinId(
          id,
          prenom,
          nom,
          specialite,
          telephone,
          email
        )
      `)
      .eq('id', sejourId)
      .single();

    if (error || !sejour) {
      console.error('❌ Séjour non trouvé:', error);
      return NextResponse.json(
        { error: 'Séjour non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les rendez-vous liés à ce séjour
    const { data: rendezVous } = await supabaseAdmin
      .from('rendezVous')
      .select(`
        id,
        datePrevue,
        type,
        statut,
        raison,
        medecin:medecins!medecinId(prenom, nom, specialite)
      `)
      .eq('sejourId', sejourId)
      .order('datePrevue', { ascending: true });

    // Récupérer les documents liés au patient de ce séjour
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('patientId', sejour.patientId)
      .order('dateCreation', { ascending: false });

    // Récupérer les devis liés à ce séjour
    const { data: devis } = await supabaseAdmin
      .from('devis')
      .select('*')
      .eq('sejourId', sejourId);

    console.log('✅ Séjour récupéré:', sejour.id);

    return NextResponse.json({
      success: true,
      sejour,
      rendezVous: rendezVous || [],
      documents: documents || [],
      devis: devis || []
    });

  } catch (error: any) {
    console.error('💥 Erreur Séjour Detail API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Mettre à jour un séjour
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sejourId } = await params;
    const body = await request.json();

    console.log('🔄 Update Séjour:', sejourId);

    const { data: sejour, error } = await supabaseAdmin
      .from('sejours')
      .update({
        ...body,
        dateMiseAJour: new Date().toISOString()
      })
      .eq('id', sejourId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Séjour mis à jour');

    return NextResponse.json({
      success: true,
      sejour
    });

  } catch (error: any) {
    console.error('💥 Erreur Update Séjour:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}