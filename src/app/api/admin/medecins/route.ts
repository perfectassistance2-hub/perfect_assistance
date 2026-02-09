// app/api/admin/medecins/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { isEmailAlreadyUsed } from "@/lib/email-validator"; // ✅ NOUVEAU

function generateTemporaryPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// GET - Liste tous les médecins
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const cliniqueId = searchParams.get('cliniqueId');

    let query = supabaseAdmin
      .from('medecins')
      .select(`
        *,
        clinique:cliniques(id, nom, ville)
      `)
      .order('nom');

    if (!includeInactive) {
      query = query.eq('estActif', true);
    }

    if (cliniqueId) {
      query = query.eq('cliniqueId', cliniqueId);
    }

    const { data: medecins, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(medecins || []);
  } catch (error) {
    console.error("Erreur chargement médecins:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des médecins" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau médecin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prenom,
      nom,
      specialite,
      telephone,
      email,
      cliniqueId,
      numeroLicence,
      anneesExperience,
    } = body;

    console.log('📝 Création médecin:', email);

    // Validation
    if (!prenom || !nom || !specialite || !telephone || !email) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
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

    // Générer un mot de passe temporaire
    const tempPassword = generateTemporaryPassword();
    console.log('🔑 Mot de passe temporaire généré:', tempPassword);

    // Hasher le mot de passe pour la BDD
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Créer le médecin dans la base de données avec mot de passe
    const { data: newMedecin, error: medecinError } = await supabaseAdmin
      .from('medecins')
      .insert({
        prenom,
        nom,
        specialite,
        telephone,
        email: email.toLowerCase(),
        cliniqueId: cliniqueId || null,
        numeroLicence: numeroLicence || null,
        anneesExperience: anneesExperience || null,
        motDePasse: hashedPassword,
        doitChangerMotDePasse: true,
        estActif: true,
      })
      .select(`
        *,
        clinique:cliniques(nom, ville)
      `)
      .single();

    if (medecinError) {
      console.error("Erreur création médecin:", medecinError);
      throw medecinError;
    }

    console.log('✅ Médecin créé avec succès');

    return NextResponse.json({
      success: true,
      medecin: newMedecin,
      credentials: {
        email: email.toLowerCase(),
        temporaryPassword: tempPassword,
        message: "Compte créé avec succès. Communiquez ces identifiants au médecin de manière sécurisée."
      }
    });

  } catch (error: any) {
    console.error("❌ Erreur création médecin:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du médecin" },
      { status: 500 }
    );
  }
}