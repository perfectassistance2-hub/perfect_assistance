// app/api/admin/consultations-video/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { 
  createDailyRoom, 
  generateRoomName, 
  calculateExpiration,
  DAILY_CONFIG 
} from "@/lib/daily-config";

// =====================================================
// GET - Liste des consultations vidéo
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtres
    const statut = searchParams.get("statut");
    const patientId = searchParams.get("patientId");
    const medecinId = searchParams.get("medecinId");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");

    let query = supabaseAdmin
      .from("consultations_video")
      .select(`
        *,
        patient:patients!consultations_video_patient_id_fkey(id, prenom, nom, email),
        medecin:medecins!consultations_video_medecin_id_fkey(id, prenom, nom, specialite),
        rendez_vous:rendez_vous!consultations_video_rendez_vous_id_fkey(id, datePrevue, raison),
        createur:utilisateurs!consultations_video_cree_par_fkey(id, prenom, nom)
      `)
      .order("date_debut", { ascending: false });

    // Appliquer les filtres
    if (statut) {
      query = query.eq("statut", statut);
    }
    if (patientId) {
      query = query.eq("patient_id", patientId);
    }
    if (medecinId) {
      query = query.eq("medecin_id", medecinId);
    }
    if (dateDebut) {
      query = query.gte("date_debut", dateDebut);
    }
    if (dateFin) {
      query = query.lte("date_debut", dateFin);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erreur récupération consultations:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des consultations" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET consultations-video:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// =====================================================
// POST - Créer une consultation vidéo
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      titre,
      description,
      dateDebut,
      duree, // en minutes
      patientId,
      medecinId,
      rendezVousId,
      enregistrementAutorise,
      creePar,
    } = body;

    // Validation
    if (!titre || !dateDebut || !duree || !patientId || !creePar) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // Calculer la date de fin
    const dateDebutObj = new Date(dateDebut);
    const dateFinObj = new Date(dateDebutObj.getTime() + duree * 60 * 1000);

    // Vérifier que la date est dans le futur
    if (dateDebutObj < new Date()) {
      return NextResponse.json(
        { error: "La date de début doit être dans le futur" },
        { status: 400 }
      );
    }

    // Vérifier la durée max
    if (duree > DAILY_CONFIG.MAX_DURATION_MINUTES) {
      return NextResponse.json(
        { error: `La durée maximale est de ${DAILY_CONFIG.MAX_DURATION_MINUTES} minutes` },
        { status: 400 }
      );
    }

    // Vérifier que le patient existe
    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("id, prenom, nom, email")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Patient non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le médecin existe (si spécifié)
    let medecin = null;
    if (medecinId) {
      const { data: medecinData, error: medecinError } = await supabaseAdmin
        .from("medecins")
        .select("id, prenom, nom, specialite")
        .eq("id", medecinId)
        .single();

      if (medecinError || !medecinData) {
        return NextResponse.json(
          { error: "Médecin non trouvé" },
          { status: 404 }
        );
      }
      medecin = medecinData;
    }

    // === CRÉER LA ROOM DAILY.CO ===
    console.log("Création de la room Daily.co...");
    
    const roomName = generateRoomName();
    const expiration = calculateExpiration(duree);

    const dailyRoom = await createDailyRoom({
      name: roomName,
      privacy: 'public',
      properties: {
        exp: expiration,
        enable_screenshare: true,
        enable_chat: true,
        enable_recording: enregistrementAutorise ? 'local' : undefined,
        start_video_off: false,
        start_audio_off: false,
        max_participants: DAILY_CONFIG.MAX_PARTICIPANTS,
      },
    });

    console.log("Room Daily.co créée:", dailyRoom.url);

    // Générer les liens d'accès
    const dailyDomain = process.env.NEXT_PUBLIC_DAILY_DOMAIN || 'daily.co';
    const lienPatient = `${dailyRoom.url}?userName=${encodeURIComponent(patient.prenom + ' ' + patient.nom)}&role=patient`;
    const lienMedecin = medecin 
      ? `${dailyRoom.url}?userName=${encodeURIComponent('Dr. ' + medecin.prenom + ' ' + medecin.nom)}&role=medecin`
      : dailyRoom.url;

    // Insérer dans la base de données
    const { data: consultation, error: insertError } = await supabaseAdmin
      .from("consultations_video")
      .insert({
        titre,
        description: description || null,
        date_debut: dateDebutObj.toISOString(),
        date_fin: dateFinObj.toISOString(),
        duree,
        patient_id: patientId,
        medecin_id: medecinId || null,
        rendez_vous_id: rendezVousId || null,
        daily_room_name: dailyRoom.name,
        daily_room_url: dailyRoom.url,
        lien_patient: lienPatient,
        lien_medecin: lienMedecin,
        enregistrement_autorise: enregistrementAutorise || false,
        statut: "PLANIFIE",
        cree_par: creePar,
      })
      .select(`
        *,
        patient:patients!consultations_video_patient_id_fkey(id, prenom, nom, email),
        medecin:medecins!consultations_video_medecin_id_fkey(id, prenom, nom, specialite)
      `)
      .single();

    if (insertError) {
      console.error("Erreur insertion consultation:", insertError);
      // Supprimer la room Daily.co en cas d'erreur
      try {
        await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          },
        });
      } catch (deleteError) {
        console.error("Erreur suppression room Daily.co:", deleteError);
      }
      
      return NextResponse.json(
        { error: "Erreur lors de la création de la consultation" },
        { status: 500 }
      );
    }

    console.log("Consultation créée avec succès:", consultation.id);

    return NextResponse.json(
      {
        message: "Consultation vidéo créée avec succès",
        consultation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur POST consultations-video:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}