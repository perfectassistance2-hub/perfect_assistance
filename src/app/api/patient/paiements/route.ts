import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Récupérer le suivi des paiements d'un devis
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Suivi Paiements API - Début (GET)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const devisId = searchParams.get('devisId');

    if (!devisId) {
      return NextResponse.json(
        { error: 'devisId requis' },
        { status: 400 }
      );
    }

    // Vérifier que le devis appartient au patient
    const { data: devis } = await supabaseAdmin
      .from('devis')
      .select('id, patientId')
      .eq('id', devisId)
      .eq('patientId', user.userId)
      .single();

    if (!devis) {
      return NextResponse.json(
        { error: 'Devis introuvable' },
        { status: 404 }
      );
    }

    // Récupérer le suivi des paiements
    const { data: paiements, error } = await supabaseAdmin
      .from('suivi_paiements_patients')
      .select('*')
      .eq('devisId', devisId)
      .order('datePaiementPrevue', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      paiements: paiements || []
    });

  } catch (error: any) {
    console.error('💥 Erreur suivi paiements GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Ajouter une échéance de paiement
export async function POST(request: NextRequest) {
  try {
    console.log('📊 Suivi Paiements API - Début (POST)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { devisId, datePaiementPrevue, montantPrevu, notes } = body;

    if (!devisId || !datePaiementPrevue || !montantPrevu) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier que le devis appartient au patient
    const { data: devis } = await supabaseAdmin
      .from('devis')
      .select('id, patientId')
      .eq('id', devisId)
      .eq('patientId', user.userId)
      .single();

    if (!devis) {
      return NextResponse.json(
        { error: 'Devis introuvable' },
        { status: 404 }
      );
    }

    // Créer l'échéance
    const { data: paiement, error } = await supabaseAdmin
      .from('suivi_paiements_patients')
      .insert({
        devisId,
        patientId: user.userId,
        datePaiementPrevue,
        montantPrevu: parseFloat(montantPrevu),
        notes: notes || null,
        estPaye: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      paiement,
      message: 'Échéance ajoutée avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur suivi paiements POST:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Marquer un paiement comme payé/non payé
export async function PUT(request: NextRequest) {
  try {
    console.log('📊 Suivi Paiements API - Début (PUT)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, estPaye, datePaiementEffectif } = body;

    if (!id || estPaye === undefined) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier que le paiement appartient au patient
    const { data: existingPaiement } = await supabaseAdmin
      .from('suivi_paiements_patients')
      .select('id, patientId')
      .eq('id', id)
      .eq('patientId', user.userId)
      .single();

    if (!existingPaiement) {
      return NextResponse.json(
        { error: 'Paiement introuvable' },
        { status: 404 }
      );
    }

    // Mettre à jour le paiement
    const updateData: any = {
      estPaye,
      dateMiseAJour: new Date().toISOString()
    };

    if (estPaye && datePaiementEffectif) {
      updateData.datePaiementEffectif = datePaiementEffectif;
    } else if (!estPaye) {
      updateData.datePaiementEffectif = null;
    }

    const { data: paiement, error } = await supabaseAdmin
      .from('suivi_paiements_patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      paiement,
      message: estPaye ? 'Paiement marqué comme payé' : 'Paiement marqué comme non payé'
    });

  } catch (error: any) {
    console.error('💥 Erreur suivi paiements PUT:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une échéance
export async function DELETE(request: NextRequest) {
  try {
    console.log('📊 Suivi Paiements API - Début (DELETE)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id requis' },
        { status: 400 }
      );
    }

    // Vérifier que le paiement appartient au patient
    const { data: existingPaiement } = await supabaseAdmin
      .from('suivi_paiements_patients')
      .select('id, patientId')
      .eq('id', id)
      .eq('patientId', user.userId)
      .single();

    if (!existingPaiement) {
      return NextResponse.json(
        { error: 'Paiement introuvable' },
        { status: 404 }
      );
    }

    // Supprimer le paiement
    const { error } = await supabaseAdmin
      .from('suivi_paiements_patients')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Échéance supprimée avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur suivi paiements DELETE:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}