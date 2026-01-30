// app/api/admin/comptabilite/medecins-referents/route.ts

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

    // Récupérer tous les médecins référents
    const { data: medecinsReferents, error } = await supabaseAdmin
      .from("medecins_referents")
      .select("id, prenom, nom, specialite, pays")
      .eq("estactif", true)
      .order("nom");

    if (error) throw error;

    // Calculer stats pour chaque médecin référent
    const medecinsAvecStats = await Promise.all(
      medecinsReferents.map(async (medecin) => {
        // Récupérer les paiements des patients référés par ce médecin
        let query = supabaseAdmin
          .from("paiements")
          .select("montant, statut, commissionMedecinReferent, commissionStatut, patientId")
          .eq("medecinReferentId", medecin.id);

        if (dateDebut) {
          query = query.gte("dateCreation", dateDebut);
        }

        const { data: paiements } = await query;

        const stats = {
          nbPatientsEnvoyes: new Set(paiements?.map((p) => p.patientId)).size,
          nbPaiements: paiements?.length || 0,
          montantTotalGenere: paiements?.reduce((sum, p) => sum + Number(p.montant), 0) || 0,
          commissionTotal: paiements?.reduce((sum, p) => sum + Number(p.commissionMedecinReferent || 0), 0) || 0,
          commissionNonPayee: paiements?.filter((p) => p.commissionStatut === "non_payee")
            .reduce((sum, p) => sum + Number(p.commissionMedecinReferent || 0), 0) || 0,
        };

        return { ...medecin, stats };
      })
    );

    // Filtrer uniquement ceux qui ont des paiements
    const medecinsAvecPaiements = medecinsAvecStats.filter((m) => m.stats.nbPaiements > 0);

    // Trier par montant généré
    medecinsAvecPaiements.sort((a, b) => b.stats.montantTotalGenere - a.stats.montantTotalGenere);

    return NextResponse.json({ medecinsReferents: medecinsAvecPaiements });
  } catch (error: any) {
    console.error("Erreur stats médecins référents:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}