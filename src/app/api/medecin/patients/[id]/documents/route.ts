import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

// GET - Liste des documents du patient
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

    const patientId = params.id;

    // Vérifier accès
    const { data: sejour } = await supabaseAdmin
      .from("sejours")
      .select("id")
      .eq("patientId", patientId)
      .eq("medecinId", user.userId)
      .maybeSingle();

    if (!sejour) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Récupérer les documents
    const { data: documents } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("patientId", patientId)
      .order("dateTeleversement", { ascending: false });

    return NextResponse.json({
      success: true,
      documents: documents || []
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Ajouter un document
export async function POST(
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

    const patientId = params.id;
    const body = await request.json();

    // Vérifier accès
    const { data: sejour } = await supabaseAdmin
      .from("sejours")
      .select("id")
      .eq("patientId", patientId)
      .eq("medecinId", user.userId)
      .maybeSingle();

    if (!sejour) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Créer le document
    const { data: document, error } = await supabaseAdmin
      .from("documents")
      .insert({
        patientId,
        type: body.type,
        titre: body.titre,
        description: body.description,
        urlFichier: body.urlFichier,
        nomFichier: body.nomFichier,
        tailleFichier: body.tailleFichier,
        typeMime: body.typeMime,
        partageAvecMedecin: true,
        medecinPartageId: user.userId,
        ajoutePar: 'medecin'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      document
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}