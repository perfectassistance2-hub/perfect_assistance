// app/api/admin/connexion/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose"; // ✅ AJOUTER

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-change-moi'
);

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

    // ✅ NOUVEAU : Créer le JWT token
    const token = await new SignJWT({
      userId: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role, // 'admin' ou 'super_admin'
      prenom: utilisateur.prenom,
      nom: utilisateur.nom
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET);

    // ✅ NOUVEAU : Créer la réponse avec le cookie
    const { motDePasse: _, ...utilisateurSansMotDePasse } = utilisateur;

    const response = NextResponse.json({
      success: true,
      utilisateur: utilisateurSansMotDePasse,
    });

    // ✅ NOUVEAU : Définir le cookie auth-token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/'
    });

    console.log('✅ Admin connecté:', utilisateur.email);

    return response;

  } catch (error) {
    console.error("Erreur login:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}