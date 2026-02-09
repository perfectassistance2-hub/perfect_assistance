// app/api/admin/utilisateurs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { isEmailAlreadyUsed } from "@/lib/email-validator"; // ✅ NOUVEAU

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

    console.log('📝 POST /api/admin/utilisateurs - Création:', email);

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

    // ✅ NOUVEAU - Vérification email cross-tables
    const emailCheck = await isEmailAlreadyUsed(email);
    if (emailCheck.isUsed) {
      console.log(`❌ Email déjà utilisé dans: ${emailCheck.usedIn}`);
      return NextResponse.json(
        { error: emailCheck.message },
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

    console.log('✅ Utilisateur créé:', newUser.id);

    // Retourner sans le mot de passe
    const { motDePasse: _, ...userSansMotDePasse } = newUser;

    return NextResponse.json({
      success: true,
      utilisateur: userSansMotDePasse,
    });
  } catch (error: any) {
    console.error("❌ Erreur création utilisateur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}