// ==========================================
// FICHIER: /app/api/medecin/patients/[id]/documents/route.ts
// CORRIGÉ POUR NEXT.JS 15+
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

// ✅ GET - Récupérer les documents d'un patient
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id: patientId } = await context.params;  // ✅ await
    const medecinId = user.userId;

    console.log('📄 Récupération documents patient:', patientId, 'par médecin:', medecinId);

    // Vérifier que le patient est bien affecté au médecin
    const { data: sejours } = await supabaseAdmin
      .from("sejours")
      .select("id")
      .eq("patientId", patientId)
      .eq("medecinId", medecinId);

    if (!sejours || sejours.length === 0) {
      return NextResponse.json(
        { error: "Patient non affecté à ce médecin" },
        { status: 403 }
      );
    }

    // Récupérer les documents partagés avec le médecin
    const { data: documents, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("patientId", patientId)
      .or(`partageAvecMedecin.eq.true,medecinPartageId.eq.${medecinId},ajoutePar.eq.medecin`)
      .order("dateTeleversement", { ascending: false });

    if (error) {
      console.error('❌ Erreur documents:', error);
      throw error;
    }

    console.log('✅ Documents chargés:', documents?.length || 0);

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

// ✅ POST - Ajouter un document pour un patient
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id: patientId } = await context.params;  // ✅ await
    const medecinId = user.userId;
    const body = await request.json();

    // Vérifier que le patient est bien affecté au médecin
    const { data: sejours } = await supabaseAdmin
      .from("sejours")
      .select("id")
      .eq("patientId", patientId)
      .eq("medecinId", medecinId);

    if (!sejours || sejours.length === 0) {
      return NextResponse.json(
        { error: "Patient non affecté à ce médecin" },
        { status: 403 }
      );
    }

    // Créer le document
    const { data: document, error } = await supabaseAdmin
      .from("documents")
      .insert({
        patientId,
        titre: body.titre,
        type: body.type,
        urlFichier: body.urlFichier,
        ajoutePar: 'medecin',
        medecinPartageId: medecinId,
        partageAvecMedecin: true,
        notes: body.notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création document:', error);
      throw error;
    }

    console.log('✅ Document créé:', document.id);

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