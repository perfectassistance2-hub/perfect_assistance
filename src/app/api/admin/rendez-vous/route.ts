import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Liste tous les rendez-vous
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const statut = searchParams.get('statut');

    let query = supabaseAdmin
      .from('rendez_vous')
      .select(`
        *,
        patient:patients(id, prenom, nom, email, telephone),
        medecin:medecins(id, prenom, nom, specialite),
        clinique:cliniques(id, nom, ville)
      `)
      .order('datePrevue', { ascending: false });

    if (patientId) {
      query = query.eq('patientId', patientId);
    }

    if (statut && statut !== 'TOUS') {
      query = query.eq('statut', statut);
    }

    const { data: rendezVous, error } = await query;

    if (error) {
      console.error("Erreur Supabase:", error);
      throw error;
    }

    return NextResponse.json(rendezVous || []);
  } catch (error) {
    console.error("Erreur chargement rendez-vous:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des rendez-vous" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau rendez-vous
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      medecinId,
      cliniqueId,
      type,
      datePrevue,
      duree = 30,
      raison,
      notes,
      creePar,
    } = body;

    // Validation des champs obligatoires
    if (!patientId || !type || !datePrevue || !creePar) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (patientId, type, datePrevue, creePar)" },
        { status: 400 }
      );
    }

    // Vérifier que le patient existe
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Patient non trouvé" },
        { status: 404 }
      );
    }

    // Créer le rendez-vous
    const { data: newRendezVous, error } = await supabaseAdmin
      .from('rendez_vous')
      .insert({
        patientId,
        medecinId: medecinId || null,
        cliniqueId: cliniqueId || null,
        creePar,
        type,
        statut: 'PLANIFIE',
        datePrevue,
        duree: parseInt(duree),
        raison: raison || null,
        notes: notes || null,
      })
      .select(`
        *,
        patient:patients(id, prenom, nom, email),
        medecin:medecins(id, prenom, nom, specialite),
        clinique:cliniques(id, nom, ville)
      `)
      .single();

    if (error) {
      console.error("Erreur insertion Supabase:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      rendezVous: newRendezVous,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur création rendez-vous:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du rendez-vous" },
      { status: 500 }
    );
  }
}