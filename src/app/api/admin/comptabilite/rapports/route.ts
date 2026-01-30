// app/api/admin/comptabilite/rapports/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get("type") || "mensuel";
    const format = searchParams.get("format") || "pdf";
    const includeDetails = searchParams.get("includeDetails") === "true";
    const includeGraphiques = searchParams.get("includeGraphiques") === "true";

    // Calculer les dates selon le type
    let dateDebut: string;
    let dateFin: string;
    let titre: string;

    switch (type) {
      case "mensuel":
        const mois = searchParams.get("mois") || new Date().toISOString().substring(0, 7);
        const [year, month] = mois.split("-");
        dateDebut = `${year}-${month}-01`;
        const nextMonth = new Date(Number(year), Number(month), 1);
        dateFin = nextMonth.toISOString().split("T")[0];
        titre = `Rapport Mensuel - ${new Date(mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;
        break;

      case "trimestriel":
        const trimestre = Number(searchParams.get("trimestre") || "1");
        const anneeTri = searchParams.get("annee") || new Date().getFullYear().toString();
        const moisDebut = (trimestre - 1) * 3;
        dateDebut = `${anneeTri}-${String(moisDebut + 1).padStart(2, "0")}-01`;
        const moisFin = moisDebut + 3;
        dateFin = `${anneeTri}-${String(moisFin + 1).padStart(2, "0")}-01`;
        titre = `Rapport Trimestriel T${trimestre} ${anneeTri}`;
        break;

      case "annuel":
        const annee = searchParams.get("annee") || new Date().getFullYear().toString();
        dateDebut = `${annee}-01-01`;
        dateFin = `${Number(annee) + 1}-01-01`;
        titre = `Rapport Annuel ${annee}`;
        break;

      case "personnalise":
        dateDebut = searchParams.get("dateDebut") || "";
        dateFin = searchParams.get("dateFin") || "";
        titre = `Rapport Personnalisé - ${new Date(dateDebut).toLocaleDateString("fr-FR")} au ${new Date(dateFin).toLocaleDateString("fr-FR")}`;
        break;

      default:
        throw new Error("Type de rapport invalide");
    }

    // Récupérer les données
    const { data: paiements, error } = await supabaseAdmin
      .from("paiements")
      .select(`
        *,
        patient:patients(prenom, nom),
        clinique:cliniques(nom),
        medecin:medecins(prenom, nom),
        medecinReferent:medecins_referents(prenom, nom),
        sejour:sejours(typeTraitement)
      `)
      .gte("dateCreation", dateDebut)
      .lt("dateCreation", dateFin)
      .order("dateCreation", { ascending: false });

    if (error) throw error;

    // Calculer les statistiques
    const stats = {
      nbPaiements: paiements?.length || 0,
      nbPatients: new Set(paiements?.map((p) => p.patientId)).size,
      montantTotal: paiements?.reduce((sum, p) => sum + Number(p.montant), 0) || 0,
      montantPaye: paiements?.filter((p) => p.statut === "payé")
        .reduce((sum, p) => sum + Number(p.montant), 0) || 0,
      montantEnAttente: paiements?.filter((p) => p.statut === "en_attente")
        .reduce((sum, p) => sum + Number(p.montant), 0) || 0,
      commissionTotal: paiements?.reduce((sum, p) => 
        sum + Number(p.commissionClinique || 0) + 
              Number(p.commissionMedecin || 0) + 
              Number(p.commissionMedecinReferent || 0), 0) || 0,
    };

    if (format === "excel") {
      // TODO: Générer fichier Excel
      // Vous pouvez utiliser une bibliothèque comme 'xlsx' ou 'exceljs'
      return NextResponse.json({
        message: "Export Excel à implémenter",
        stats,
        nbPaiements: paiements?.length,
      });
    }

    // Format PDF (structure de base)
    // TODO: Générer PDF avec une bibliothèque comme 'pdfkit' ou 'jspdf'
    const rapport = {
      titre,
      periode: { dateDebut, dateFin },
      stats,
      paiements: includeDetails ? paiements : [],
      includeGraphiques,
      dateGeneration: new Date().toISOString(),
    };

    return NextResponse.json({
      message: "Génération PDF à implémenter",
      rapport,
    });

  } catch (error: any) {
    console.error("Erreur génération rapport:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}