// app/api/admin/medecins-referents/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isEmailAlreadyUsed } from "@/lib/email-validator"; // ✅ NOUVEAU

// =====================================================
// GET - Liste des médecins référents
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actif = searchParams.get("actif");
    const pays = searchParams.get("pays");
    
    let query = supabaseAdmin
      .from("medecins_referents")
      .select(`
        *,
        patients:patients!patients_medecin_referent_fkey(id)
      `)
      .order("datecreation", { ascending: false });

    if (actif === "true") {
      query = query.eq("estactif", true);
    } else if (actif === "false") {
      query = query.eq("estactif", false);
    }

    if (pays) {
      query = query.eq("pays", pays);
    }

    const { data: medecins, error } = await query;

    if (error) {
      console.error("Erreur récupération médecins référents:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des médecins référents" },
        { status: 500 }
      );
    }

    const medecinsAvecCount = medecins?.map((medecin) => ({
      ...medecin,
      _count: {
        patients: medecin.patients?.length || 0,
      },
      patients: undefined,
    }));

    return NextResponse.json(medecinsAvecCount || []);
  } catch (error) {
    console.error("Erreur GET medecins-referents:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// =====================================================
// POST - Créer un médecin référent
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nom,
      prenom,
      email,
      telephone,
      specialite,
      etablissement,
      ville,
      pays,
      adresse,
      notes,
    } = body;

    console.log('📝 POST /api/admin/medecins-referents - Création:', email);

    // Validation
    if (!nom || !prenom || !email || !telephone || !pays) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (nom, prénom, email, téléphone, pays)" },
        { status: 400 }
      );
    }

    // ✅ NOUVEAU - Vérification email cross-tables
    const emailCheck = await isEmailAlreadyUsed(email);
    if (emailCheck.isUsed) {
      console.log(`❌ Email déjà utilisé dans: ${emailCheck.usedIn}`);
      return NextResponse.json(
        { error: emailCheck.message },
        { status: 400 }
      );
    }

    // Créer le médecin référent
    const { data: newMedecin, error: insertError } = await supabaseAdmin
      .from("medecins_referents")
      .insert({
        nom,
        prenom,
        email: email.toLowerCase(),
        telephone,
        specialite: specialite || null,
        etablissement: etablissement || null,
        ville: ville || null,
        pays,
        adresse: adresse || null,
        notes: notes || null,
        estactif: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erreur insertion médecin référent:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création du médecin référent" },
        { status: 500 }
      );
    }

    console.log("✅ Médecin référent créé:", newMedecin.id);

    return NextResponse.json(newMedecin, { status: 201 });
  } catch (error: any) {
    console.error("Erreur POST medecins-referents:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}