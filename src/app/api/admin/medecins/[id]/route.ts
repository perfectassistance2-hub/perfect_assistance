import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ✅ GET - Détails d'un médecin
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ CORRIGÉ
) {
  try {
    const { id: medecinsId } = await context.params;  // ✅ CORRIGÉ
    
    const { data: medecin, error } = await supabaseAdmin
      .from('medecins')
      .select(`
        *,
        clinique:cliniques(id, nom, ville, telephone),
        rendez_vous(count),
        sejours(count)
      `)
      .eq('id', medecinsId)
      .single();

    if (error || !medecin) {
      return NextResponse.json(
        { error: "Médecin non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(medecin);
  } catch (error) {
    console.error("Erreur récupération médecin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// ✅ PATCH - Mettre à jour un médecin
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ CORRIGÉ
) {
  try {
    const { id: medecinsId } = await context.params;  // ✅ CORRIGÉ
    const updates = await request.json();

    delete updates.id;
    delete updates.dateCreation;

    const { data: updatedMedecin, error } = await supabaseAdmin
      .from('medecins')
      .update({
        ...updates,
        dateMiseAJour: new Date().toISOString(),
      })
      .eq('id', medecinsId)
      .select(`
        *,
        clinique:cliniques(nom, ville)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      medecin: updatedMedecin,
    });
  } catch (error) {
    console.error("Erreur mise à jour médecin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Supprimer un médecin
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ CORRIGÉ
) {
  try {
    const { id: medecinsId } = await context.params;  // ✅ CORRIGÉ

    // Supprimer d'abord le compte utilisateur auth
    try {
      await supabaseAdmin.auth.admin.deleteUser(medecinsId);
    } catch (authError) {
      console.warn("Erreur suppression auth:", authError);
      // Continuer même si la suppression auth échoue
    }

    // Supprimer le médecin de la base de données
    const { error } = await supabaseAdmin
      .from('medecins')
      .delete()
      .eq('id', medecinsId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Médecin supprimé",
    });
  } catch (error) {
    console.error("Erreur suppression médecin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}