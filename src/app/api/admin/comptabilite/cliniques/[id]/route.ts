// app/api/admin/comptabilite/cliniques/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer la clinique
    const { data: clinique, error: cliniqueError } = await supabaseAdmin
      .from("cliniques")
      .select("*")
      .eq("id", id)
      .single();

    if (cliniqueError || !clinique) {
      return NextResponse.json({ error: "Clinique non trouvée" }, { status: 404 });
    }

    // Récupérer les paiements de la clinique
    const { data: paiements, error: paiementsError } = await supabaseAdmin
      .from("paiements")
      .select(`
        id,
        montant,
        devise,
        statut,
        datePaiement,
        dateCreation,
        commissionClinique,
        commissionStatut,
        patient:patients(prenom, nom),
        sejour:sejours(typeTraitement)
      `)
      .eq("cliniqueId", id)
      .order("dateCreation", { ascending: false });

    if (paiementsError) throw paiementsError;

    // Calculer les stats
    const stats = {
      montantTotal: paiements?.reduce((sum, p) => sum + Number(p.montant), 0) || 0,
      montantPaye: paiements?.filter((p) => p.statut === "payé")
        .reduce((sum, p) => sum + Number(p.montant), 0) || 0,
      montantEnAttente: paiements?.filter((p) => p.statut === "en_attente")
        .reduce((sum, p) => sum + Number(p.montant), 0) || 0,
      commissionTotal: paiements?.reduce((sum, p) => sum + Number(p.commissionClinique || 0), 0) || 0,
      commissionNonPayee: paiements?.filter((p) => p.commissionStatut === "non_payee")
        .reduce((sum, p) => sum + Number(p.commissionClinique || 0), 0) || 0,
    };

    return NextResponse.json({
      clinique,
      paiements: paiements || [],
      stats,
    });
  } catch (error: any) {
    console.error("Erreur détails clinique:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}