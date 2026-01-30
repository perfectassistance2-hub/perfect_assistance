import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

// GET - Récupérer le profil
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { data: medecin } = await supabaseAdmin
      .from("medecins")
      .select(`
        *,
        clinique:cliniques(id, nom, ville, pays, telephone, email, siteWeb)
      `)
      .eq("id", user.userId)
      .single();

    if (!medecin) {
      return NextResponse.json(
        { error: "Médecin introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      medecin
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour le profil
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Champs autorisés à modifier
    const allowedFields = [
      'prenom',
      'nom',
      'telephone',
      'specialite',
      'numeroLicence',
      'anneesExperience'
    ];

    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.dateMiseAJour = new Date().toISOString();

    const { data: medecin, error } = await supabaseAdmin
      .from("medecins")
      .update(updateData)
      .eq("id", user.userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      medecin
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}