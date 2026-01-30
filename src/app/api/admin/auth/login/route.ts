import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, motDePasse } = await request.json();

    // Validation
    if (!email || !motDePasse) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Recherche de l'utilisateur avec Supabase
    const { data: utilisateur, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !utilisateur) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérification du mot de passe
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);

    if (!motDePasseValide) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérification que l'utilisateur est actif
    if (!utilisateur.estActif) {
      return NextResponse.json(
        { error: "Compte désactivé" },
        { status: 403 }
      );
    }

    // Mise à jour de la dernière connexion
    await supabaseAdmin
      .from('utilisateurs')
      .update({ derniereConnexion: new Date().toISOString() })
      .eq('id', utilisateur.id);

    // Retour des informations utilisateur (sans le mot de passe)
    const { motDePasse: _, ...utilisateurSansMotDePasse } = utilisateur;

    return NextResponse.json({
      success: true,
      utilisateur: utilisateurSansMotDePasse,
    });
  } catch (error) {
    console.error("Erreur login:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}