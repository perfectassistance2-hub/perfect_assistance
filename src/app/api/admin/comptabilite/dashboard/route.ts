// app/api/admin/comptabilite/dashboard/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // 1. KPI MOIS EN COURS
    const { data: paiementsMoisCourant } = await supabaseAdmin
      .from('paiements')
      .select('montant, statut, cliniqueId, medecinId')
      .gte('dateCreation', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
      .lt('dateCreation', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

    const revenusMoisCourant = paiementsMoisCourant?.reduce((sum, p) => 
      p.statut === 'payé' ? sum + Number(p.montant) : sum, 0
    ) || 0;

    const patientsActifsMois = new Set(paiementsMoisCourant?.map(p => p.patientId)).size;

    const paiementsEnAttente = paiementsMoisCourant?.filter(p => p.statut === 'en_attente').length || 0;

    const commissionsAPayer = await supabaseAdmin
      .from('paiements')
      .select('commissionClinique, commissionMedecin, commissionMedecinReferent')
      .eq('commissionStatut', 'non_payee')
      .eq('statut', 'payé');

    const totalCommissionsAPayer = commissionsAPayer.data?.reduce((sum, c) => {
      return sum + Number(c.commissionClinique || 0) + 
                   Number(c.commissionMedecin || 0) + 
                   Number(c.commissionMedecinReferent || 0);
    }, 0) || 0;

    // 2. MOIS PRÉCÉDENT (pour comparaison)
    const { data: paiementsMoisPrecedent } = await supabaseAdmin
      .from('paiements')
      .select('montant')
      .eq('statut', 'payé')
      .gte('dateCreation', `${previousYear}-${String(previousMonth).padStart(2, '0')}-01`)
      .lt('dateCreation', `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}-01`);

    const revenusMoisPrecedent = paiementsMoisPrecedent?.reduce((sum, p) => 
      sum + Number(p.montant), 0
    ) || 0;

    const evolutionPourcentage = revenusMoisPrecedent > 0 
      ? ((revenusMoisCourant - revenusMoisPrecedent) / revenusMoisPrecedent * 100).toFixed(1)
      : 0;

    // 3. ÉVOLUTION 12 DERNIERS MOIS
    const evolutionMensuelle = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      const { data } = await supabaseAdmin
        .from('paiements')
        .select('montant, cliniqueId')
        .eq('statut', 'payé')
        .gte('dateCreation', `${year}-${String(month).padStart(2, '0')}-01`)
        .lt('dateCreation', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);

      const revenusClinoques = data?.filter(p => p.cliniqueId !== null)
        .reduce((sum, p) => sum + Number(p.montant), 0) || 0;

      const revenusDirect = data?.filter(p => p.cliniqueId === null)
        .reduce((sum, p) => sum + Number(p.montant), 0) || 0;

      evolutionMensuelle.push({
        mois: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        cliniques: revenusClinoques,
        direct: revenusDirect,
        total: revenusClinoques + revenusDirect,
      });
    }

    // 4. TOP 5 CLINIQUES
    const { data: topCliniques } = await supabaseAdmin
      .from('paiements')
      .select(`
        montant,
        clinique:cliniques(id, nom)
      `)
      .eq('statut', 'payé')
      .not('cliniqueId', 'is', null)
      .gte('dateCreation', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);

    const cliniquesRevenu: Record<string, { nom: string; montant: number }> = {};
    topCliniques?.forEach((p: any) => {
      if (p.clinique) {
        const id = p.clinique.id;
        if (!cliniquesRevenu[id]) {
          cliniquesRevenu[id] = { nom: p.clinique.nom, montant: 0 };
        }
        cliniquesRevenu[id].montant += Number(p.montant);
      }
    });

    const top5Cliniques = Object.values(cliniquesRevenu)
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 5);

    // 5. TOP 5 MÉDECINS RÉFÉRENTS
    const { data: topReferents } = await supabaseAdmin
      .from('paiements')
      .select(`
        montant,
        medecinReferent:medecins_referents(id, prenom, nom)
      `)
      .eq('statut', 'payé')
      .not('medecinReferentId', 'is', null)
      .gte('dateCreation', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);

    const referentsRevenu: Record<string, { nom: string; montant: number }> = {};
    topReferents?.forEach((p: any) => {
      if (p.medecinReferent) {
        const id = p.medecinReferent.id;
        if (!referentsRevenu[id]) {
          referentsRevenu[id] = {
            nom: `Dr. ${p.medecinReferent.prenom} ${p.medecinReferent.nom}`,
            montant: 0
          };
        }
        referentsRevenu[id].montant += Number(p.montant);
      }
    });

    const top5Referents = Object.values(referentsRevenu)
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 5);

    // 6. DERNIÈRES TRANSACTIONS
    const { data: dernieresTransactions } = await supabaseAdmin
      .from('paiements')
      .select(`
        id,
        montant,
        devise,
        statut,
        datePaiement,
        dateCreation,
        patient:patients(prenom, nom),
        clinique:cliniques(nom),
        medecin:medecins(prenom, nom)
      `)
      .order('dateCreation', { ascending: false })
      .limit(10);

    return NextResponse.json({
      kpi: {
        revenusMoisCourant,
        patientsActifsMois,
        paiementsEnAttente,
        totalCommissionsAPayer,
        evolutionPourcentage,
      },
      evolutionMensuelle,
      top5Cliniques,
      top5Referents,
      dernieresTransactions,
    });
  } catch (error: any) {
    console.error("Erreur dashboard comptabilité:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}