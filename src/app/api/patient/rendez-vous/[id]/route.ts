import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rdvId } = await params;
    console.log('📊 RDV Détail API - Début (GET)', rdvId);

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;

    // Récupérer le rendez-vous avec toutes les relations
    const { data: rdv, error } = await supabaseAdmin
      .from('rendez_vous')
      .select(`
        *,
        medecin:medecins!medecinId(
          id,
          prenom,
          nom,
          specialite,
          telephone,
          email
        ),
        clinique:cliniques!cliniqueId(
          id,
          nom,
          adresse,
          ville,
          pays,
          telephone,
          email,
          siteWeb
        ),
        consultationVideo:consultations_video!rendez_vous_id(
          id,
          daily_room_name,
          daily_room_url,
          lien_patient,
          lien_medecin,
          mot_de_passe,
          statut
        )
      `)
      .eq('id', rdvId)
      .eq('patientId', patientId)
      .single();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Rendez-vous non trouvé' },
          { status: 404 }
        );
      }
      throw new Error(error.message);
    }

    if (!rdv) {
      return NextResponse.json(
        { error: 'Rendez-vous non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les documents liés au RDV
    let documents = [];
    try {
      const { data: docsData } = await supabaseAdmin
        .from('documents_medicaux')
        .select('*')
        .eq('patientId', patientId)
        .order('dateCreation', { ascending: false });
      
      // Filtrer les documents qui ont ce rdvId dans leurs tags ou description
      documents = (docsData || []).filter(doc => 
        doc.tags?.includes(rdvId) || 
        doc.description?.includes(rdvId)
      );
    } catch (err) {
      console.log('⚠️ Pas de documents liés ou erreur:', err);
    }

    return NextResponse.json({
      success: true,
      rdv,
      documents
    });

  } catch (error: any) {
    console.error('💥 Erreur RDV détail GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT pour mettre à jour le RDV (notes du patient, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rdvId } = await params;
    console.log('📊 RDV Détail API - Début (PUT)', rdvId);

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const body = await request.json();

    const { notes, statut } = body;

    // Construire l'objet de mise à jour
    const updateData: any = {
      dateMiseAJour: new Date().toISOString()
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (statut !== undefined) {
      // Le patient peut seulement annuler
      if (statut === 'ANNULE') {
        updateData.statut = 'ANNULE';
      }
    }

    const { data: rdv, error } = await supabaseAdmin
      .from('rendez_vous')
      .update(updateData)
      .eq('id', rdvId)
      .eq('patientId', patientId)
      .select(`
        *,
        medecin:medecins!medecinId(
          id,
          prenom,
          nom,
          specialite,
          telephone,
          email
        ),
        clinique:cliniques!cliniqueId(
          id,
          nom,
          adresse,
          ville,
          pays,
          telephone
        )
      `)
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      rdv,
      message: 'Rendez-vous mis à jour'
    });

  } catch (error: any) {
    console.error('💥 Erreur RDV détail PUT:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}