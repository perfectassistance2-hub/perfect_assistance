import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

// GET - Récupérer le dossier médical
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id: patientId } = await context.params;

    // Vérifier que le patient est bien affecté au médecin
    const { data: sejour } = await supabaseAdmin
      .from("sejours")
      .select("id")
      .eq("patientId", patientId)
      .eq("medecinId", user.userId)
      .maybeSingle();

    if (!sejour) {
      return NextResponse.json(
        { error: "Patient non affecté à ce médecin" },
        { status: 403 }
      );
    }

    // Récupérer le dossier médical
    const { data: dossier, error } = await supabaseAdmin
      .from("dossiers_medicaux")
      .select("*")
      .eq("patientId", patientId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      dossier: dossier || null
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour le dossier médical
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id: patientId } = await context.params;
    const body = await request.json();

    // Vérifier que le patient est bien affecté au médecin
    const { data: sejour } = await supabaseAdmin
      .from("sejours")
      .select("id")
      .eq("patientId", patientId)
      .eq("medecinId", user.userId)
      .maybeSingle();

    if (!sejour) {
      return NextResponse.json(
        { error: "Patient non affecté à ce médecin" },
        { status: 403 }
      );
    }

    // Vérifier si un dossier existe déjà
    const { data: existingDossier } = await supabaseAdmin
      .from("dossiers_medicaux")
      .select("id")
      .eq("patientId", patientId)
      .maybeSingle();

    let dossier;

    if (existingDossier) {
      // Mettre à jour
      const { data, error } = await supabaseAdmin
        .from("dossiers_medicaux")
        .update({
          ...body,
          dateMiseAJour: new Date().toISOString()
        })
        .eq("patientId", patientId)
        .select()
        .single();

      dossier = data;

      if (error) throw error;
    } else {
      // Créer
      const { data, error } = await supabaseAdmin
        .from("dossiers_medicaux")
        .insert({
          patientId,
          ...body
        })
        .select()
        .single();

      dossier = data;

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      dossier
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}