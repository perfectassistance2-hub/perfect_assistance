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

    // Récupérer tous les patients liés aux séjours du médecin
    const { data: sejours } = await supabaseAdmin
      .from("sejours")
      .select(`
        *,
        patient:patients(
          id, prenom, nom, email, telephone, dateNaissance,
          sexe, pays, ville, nationalite, statut
        )
      `)
      .eq("medecinId", user.userId)
      .order("dateCreation", { ascending: false });

    // Grouper par patient (éviter les doublons)
    const patientsMap = new Map();
    
    sejours?.forEach(sejour => {
      if (sejour.patient && !patientsMap.has(sejour.patient.id)) {
        patientsMap.set(sejour.patient.id, {
          ...sejour.patient,
          dernierSejour: {
            id: sejour.id,
            typeTraitement: sejour.typeTraitement,
            dateArrivee: sejour.dateArrivee,
            dateDepart: sejour.dateDepart,
            statut: sejour.statut
          }
        });
      }
    });

    const patients = Array.from(patientsMap.values());

    return NextResponse.json({
      success: true,
      patients
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}