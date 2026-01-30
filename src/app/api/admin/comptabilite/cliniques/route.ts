// app/api/admin/comptabilite/cliniques/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode") || "mois"; // mois, trimestre, annee, tout

    // Calculer les dates de début selon la période
    const now = new Date();
    let dateDebut: string | null = null;

    switch (periode) {
      case "mois":
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case "trimestre":
        const trimestre = Math.floor(now.getMonth() / 3);
        dateDebut = new Date(now.getFullYear(), trimestre * 3, 1).toISOString();
        break;
      case "annee":
        dateDebut = new Date(now.getFullYear(), 0, 1).toISOString();
        break;
      case "tout":
        dateDebut = null;
        break;
    }

    // Récupérer toutes les cliniques
    const { data: cliniques, error: cliniquesError } = await supabaseAdmin
      .from("cliniques")
      .select("id, nom, ville, pays")
      .eq("estActif", true)
      .order("nom");

    if (cliniquesError) throw cliniquesError;

    // Pour chaque clinique, calculer les stats
    const cliniquesAvecStats = await Promise.all(
      cliniques.map(async (clinique) => {
        // Query de base
        let query = supabaseAdmin
          .from("paiements")
          .select("montant, statut, commissionClinique, commissionStatut, patientId")
          .eq("cliniqueId", clinique.id);

        // Filtrer par période
        if (dateDebut) {
          query = query.gte("dateCreation", dateDebut);
        }

        const { data: paiements } = await query;

        const stats = {
          nbPaiements: paiements?.length || 0,
          nbPatients: new Set(paiements?.map((p) => p.patientId)).size,
          montantTotal: paiements?.reduce((sum, p) => sum + Number(p.montant), 0) || 0,
          montantPaye: paiements?.filter((p) => p.statut === "payé")
            .reduce((sum, p) => sum + Number(p.montant), 0) || 0,
          montantEnAttente: paiements?.filter((p) => p.statut === "en_attente")
            .reduce((sum, p) => sum + Number(p.montant), 0) || 0,
          commissionTotal: paiements?.reduce((sum, p) => sum + Number(p.commissionClinique || 0), 0) || 0,
          commissionNonPayee: paiements?.filter((p) => p.commissionStatut === "non_payee")
            .reduce((sum, p) => sum + Number(p.commissionClinique || 0), 0) || 0,
        };

        return {
          ...clinique,
          stats,
        };
      })
    );

    // Trier par montant total décroissant
    cliniquesAvecStats.sort((a, b) => b.stats.montantTotal - a.stats.montantTotal);

    return NextResponse.json({ cliniques: cliniquesAvecStats });
  } catch (error: any) {
    console.error("Erreur stats cliniques:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}