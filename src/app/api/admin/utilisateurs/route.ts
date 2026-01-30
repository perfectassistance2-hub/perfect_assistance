import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// GET - Liste tous les utilisateurs
export async function GET() {
  try {
    const { data: utilisateurs, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*')
      .order('dateCreation', { ascending: false });

    if (error) {
      throw error;
    }

    // Retirer les mots de passe
    const utilisateursSansMotDePasse = utilisateurs.map(({ motDePasse, ...user }) => user);

    return NextResponse.json(utilisateursSansMotDePasse);
  } catch (error) {
    console.error("Erreur chargement utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des utilisateurs" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const { email, prenom, nom, role, telephone, motDePasse } = await request.json();

    // Validation
    if (!email || !prenom || !nom || !role || !motDePasse) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    if (motDePasse.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Vérifier que l'email n'existe pas déjà
    const { data: existing } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(motDePasse, 10);

    // Créer l'utilisateur
    const { data: newUser, error } = await supabaseAdmin
      .from('utilisateurs')
      .insert({
        email: email.toLowerCase(),
        prenom,
        nom,
        role,
        telephone: telephone || null,
        motDePasse: motDePasseHash,
        estActif: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Retourner sans le mot de passe
    const { motDePasse: _, ...userSansMotDePasse } = newUser;

    return NextResponse.json({
      success: true,
      utilisateur: userSansMotDePasse,
    });
  } catch (error) {
    console.error("Erreur création utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}