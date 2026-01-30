// app/api/admin/comptabilite/paiements/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Détails d'un paiement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: paiement, error } = await supabaseAdmin
      .from("paiements")
      .select(`
        *,
        patient:patients(id, prenom, nom, email, telephone, pays, ville),
        clinique:cliniques(id, nom, adresse, ville, pays, telephone, email),
        medecin:medecins(id, prenom, nom, specialite, telephone, email),
        medecinReferent:medecins_referents(id, prenom, nom, specialite, email, telephone, pays),
        sejour:sejours(
          id,
          typeTraitement,
          descriptionTraitement,
          dateArrivee,
          dateDepart,
          dateTraitement,
          statut
        )
      `)
      .eq("id", id)
      .single();

    if (error || !paiement) {
      return NextResponse.json(
        { error: "Paiement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ paiement });
  } catch (error: any) {
    console.error("Erreur récupération paiement:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un paiement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    // Champs non modifiables
    delete updates.id;
    delete updates.sejourId;
    delete updates.patientId;
    delete updates.dateCreation;

    // Mise à jour
    const { data: updatedPaiement, error } = await supabaseAdmin
      .from("paiements")
      .update({
        ...updates,
        dateMiseAJour: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        patient:patients(prenom, nom, email),
        clinique:cliniques(nom),
        medecin:medecins(prenom, nom),
        medecinReferent:medecins_referents(prenom, nom),
        sejour:sejours(typeTraitement)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      paiement: updatedPaiement,
    });
  } catch (error: any) {
    console.error("Erreur mise à jour paiement:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un paiement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("paiements")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Paiement supprimé avec succès",
    });
  } catch (error: any) {
    console.error("Erreur suppression paiement:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}