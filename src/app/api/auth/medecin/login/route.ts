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

    console.log('🔐 Connexion médecin:', email);

    if (!email || !motDePasse) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const { data: medecins, error: fetchError } = await supabaseAdmin
      .from("medecins")
      .select(`
        *,
        clinique:cliniques(id, nom, ville, pays, telephone, email, siteWeb)
      `)
      .eq("email", email.toLowerCase());

    if (fetchError || !medecins || medecins.length === 0) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const medecin = medecins[0];

    if (!medecin.estActif) {
      return NextResponse.json(
        { error: "Compte désactivé" },
        { status: 403 }
      );
    }

    if (!medecin.motDePasse) {
      return NextResponse.json(
        { error: "Mot de passe non défini. Contactez l'administrateur." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(motDePasse, medecin.motDePasse);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // ✅ Vérifier si première connexion ou doit changer mot de passe
    const doitChangerMotDePasse = medecin.doitChangerMotDePasse || !medecin.derniereConnexion;

    await supabaseAdmin
      .from("medecins")
      .update({ derniereConnexion: new Date().toISOString() })
      .eq("id", medecin.id);

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

    const response = NextResponse.json({
      success: true,
      doitChangerMotDePasse, // ✅ Indique au frontend
      medecin: {
        id: medecin.id,
        prenom: medecin.prenom,
        nom: medecin.nom,
        email: medecin.email,
        specialite: medecin.specialite,
        telephone: medecin.telephone,
        clinique: medecin.clinique
      }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log('✅ Connexion médecin réussie');
    return response;

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}