import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Détails d'une clinique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cliniquesId } = await params;
    const { data: clinique, error } = await supabaseAdmin
      .from('cliniques')
      .select(`
        *,
        medecins(id, prenom, nom, specialite),
        rendez_vous(count),
        sejours(count)
      `)
      .eq('id', cliniquesId)
      .single();

    if (error || !clinique) {
      return NextResponse.json(
        { error: "Clinique non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(clinique);
  } catch (error) {
    console.error("Erreur récupération clinique:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une clinique
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cliniquesId } = await params;
    const updates = await request.json();

    delete updates.id;
    delete updates.dateCreation;

    const { data: updatedClinique, error } = await supabaseAdmin
      .from('cliniques')
      .update({
        ...updates,
        dateMiseAJour: new Date().toISOString(),
      })
      .eq('id', cliniquesId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      clinique: updatedClinique,
    });
  } catch (error) {
    console.error("Erreur mise à jour clinique:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une clinique
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cliniquesId } = await params;
    const { error } = await supabaseAdmin
      .from('cliniques')
      .delete()
      .eq('id', cliniquesId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Clinique supprimée",
    });
  } catch (error) {
    console.error("Erreur suppression clinique:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}