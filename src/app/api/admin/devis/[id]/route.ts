import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Détails d'un devis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: devisId } = await params;

    const { data: devis, error } = await supabaseAdmin
      .from('devis')
      .select(`
        *,
        patient:patients(id, prenom, nom, email, telephone, pays),
        sejour:sejours(id, typeTraitement, dateArrivee, dateDepart),
        recus(*)
      `)
      .eq('id', devisId)
      .single();

    if (error || !devis) {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(devis);
  } catch (error) {
    console.error("Erreur récupération devis:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un devis (ou statut paiement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: devisId } = await params;
    const updates = await request.json();

    delete updates.id;
    delete updates.dateCreation;
    delete updates.numeroDevis; // Le numéro ne change jamais

    const { data: updatedDevis, error } = await supabaseAdmin
      .from('devis')
      .update({
        ...updates,
        dateMiseAJour: new Date().toISOString(),
      })
      .eq('id', devisId)
      .select(`
        *,
        patient:patients(prenom, nom)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      devis: updatedDevis,
    });
  } catch (error) {
    console.error("Erreur mise à jour devis:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un devis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: devisId } = await params;
    const { error } = await supabaseAdmin
      .from('devis')
      .delete()
      .eq('id', devisId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Devis supprimé",
    });
  } catch (error) {
    console.error("Erreur suppression devis:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}