import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function POST(request: NextRequest) {
  try {
    const { email, motDePasse } = await request.json();

    console.log('🔐 Connexion patient - Email:', email);

    if (!email || !motDePasse) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Récupérer le patient
    const { data: patients, error: fetchError } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("email", email.toLowerCase())
      .limit(1);

    if (fetchError) {
      console.error('❌ Erreur Supabase:', fetchError);
      return NextResponse.json(
        { error: "Erreur base de données" },
        { status: 500 }
      );
    }

    if (!patients || patients.length === 0) {
      console.log('❌ Patient non trouvé:', email);
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const patient = patients[0];
    console.log('✅ Patient trouvé:', patient.id);

    // Vérifier si le compte est actif
    if (!patient.estActif) {
      return NextResponse.json(
        { error: "Compte désactivé" },
        { status: 403 }
      );
    }

    // Vérifier le mot de passe
    if (!patient.motDePasse) {
      console.log('⚠️ Pas de mot de passe pour:', email);
      return NextResponse.json(
        { error: "Compte non initialisé. Contactez l'administrateur." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(motDePasse, patient.motDePasse);
    
    if (!passwordMatch) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Première connexion ?
    const premiereConnexion = !patient.derniereConnexion;

    // Mettre à jour la dernière connexion
    await supabaseAdmin
      .from("patients")
      .update({ derniereConnexion: new Date().toISOString() })
      .eq("id", patient.id);

    // Créer le JWT
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
      premiereConnexion,
      patient: {
        id: patient.id,
        prenom: patient.prenom,
        nom: patient.nom,
        email: patient.email,
        telephone: patient.telephone,
        statut: patient.statut
      }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log('✅ Connexion réussie pour:', email);
    return response;

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + error.message },
      { status: 500 }
    );
  }
}