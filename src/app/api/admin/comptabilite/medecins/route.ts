// app/api/admin/comptabilite/medecins/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode") || "mois";

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

    // Récupérer médecins NON affiliés à une clinique
    const { data: medecins, error: medecinsError } = await supabaseAdmin
      .from("medecins")
      .select("id, prenom, nom, specialite")
      .is("cliniqueId", null)
      .eq("estActif", true)
      .order("nom");

    if (medecinsError) throw medecinsError;

    // Calculer stats pour chaque médecin
    const medecinsAvecStats = await Promise.all(
      medecins.map(async (medecin) => {
        let query = supabaseAdmin
          .from("paiements")
          .select("montant, statut, commissionMedecin, commissionStatut, patientId")
          .eq("medecinId", medecin.id)
          .is("cliniqueId", null); // Seulement ceux sans clinique

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
          commissionTotal: paiements?.reduce((sum, p) => sum + Number(p.commissionMedecin || 0), 0) || 0,
          commissionNonPayee: paiements?.filter((p) => p.commissionStatut === "non_payee")
            .reduce((sum, p) => sum + Number(p.commissionMedecin || 0), 0) || 0,
        };

        return { ...medecin, stats };
      })
    );

    // Filtrer uniquement ceux avec des paiements
    const medecinsAvecPaiements = medecinsAvecStats.filter((m) => m.stats.nbPaiements > 0);

    // Trier par montant
    medecinsAvecPaiements.sort((a, b) => b.stats.montantTotal - a.stats.montantTotal);

    return NextResponse.json({ medecins: medecinsAvecPaiements });
  } catch (error: any) {
    console.error("Erreur stats médecins:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}