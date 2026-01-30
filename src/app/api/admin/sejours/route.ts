import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Liste tous les séjours
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const statut = searchParams.get('statut');

    let query = supabaseAdmin
      .from('sejours')
      .select(`
        *,
        patient:patients(id, prenom, nom, email, telephone, pays),
        coordinateur:utilisateurs!sejours_coordinateurId_fkey(id, prenom, nom),
        clinique:cliniques(id, nom, ville),
        medecin:medecins(id, prenom, nom, specialite)
      `)
      .order('dateArrivee', { ascending: false });

    if (patientId) {
      query = query.eq('patientId', patientId);
    }

    if (statut && statut !== 'TOUS') {
      query = query.eq('statut', statut);
    }

    const { data: sejours, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(sejours || []);
  } catch (error) {
    console.error("Erreur chargement séjours:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des séjours" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau séjour
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      coordinateurId,
      cliniqueId,
      medecinId,
      dateArrivee,
      dateDepart,
      dateTraitement,
      typeTraitement,
      descriptionTraitement,
      hebergementNecessaire,
      detailsHebergement,
      transportNecessaire,
      detailsTransport,
      notes,
    } = body;

    // Validation
    if (!patientId || !coordinateurId || !cliniqueId || !dateArrivee || !dateDepart || !typeTraitement) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // Vérifier que les dates sont cohérentes
    if (new Date(dateDepart) <= new Date(dateArrivee)) {
      return NextResponse.json(
        { error: "La date de départ doit être après la date d'arrivée" },
        { status: 400 }
      );
    }

    // Créer le séjour
    const { data: newSejour, error } = await supabaseAdmin
      .from('sejours')
      .insert({
        patientId,
        coordinateurId,
        cliniqueId,
        medecinId: medecinId || null,
        statut: 'PLANIFIE',
        dateArrivee,
        dateDepart,
        dateTraitement: dateTraitement || null,
        typeTraitement,
        descriptionTraitement: descriptionTraitement || null,
        hebergementNecessaire: hebergementNecessaire || false,
        detailsHebergement: detailsHebergement || null,
        transportNecessaire: transportNecessaire || false,
        detailsTransport: detailsTransport || null,
        notes: notes || null,
      })
      .select(`
        *,
        patient:patients(prenom, nom),
        clinique:cliniques(nom),
        medecin:medecins(prenom, nom)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      sejour: newSejour,
    });
  } catch (error) {
    console.error("Erreur création séjour:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du séjour" },
      { status: 500 }
    );
  }
}