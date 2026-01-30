// app/api/admin/comptabilite/paiements/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Liste tous les paiements avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtres optionnels
    const cliniqueId = searchParams.get("cliniqueId");
    const medecinId = searchParams.get("medecinId");
    const medecinReferentId = searchParams.get("medecinReferentId");
    const statut = searchParams.get("statut");
    const mois = searchParams.get("mois"); // Format: YYYY-MM
    const limite = searchParams.get("limite") || "50";

    // Construction de la requête
    let query = supabaseAdmin
      .from("paiements")
      .select(`
        *,
        patient:patients(id, prenom, nom, email, telephone),
        clinique:cliniques(id, nom, ville, pays),
        medecin:medecins(id, prenom, nom, specialite),
        medecinReferent:medecins_referents(id, prenom, nom, specialite),
        sejour:sejours(id, typeTraitement, dateArrivee, dateDepart)
      `)
      .order("dateCreation", { ascending: false })
      .limit(Number(limite));

    // Appliquer les filtres
    if (cliniqueId) query = query.eq("cliniqueId", cliniqueId);
    if (medecinId) query = query.eq("medecinId", medecinId);
    if (medecinReferentId) query = query.eq("medecinReferentId", medecinReferentId);
    if (statut) query = query.eq("statut", statut);
    
    if (mois) {
      const [year, month] = mois.split("-");
      const nextMonth = Number(month) === 12 ? 1 : Number(month) + 1;
      const nextYear = Number(month) === 12 ? Number(year) + 1 : Number(year);
      
      query = query
        .gte("dateCreation", `${year}-${month}-01`)
        .lt("dateCreation", `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`);
    }

    const { data: paiements, error } = await query;

    if (error) throw error;

    // Calculer les totaux
    const totaux = {
      total: paiements?.length || 0,
      montantTotal: paiements?.reduce((sum, p) => sum + Number(p.montant), 0) || 0,
      montantPaye: paiements?.filter(p => p.statut === "payé")
        .reduce((sum, p) => sum + Number(p.montant), 0) || 0,
      montantEnAttente: paiements?.filter(p => p.statut === "en_attente")
        .reduce((sum, p) => sum + Number(p.montant), 0) || 0,
      commissionsNonPayees: paiements?.filter(p => p.commissionStatut === "non_payee")
        .reduce((sum, p) => {
          return sum + Number(p.commissionClinique || 0) + 
                       Number(p.commissionMedecin || 0) + 
                       Number(p.commissionMedecinReferent || 0);
        }, 0) || 0,
    };

    return NextResponse.json({
      paiements: paiements || [],
      totaux,
    });
  } catch (error: any) {
    console.error("Erreur chargement paiements:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sejourId,
      patientId,
      cliniqueId,
      medecinId,
      medecinReferentId,
      montant,
      devise = "MAD",
      statut = "en_attente",
      datePaiement,
      modePaiement,
      commissionClinique,
      commissionMedecin,
      commissionMedecinReferent,
    } = body;

    // Validation des champs obligatoires
    if (!sejourId || !patientId || !montant) {
      return NextResponse.json(
        { error: "Séjour, patient et montant sont obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier que le séjour existe
    const { data: sejourExists } = await supabaseAdmin
      .from("sejours")
      .select("id, patientId, cliniqueId, medecinId")
      .eq("id", sejourId)
      .single();

    if (!sejourExists) {
      return NextResponse.json(
        { error: "Le séjour spécifié n'existe pas" },
        { status: 400 }
      );
    }

    // Vérifier cohérence patient
    if (sejourExists.patientId !== patientId) {
      return NextResponse.json(
        { error: "Le patient ne correspond pas au séjour" },
        { status: 400 }
      );
    }

    // Vérifier que le paiement n'existe pas déjà pour ce séjour
    const { data: paiementExists } = await supabaseAdmin
      .from("paiements")
      .select("id")
      .eq("sejourId", sejourId)
      .single();

    if (paiementExists) {
      return NextResponse.json(
        { error: "Un paiement existe déjà pour ce séjour" },
        { status: 400 }
      );
    }

    // Récupérer le médecin référent du patient si non fourni
    let finalMedecinReferentId = medecinReferentId;
    if (!finalMedecinReferentId) {
      const { data: patient } = await supabaseAdmin
        .from("patients")
        .select("medecinreferentid")
        .eq("id", patientId)
        .single();
      
      finalMedecinReferentId = patient?.medecinreferentid || null;
    }

    // Créer le paiement
    const { data: newPaiement, error } = await supabaseAdmin
      .from("paiements")
      .insert({
        sejourId,
        patientId,
        cliniqueId: cliniqueId || sejourExists.cliniqueId || null,
        medecinId: medecinId || sejourExists.medecinId || null,
        medecinReferentId: finalMedecinReferentId,
        montant: Number(montant),
        devise,
        statut,
        datePaiement: datePaiement || null,
        modePaiement: modePaiement || null,
        commissionClinique: commissionClinique ? Number(commissionClinique) : null,
        commissionMedecin: commissionMedecin ? Number(commissionMedecin) : null,
        commissionMedecinReferent: commissionMedecinReferent ? Number(commissionMedecinReferent) : null,
        commissionStatut: "non_payee",
        commissionAvance: 0,
      })
      .select(`
        *,
        patient:patients(prenom, nom, email),
        clinique:cliniques(nom),
        medecin:medecins(prenom, nom),
        medecinReferent:medecins_referents(prenom, nom),
        sejour:sejours(typeTraitement)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      paiement: newPaiement,
    });
  } catch (error: any) {
    console.error("Erreur création paiement:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}