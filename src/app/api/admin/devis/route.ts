import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Liste tous les devis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const statutPaiement = searchParams.get('statutPaiement');

    let query = supabaseAdmin
      .from('devis')
      .select(`
        *,
        patient:patients(id, prenom, nom, email, telephone),
        sejour:sejours(id, typeTraitement, dateArrivee),
        recus(id, montant, datePaiement)
      `)
      .order('dateCreation', { ascending: false });

    if (patientId) {
      query = query.eq('patientId', patientId);
    }

    if (statutPaiement && statutPaiement !== 'TOUS') {
      query = query.eq('statutPaiement', statutPaiement);
    }

    const { data: devis, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(devis || []);
  } catch (error) {
    console.error("Erreur chargement devis:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des devis" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau devis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      sejourId,
      articles, // Array d'objets déjà formatés
      sousTotal, // ✅ Reçu du frontend
      taxe = 0,
      total, // ✅ Reçu du frontend
      devise = "MAD",
      valideJusquau,
    } = body;

    console.log('📝 Création devis - Body reçu:', { 
      patientId, 
      sejourId, 
      articlesCount: articles?.length,
      sousTotal,
      taxe,
      total,
      devise,
      valideJusquau
    });

    // Validation
    if (!patientId || !articles || articles.length === 0 || !valideJusquau) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (patientId, articles, valideJusquau)" },
        { status: 400 }
      );
    }

    // Validation du sous-total et total
    if (sousTotal === undefined || sousTotal === null) {
      return NextResponse.json(
        { error: "Le sous-total est requis" },
        { status: 400 }
      );
    }

    if (total === undefined || total === null) {
      return NextResponse.json(
        { error: "Le total est requis" },
        { status: 400 }
      );
    }

    // Générer un numéro de devis unique
    const numeroDevis = `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    console.log('💾 Insertion devis avec:', {
      numeroDevis,
      sousTotal,
      taxe,
      total
    });

    // Créer le devis
    const { data: newDevis, error } = await supabaseAdmin
      .from('devis')
      .insert({
        patientId,
        sejourId: sejourId || null,
        numeroDevis,
        articles: JSON.stringify(articles),
        sousTotal, // ✅ Envoyé explicitement
        taxe,
        total, // ✅ Envoyé explicitement
        devise,
        statutPaiement: 'EN_ATTENTE',
        montantPaye: 0,
        valideJusquau,
      })
      .select(`
        *,
        patient:patients(prenom, nom, email)
      `)
      .single();

    if (error) {
      console.error('❌ Erreur insertion:', error);
      throw error;
    }

    console.log('✅ Devis créé:', newDevis.id);

    return NextResponse.json({
      success: true,
      devis: newDevis,
    });
  } catch (error: any) {
    console.error("💥 Erreur création devis:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du devis", details: error.message },
      { status: 500 }
    );
  }
}