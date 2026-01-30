// app/api/admin/medecins-referents/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// =====================================================
// GET - Détails d'un médecin référent

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data: medecin, error } = await supabaseAdmin
      .from("medecins_referents")
      .select(`
        *,
        patients:patients!patients_medecin_referent_fkey(
          id,
          prenom,
          nom,
          email,
          telephone,
          statut,
          dateCreation
        )
      `)
      .eq("id", id)
      .single();

    if (error || !medecin) {
      return NextResponse.json(
        { error: "Médecin référent non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(medecin);
  } catch (error) {
    console.error("Erreur GET médecin référent:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH - Modifier un médecin référent
// =====================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Vérifier que le médecin existe
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("medecins_referents")
      .select("id, email")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Médecin référent non trouvé" },
        { status: 404 }
      );
    }

    // Si l'email change, vérifier qu'il n'est pas déjà utilisé
    if (body.email && body.email !== existing.email) {
      const { data: emailExists } = await supabaseAdmin
        .from("medecins_referents")
        .select("id")
        .eq("email", body.email)
        .neq("id", id)
        .single();

      if (emailExists) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé par un autre médecin référent" },
          { status: 400 }
        );
      }
    }

    // Préparer les données à mettre à jour
    const updates: any = {
      datemiseajour: new Date().toISOString(),
    };

    // Champs modifiables
    const allowedFields = [
      'nom', 'prenom', 'email', 'telephone', 'specialite',
      'etablissement', 'ville', 'pays', 'adresse', 'notes', 'estactif'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // Mettre à jour
    const { data: updatedMedecin, error: updateError } = await supabaseAdmin
      .from("medecins_referents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur mise à jour médecin référent:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Médecin référent mis à jour avec succès",
      medecin: updatedMedecin,
    });
  } catch (error: any) {
    console.error("Erreur PATCH médecin référent:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE - Supprimer un médecin référent
// =====================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Vérifier que le médecin existe
    const { data: medecin, error: checkError } = await supabaseAdmin
      .from("medecins_referents")
      .select("id, prenom, nom")
      .eq("id", id)
      .single();

    if (checkError || !medecin) {
      return NextResponse.json(
        { error: "Médecin référent non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des patients liés
    const { data: patientsLies, error: patientsError } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("medecinreferentid", id);

    if (patientsLies && patientsLies.length > 0) {
      // Détacher les patients (ON DELETE SET NULL le fait automatiquement)
      console.log(`${patientsLies.length} patient(s) détaché(s) du médecin référent ${id}`);
    }

    // Supprimer le médecin référent
    const { error: deleteError } = await supabaseAdmin
      .from("medecins_referents")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Erreur suppression médecin référent:", deleteError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    console.log("Médecin référent supprimé:", id);

    return NextResponse.json({
      message: "Médecin référent supprimé avec succès",
      patientsDetaches: patientsLies?.length || 0,
    });
  } catch (error: any) {
    console.error("Erreur DELETE médecin référent:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}