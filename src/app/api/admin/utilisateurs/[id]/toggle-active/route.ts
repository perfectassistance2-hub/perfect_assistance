import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: utilisateursId } = await params;
    const userId = utilisateursId;

    // Récupérer l'utilisateur actuel
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, role, estActif')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Empêcher la désactivation d'un SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Impossible de désactiver un Super Admin" },
        { status: 403 }
      );
    }

    // Inverser le statut
    const { error } = await supabaseAdmin
      .from('utilisateurs')
      .update({ estActif: !user.estActif })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: user.estActif ? "Utilisateur désactivé" : "Utilisateur activé",
    });
  } catch (error) {
    console.error("Erreur toggle actif:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du statut" },
      { status: 500 }
    );
  }
}