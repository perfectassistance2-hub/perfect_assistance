// ==========================================
// FICHIER: /app/api/admin/patients/route.ts
// AVEC COMPTAGE DES MESSAGES
// ==========================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// ==========================================
// FONCTION UTILITAIRE - Génération de mot de passe
// ==========================================
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

// ==========================================
// GET - Liste tous les patients avec comptage messages
// ==========================================
export async function GET() {
  try {
    console.log('📋 GET /api/admin/patients - Chargement liste');

    // Récupérer les patients avec médecin référent
    const { data: patients, error } = await supabaseAdmin
      .from('patients')
      .select(`
        *,
        medecinReferent:medecins_referents!patients_medecin_referent_fkey(
          id,
          prenom,
          nom,
          specialite,
          pays,
          email
        )
      `)
      .order('dateCreation', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }

    console.log(`✅ ${patients?.length || 0} patients récupérés, enrichissement en cours...`);

    // Enrichir avec le comptage des messages
    const patientsEnrichis = await Promise.all(
      (patients || []).map(async (patient) => {
        // Compter TOUS les messages du patient (envoyés + reçus)
        const { count: messagesCount } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .or(`and(expediteurId.eq.${patient.id},expediteurType.eq.patient),and(destinataireId.eq.${patient.id},destinataireType.eq.patient)`);

        // Compter les messages NON LUS reçus par le patient
        const { count: messagesNonLus } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('destinataireId', patient.id)
          .eq('destinataireType', 'patient')
          .eq('estLu', false);

        // Retirer le mot de passe
        const { motDePasse, ...patientData } = patient;

        return {
          ...patientData,
          messagesCount: messagesCount || 0,
          messagesNonLus: messagesNonLus || 0
        };
      })
    );

    console.log('✅ Patients enrichis:', patientsEnrichis.length);

    return NextResponse.json(patientsEnrichis);
  } catch (error: any) {
    console.error("❌ Erreur chargement patients:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des patients" },
      { status: 500 }
    );
  }
}

// ==========================================
// POST - Créer un nouveau patient
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📝 POST /api/admin/patients - Création patient:', body.email);

    // Validation des champs obligatoires
    if (!body.prenom || !body.nom || !body.email || !body.telephone) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // Vérifier email unique
    const { data: existing } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier que le médecin référent existe (si fourni)
    if (body.medecinreferentid && body.medecinreferentid !== "") {
      const { data: medecinExists } = await supabaseAdmin
        .from('medecins_referents')
        .select('id')
        .eq('id', body.medecinreferentid)
        .single();

      if (!medecinExists) {
        return NextResponse.json(
          { error: "Le médecin référent sélectionné n'existe pas" },
          { status: 400 }
        );
      }
    }

    // Générer mot de passe temporaire
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    console.log('🔑 Mot de passe temporaire généré:', tempPassword);

    // Créer le patient
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert({
        prenom: body.prenom,
        nom: body.nom,
        email: body.email.toLowerCase(),
        telephone: body.telephone,
        dateNaissance: body.dateNaissance || '2000-01-01',
        sexe: body.sexe || 'M',
        pays: body.pays || 'Non spécifié',
        ville: body.ville || null,
        adresse: body.adresse || null,
        codePostal: body.codePostal || null,
        whatsapp: body.whatsapp || null,
        numeroPasseport: body.numeroPasseport || null,
        dateExpirationPasseport: body.dateExpirationPasseport || null,
        nationalite: body.nationalite || body.pays || 'Non spécifié',
        motDePasse: hashedPassword,
        statut: 'EN_ATTENTE',
        estActif: true,
        langue: body.langue || 'fr',
        medecinreferentid: body.medecinreferentid || null
      })
      .select(`
        *,
        medecinReferent:medecins_referents!patients_medecin_referent_fkey(
          id,
          prenom,
          nom,
          specialite,
          pays,
          email
        )
      `)
      .single();

    if (error) {
      console.error('❌ Erreur création:', error);
      throw error;
    }

    console.log('✅ Patient créé:', patient.id);

    // Retourner sans le mot de passe haché
    const { motDePasse: _, ...patientSansMotDePasse } = patient;

    return NextResponse.json({
      success: true,
      patient: {
        ...patientSansMotDePasse,
        messagesCount: 0,
        messagesNonLus: 0
      },
      motDePasseTemporaire: tempPassword, // À afficher à l'admin
    });

  } catch (error: any) {
    console.error("❌ Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du patient" },
      { status: 500 }
    );
  }
}