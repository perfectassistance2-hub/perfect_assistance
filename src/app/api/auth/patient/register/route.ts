import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    console.log('📝 Tentative inscription:', formData.email);

    const requiredFields = ['prenom', 'nom', 'email', 'motDePasse', 'telephone', 'pays'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    if (formData.motDePasse.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Vérifier si email existe
    const { data: existingPatient } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("email", formData.email.toLowerCase())
      .maybeSingle();

    if (existingPatient) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(formData.motDePasse, 10);

    // ✅ CORRECTION : Créer le patient SANS le flag doitChangerMotDePasse
    const { data: patient, error: insertError } = await supabaseAdmin
      .from("patients")
      .insert({
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email.toLowerCase(),
        motDePasse: hashedPassword,
        telephone: formData.telephone,
        pays: formData.pays,
        dateNaissance: '2000-01-01',
        sexe: 'Non spécifié',
        nationalite: formData.pays,
        statut: 'EN_ATTENTE',
        estActif: true,
        langue: 'fr',
        doitChangerMotDePasse: false, // ✅ FALSE car inscription volontaire
        derniereConnexion: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erreur Supabase:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création du compte: " + insertError.message },
        { status: 500 }
      );
    }

    if (!patient) {
      return NextResponse.json(
        { error: "Erreur lors de la création du compte" },
        { status: 500 }
      );
    }

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
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log('✅ Inscription réussie pour:', formData.email);
    return response;

  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription: " + error.message },
      { status: 500 }
    );
  }
}