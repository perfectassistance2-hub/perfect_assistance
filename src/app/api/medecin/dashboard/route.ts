import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const medecinId = user.userId;

    // Récupérer le médecin
    const { data: medecin } = await supabaseAdmin
      .from("medecins")
      .select(`
        *,
        clinique:cliniques(id, nom, ville, pays, telephone, email, siteWeb)
      `)
      .eq("id", medecinId)
      .single();

    if (!medecin) {
      return NextResponse.json(
        { error: "Médecin introuvable" },
        { status: 404 }
      );
    }

    // Patients affectés au médecin
    const { count: patientsCount } = await supabaseAdmin
      .from("sejours")
      .select("*", { count: 'exact', head: true })
      .eq("medecinId", medecinId)
      .in("statut", ["PLANIFIE", "EN_COURS"]);

    // Prochains rendez-vous
    const { data: prochainsRendezVous } = await supabaseAdmin
      .from("rendez_vous")
      .select(`
        *,
        patient:patients(id, prenom, nom, telephone, email)
      `)
      .eq("medecinId", medecinId)
      .gte("datePrevue", new Date().toISOString())
      .in("statut", ["PLANIFIE", "CONFIRME"])
      .order("datePrevue", { ascending: true })
      .limit(5);

    // Rendez-vous aujourd'hui
    const aujourdhuiDebut = new Date();
    aujourdhuiDebut.setHours(0, 0, 0, 0);
    const aujourdhuiFin = new Date();
    aujourdhuiFin.setHours(23, 59, 59, 999);

    const { count: rendezVousAujourdhui } = await supabaseAdmin
      .from("rendez_vous")
      .select("*", { count: 'exact', head: true })
      .eq("medecinId", medecinId)
      .gte("datePrevue", aujourdhuiDebut.toISOString())
      .lte("datePrevue", aujourdhuiFin.toISOString());

    // Patients en séjour actif
    const { data: sejoursActifs } = await supabaseAdmin
      .from("sejours")
      .select(`
        *,
        patient:patients(id, prenom, nom, telephone, email, dateNaissance)
      `)
      .eq("medecinId", medecinId)
      .eq("statut", "EN_COURS")
      .order("dateArrivee", { ascending: true });

    // Messages non lus
    const { count: messagesNonLus } = await supabaseAdmin
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("destinataireId", medecinId)
      .eq("estLu", false);

    return NextResponse.json({
      success: true,
      medecin: {
        id: medecin.id,
        prenom: medecin.prenom,
        nom: medecin.nom,
        email: medecin.email,
        specialite: medecin.specialite,
        telephone: medecin.telephone,
        numeroLicence: medecin.numeroLicence,
        anneesExperience: medecin.anneesExperience,
        clinique: medecin.clinique,
        role: 'medecin'
      },
      stats: {
        patientsCount: patientsCount || 0,
        rendezVousAujourdhui: rendezVousAujourdhui || 0,
        prochainsRendezVous: prochainsRendezVous || [],
        sejoursActifs: sejoursActifs || [],
        messagesNonLus: messagesNonLus || 0
      }
    });

  } catch (error: any) {
    console.error("💥 Erreur dashboard médecin:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}