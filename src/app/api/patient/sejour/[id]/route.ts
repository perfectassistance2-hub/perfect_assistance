import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sejourId } = await params;
    console.log('📊 Séjour Détail API - Début (GET)', sejourId);

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;

    // Récupérer le séjour avec toutes les relations
    const { data: sejour, error } = await supabaseAdmin
      .from('sejours')
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
          siteWeb,
          specialites
        ),
        coordinateur:utilisateurs!coordinateurId(
          id,
          prenom,
          nom,
          email,
          telephone
        )
      `)
      .eq('id', sejourId)
      .eq('patientId', patientId)
      .single();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Séjour non trouvé' },
          { status: 404 }
        );
      }
      throw new Error(error.message);
    }

    if (!sejour) {
      return NextResponse.json(
        { error: 'Séjour non trouvé' },
        { status: 404 }
      );
    }

    
    // Récupérer les documents liés au séjour (optionnel)
    let documents = [];
    try {
      const { data: docsData } = await supabaseAdmin
        .from('documents_medicaux')
        .select('*')
        .eq('patientId', patientId)
        .order('dateCreation', { ascending: false });
      
      // Filtrer les documents qui mentionnent ce séjour
      documents = (docsData || []).filter(doc => 
        doc.tags?.includes(sejourId) || 
        doc.description?.includes(sejourId)
      );
    } catch (err) {
      console.log('⚠️ Pas de documents liés ou erreur:', err);
    }

    return NextResponse.json({
      success: true,
      sejour,
      
      documents
    });

  } catch (error: any) {
    console.error('💥 Erreur Séjour détail GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT pour mettre à jour les notes du patient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sejourId } = await params;
    console.log('📊 Séjour Détail API - Début (PUT)', sejourId);

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const body = await request.json();

    const { notes } = body;

    // Le patient ne peut modifier que ses notes
    const updateData: any = {
      dateMiseAJour: new Date().toISOString()
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data: sejour, error } = await supabaseAdmin
      .from('sejours')
      .update(updateData)
      .eq('id', sejourId)
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
          telephone,
          email
        ),
        coordinateur:utilisateurs!coordinateurId(
          id,
          prenom,
          nom,
          email,
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
      sejour,
      message: 'Séjour mis à jour'
    });

  } catch (error: any) {
    console.error('💥 Erreur Séjour détail PUT:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}