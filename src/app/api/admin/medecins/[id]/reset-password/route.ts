import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST - Réinitialiser le mot de passe d'un médecin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: medecinId } = await params;

    // Générer un mot de passe temporaire aléatoire
    const motDePasseTemporaire = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();
    
    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(motDePasseTemporaire, 10);

    // Mettre à jour le médecin dans la base de données
    const { data: medecin, error } = await supabaseAdmin
      .from('medecins')
      .update({
        motDePasse: motDePasseHash,
        doitChangerMotDePasse: true,
        dateMiseAJour: new Date().toISOString(),
      })
      .eq('id', medecinId)
      .select('id, prenom, nom, email')
      .single();

    if (error || !medecin) {
      throw new Error("Médecin non trouvé");
    }

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
      motDePasseTemporaire,
      medecin: {
        id: medecin.id,
        prenom: medecin.prenom,
        nom: medecin.nom,
        email: medecin.email,
      }
    });
  } catch (error) {
    console.error("Erreur réinitialisation mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation du mot de passe" },
      { status: 500 }
    );
  }
}