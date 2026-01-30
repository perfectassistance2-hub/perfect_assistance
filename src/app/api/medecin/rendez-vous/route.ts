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

    const { data: rendezVous } = await supabaseAdmin
      .from("rendez_vous")
      .select(`
        *,
        patient:patients(id, prenom, nom, telephone, email, dateNaissance),
        clinique:cliniques(id, nom, ville, pays)
      `)
      .eq("medecinId", user.userId)
      .order("datePrevue", { ascending: false });

    return NextResponse.json({
      success: true,
      rendezVous: rendezVous || []
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}