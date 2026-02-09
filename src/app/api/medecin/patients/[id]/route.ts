// Fichier: app/api/medecin/patients/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 === DÉBUT API GET PATIENT ===');
    
    const user = await getAuthUser(request);
    console.log('👤 User:', user);

    if (!user || user.role !== 'medecin') {
      console.log('❌ Non authentifié ou pas médecin');
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // CORRECTION 1: Await params car c'est une Promise dans Next.js 15+
    const { id: patientId } = await params;
    
    // CORRECTION 2: user.userId correspond directement à medecins.id
    const medecinId = user.userId;

    console.log('🔍 Récupération patient:', patientId, 'par médecin ID:', medecinId);

    // Vérifier que le patient est bien affecté au médecin
    const { data: sejours, error: sejourError } = await supabaseAdmin
      .from("sejours")
      .select("id, statut")
      .eq("patientId", patientId)
      .eq("medecinId", medecinId);

    console.log('📊 Séjours trouvés:', sejours?.length || 0, sejourError);

    if (!sejours || sejours.length === 0) {
      console.log('❌ ERREUR: Patient non affecté à ce médecin');
      return NextResponse.json(
        { error: "Patient non affecté à ce médecin" },
        { status: 403 }
      );
    }

    console.log('✅ Patient affecté au médecin, continuons...');

    // Récupérer les infos du patient
    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();

    console.log('👨 Patient récupéré:', !!patient, patientError);

    if (patientError || !patient) {
      console.error('❌ Erreur patient:', patientError);
      return NextResponse.json(
        { error: "Patient introuvable" },
        { status: 404 }
      );
    }

    // Récupérer le dossier médical
    const { data: dossierMedical } = await supabaseAdmin
      .from("dossiers_medicaux")
      .select("*")
      .eq("patientId", patientId)
      .maybeSingle();

    // Récupérer TOUS les séjours du patient pour ce médecin
    const { data: sejoursDetails } = await supabaseAdmin
      .from("sejours")
      .select(`
        *,
        clinique:cliniques(id, nom, ville, pays),
        coordinateur:utilisateurs(id, prenom, nom)
      `)
      .eq("patientId", patientId)
      .eq("medecinId", medecinId)
      .order("dateCreation", { ascending: false });

    // Récupérer les rendez-vous
    const { data: rendezVous } = await supabaseAdmin
      .from("rendez_vous")
      .select("*")
      .eq("patientId", patientId)
      .eq("medecinId", medecinId)
      .order("datePrevue", { ascending: false })
      .limit(10);

    // Récupérer les documents partagés avec le médecin
    const { data: documents } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("patientId", patientId)
      .or(`partageAvecMedecin.eq.true,medecinPartageId.eq.${medecinId},ajoutePar.eq.medecin`)
      .order("dateTeleversement", { ascending: false });

    console.log('✅ Données chargées:', {
      patient: !!patient,
      dossierMedical: !!dossierMedical,
      sejours: sejoursDetails?.length || 0,
      rendezVous: rendezVous?.length || 0,
      documents: documents?.length || 0
    });

    const response = {
      success: true,
      patient,
      dossierMedical: dossierMedical || null,
      sejours: sejoursDetails || [],
      rendezVous: rendezVous || [],
      documents: documents || []
    };

    console.log('📤 RETOUR API:', Object.keys(response));
    console.log('🏁 === FIN API GET PATIENT ===');

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}