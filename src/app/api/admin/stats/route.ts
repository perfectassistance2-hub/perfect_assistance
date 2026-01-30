import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // Compter les patients
    const { count: totalPatients } = await supabaseAdmin
      .from('patients')
      .select('*', { count: 'exact', head: true });

    // Compter les rendez-vous
    const { count: totalRendezVous } = await supabaseAdmin
      .from('rendez_vous')
      .select('*', { count: 'exact', head: true });

    // Compter les séjours
    const { count: totalSejours } = await supabaseAdmin
      .from('sejours')
      .select('*', { count: 'exact', head: true });

    // Compter les cliniques
    const { count: totalCliniques } = await supabaseAdmin
      .from('cliniques')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      totalPatients: totalPatients || 0,
      totalRendezVous: totalRendezVous || 0,
      totalSejours: totalSejours || 0,
      totalCliniques: totalCliniques || 0,
    });
  } catch (error) {
    console.error("Erreur chargement stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}