// app/api/medecin/rendez-vous/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-change-moi'
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 API Détail RDV - Début');

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.log('❌ Pas de token');
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = {
      userId: payload.userId as string,
      role: payload.role as string
    };

    console.log('✅ User:', user.userId, user.role);

    if (user.role !== 'medecin') {
      console.log('❌ Pas médecin');
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id: rdvId } = await context.params;

    console.log('🔍 Recherche RDV:', rdvId);

    // ✅ Récupérer le RDV avec la consultation vidéo (support multi-plateforme)
    const { data: rendezVous, error } = await supabaseAdmin
      .from("rendez_vous")
      .select(`
        *,
        patient:patients(*),
        clinique:cliniques(*),
        medecin:medecins(id, prenom, nom),
        consultationVideo:consultations_video!rendez_vous_id(
          id,
          titre,
          plateforme,
          daily_room_name,
          daily_room_url,
          zego_room_id,
          lien_patient,
          lien_medecin,
          statut,
          date_debut,
          duree,
          enregistrement_autorise
        )
      `)
      .eq("id", rdvId)
      .eq("medecinId", user.userId)
      .single();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return NextResponse.json(
        { error: "Erreur base de données: " + error.message },
        { status: 500 }
      );
    }

    if (!rendezVous) {
      console.log('❌ RDV introuvable');
      return NextResponse.json(
        { error: "Rendez-vous introuvable" },
        { status: 404 }
      );
    }

    console.log('✅ RDV trouvé');

    // Récupérer les séjours du patient avec ce médecin
    const { data: sejours } = await supabaseAdmin
      .from("sejours")
      .select(`
        *,
        clinique:cliniques(id, nom, ville, pays)
      `)
      .eq("patientId", rendezVous.patientId)
      .eq("medecinId", user.userId)
      .order("dateCreation", { ascending: false });

    console.log('Séjours:', sejours?.length || 0);

    // Récupérer le dossier médical
    const { data: dossierMedical } = await supabaseAdmin
      .from("dossiers_medicaux")
      .select("*")
      .eq("patientId", rendezVous.patientId)
      .maybeSingle();

    console.log('Dossier médical:', dossierMedical ? 'Trouvé' : 'Pas trouvé');

    // Récupérer les documents
    const { data: documents } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("patientId", rendezVous.patientId)
      .or(`partageAvecMedecin.eq.true,medecinPartageId.eq.${user.userId},ajoutePar.eq.medecin`)
      .order("dateTeleversement", { ascending: false });

    console.log('Documents:', documents?.length || 0);

    return NextResponse.json({ 
      success: true, 
      rendezVous: {
        ...rendezVous,
        sejours: sejours || []
      },
      dossierMedical: dossierMedical || null,
      documents: documents || []
    });

  } catch (error: any) {
    console.error("💥 Erreur générale:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}