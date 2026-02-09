// app/api/auth/patient/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { isEmailAlreadyUsed } from "@/lib/email-validator"; // ✅ NOUVEAU

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-change-moi'
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    console.log('📝 Tentative inscription patient:', formData.email);

    // Validation des champs obligatoires
    const requiredFields = ['prenom', 'nom', 'email', 'motDePasse', 'telephone', 'pays'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      );
    }

    // Validation mot de passe
    if (formData.motDePasse.length < 8) {
      return NextResponse.json(
        { error: "Mot de passe trop court (minimum 8 caractères)" },
        { status: 400 }
      );
    }

    // ✅ NOUVEAU - Vérification email cross-tables
    const emailCheck = await isEmailAlreadyUsed(formData.email);
    if (emailCheck.isUsed) {
      console.log(`❌ Email déjà utilisé dans: ${emailCheck.usedIn}`);
      
      // Message personnalisé selon la table
      let errorMessage = emailCheck.message;
      
      if (emailCheck.usedIn === 'medecins') {
        errorMessage = "Cet email est déjà associé à un compte médecin. Veuillez utiliser un autre email ou vous connecter en tant que médecin.";
      } else if (emailCheck.usedIn === 'medecins_referents') {
        errorMessage = "Cet email est déjà associé à un compte médecin référent. Veuillez contacter l'administration.";
      } else if (emailCheck.usedIn === 'utilisateurs') {
        errorMessage = "Cet email est déjà associé à un compte administrateur. Veuillez vous connecter via l'espace admin.";
      } else if (emailCheck.usedIn === 'patients') {
        errorMessage = "Cet email est déjà utilisé. Avez-vous déjà un compte ? Essayez de vous connecter.";
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(formData.motDePasse, 10);

    // Créer le patient
    const { data: patient, error: insertError } = await supabaseAdmin
      .from("patients")
      .insert({
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email.toLowerCase(),
        motDePasse: hashedPassword,
        telephone: formData.telephone,
        pays: formData.pays,
        dateNaissance: formData.dateNaissance || '2000-01-01',
        sexe: formData.sexe || 'Non spécifié',
        nationalite: formData.nationalite || formData.pays,
        statut: 'EN_ATTENTE',
        estActif: true,
        langue: 'fr',
        derniereConnexion: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !patient) {
      console.error('❌ Erreur insertion:', insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création du compte: " + (insertError?.message || 'inconnue') },
        { status: 500 }
      );
    }

    console.log('✅ Patient créé:', patient.id);

    // Créer JWT
    const token = await new SignJWT({
      userId: patient.id,
      email: patient.email,
      role: 'patient',
      prenom: patient.prenom,
      nom: patient.nom
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        prenom: patient.prenom,
        nom: patient.nom,
        email: patient.email,
        telephone: patient.telephone
      }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/'
    });

    console.log('✅ Inscription et connexion réussies');
    return response;

  } catch (error: any) {
    console.error("💥 Erreur inscription patient:", error.message);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}