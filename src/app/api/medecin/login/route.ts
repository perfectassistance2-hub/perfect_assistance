// Fichier: app/api/auth/medecin/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
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

    // Récupérer le médecin
    const { data: medecin, error } = await supabaseAdmin
      .from("medecins")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !medecin) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Vérifier si le compte est actif
    if (!medecin.estActif) {
      return NextResponse.json(
        { error: "Compte désactivé. Contactez l'administration." },
        { status: 403 }
      );
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(motDePasse, medecin.motDePasse || '');
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Mettre à jour la dernière connexion
    await supabaseAdmin
      .from("medecins")
      .update({ derniereConnexion: new Date().toISOString() })
      .eq("id", medecin.id);

    // Vérifier si c'est la première connexion
    const premiereConnexion = !medecin.derniereConnexion;

    // Créer le token JWT
    const token = await new SignJWT({
      userId: medecin.id,
      email: medecin.email,
      role: 'medecin',
      prenom: medecin.prenom,
      nom: medecin.nom
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET);

    // Créer la réponse avec le cookie
    const response = NextResponse.json({
      success: true,
      premiereConnexion,
      medecin: {
        id: medecin.id,
        prenom: medecin.prenom,
        nom: medecin.nom,
        email: medecin.email,
        specialite: medecin.specialite,
        telephone: medecin.telephone
      }
    });

    // Définir le cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 jours
    });

    return response;
  } catch (error: any) {
    console.error("Erreur lors de la connexion médecin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}