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

    console.log('🔐 Connexion tentative:', email);

    if (!email || !motDePasse) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const { data: patients, error: fetchError } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("email", email.toLowerCase());

    console.log('Recherche résultat:', {
      nombre: patients?.length || 0,
      erreur: fetchError?.message
    });

    if (fetchError) {
      console.error('Erreur Supabase:', fetchError);
      return NextResponse.json(
        { error: "Erreur base de données" },
        { status: 500 }
      );
    }

    if (!patients || patients.length === 0) {
      console.log('❌ Aucun patient trouvé pour:', email);
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const patient = patients[0];

    console.log('Patient trouvé:', {
      id: patient.id,
      email: patient.email,
      aMotDePasse: !!patient.motDePasse,
      estActif: patient.estActif,
      doitChangerMotDePasse: patient.doitChangerMotDePasse // ✅ Ajouté
    });

    if (!patient.estActif) {
      return NextResponse.json(
        { error: "Compte désactivé" },
        { status: 403 }
      );
    }

    if (!patient.motDePasse) {
      console.log('⚠️ Pas de mot de passe dans la BDD pour:', email);
      return NextResponse.json(
        { error: "Compte non initialisé. Veuillez vous inscrire à nouveau ou contacter l'administrateur." },
        { status: 401 }
      );
    }

    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(motDePasse, patient.motDePasse);
      console.log('Comparaison mot de passe:', passwordMatch ? '✅' : '❌');
    } catch (bcryptError) {
      console.error('Erreur bcrypt:', bcryptError);
      return NextResponse.json(
        { error: "Erreur vérification mot de passe" },
        { status: 500 }
      );
    }

    if (!passwordMatch) {
      console.log('❌ Mot de passe incorrect');
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // ✅ Détection changement obligatoire
    const doitChangerMotDePasse = patient.doitChangerMotDePasse === true;
    const premiereConnexion = !patient.derniereConnexion;

    await supabaseAdmin
      .from("patients")
      .update({ derniereConnexion: new Date().toISOString() })
      .eq("id", patient.id);

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
      doitChangerMotDePasse, // ✅ Ajouté pour redirection
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