import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: devisId } = await params;
    console.log('📄 Devis Detail API - Début (GET)', devisId);

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    console.log('PatientId:', patientId);

    // Récupérer le devis avec toutes les relations
    const { data: devis, error: devisError } = await supabaseAdmin
      .from('devis')
      .select(`
        *,
        patient:patients!patientId(
          id,
          prenom,
          nom,
          email,
          telephone,
          dateNaissance,
          adresse,
          ville,
          pays
        ),
        sejour:sejours!sejourId(
          id,
          typeTraitement,
          descriptionTraitement,
          dateArrivee,
          dateDepart,
          statut,
          clinique:cliniques!cliniqueId(
            id,
            nom,
            ville
          )
        )
      `)
      .eq('id', devisId)
      .eq('patientId', patientId)
      .single();

    if (devisError || !devis) {
      console.error('❌ Devis non trouvé:', devisError);
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer l'historique des paiements pour ce devis
    const { data: paiements, error: paiementsError } = await supabaseAdmin
      .from('paiementsSuivi')
      .select('*')
      .eq('devisId', devisId)
      .order('datePaiementPrevue', { ascending: true });

    if (paiementsError) {
      console.error('⚠️ Erreur paiements:', paiementsError);
    }

    // Parser les articles (stockés en JSON)
    let articles = [];
    try {
      articles = JSON.parse(devis.articles);
    } catch (e) {
      console.error('Erreur parsing articles:', e);
      articles = [];
    }

    console.log('✅ Devis récupéré:', devis.numeroDevis);

    return NextResponse.json({
      success: true,
      devis: {
        ...devis,
        articles // Articles parsés
      },
      paiements: paiements || [],
      stats: {
        montantTotal: devis.total,
        montantPaye: devis.montantPaye,
        resteAPayer: devis.total - devis.montantPaye,
        pourcentagePaye: ((devis.montantPaye / devis.total) * 100).toFixed(2)
      }
    });

  } catch (error: any) {
    console.error('💥 Erreur Devis Detail API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}