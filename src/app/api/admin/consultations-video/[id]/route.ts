// app/api/admin/consultations-video/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteDailyRoom } from "@/lib/daily-config";

// =====================================================
// GET - Détails d'une consultation
// =====================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("consultations_video")
      .select(`
        *,
        patient:patients!consultations_video_patient_id_fkey(id, prenom, nom, email, telephone, whatsapp),
        medecin:medecins!consultations_video_medecin_id_fkey(id, prenom, nom, specialite, email, telephone),
        rendez_vous:rendez_vous!consultations_video_rendez_vous_id_fkey(id, datePrevue, raison, type),
        createur:utilisateurs!consultations_video_cree_par_fkey(id, prenom, nom, email)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erreur Supabase GET consultation:", error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Consultation non trouvée" },
          { status: 404 }
        );
      }
      
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: "Consultation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erreur GET consultation:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH - Modifier une consultation
// =====================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      titre,
      description,
      dateDebut,
      duree,
      statut,
      enregistrementAutorise,
      enregistrementDemarre,
    } = body;

    // Vérifier que la consultation existe
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("consultations_video")
      .select("*")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: "Consultation non trouvée" },
        { status: 404 }
      );
    }

    // Ne pas permettre la modification si la consultation est terminée
    if (existing.statut === "TERMINE" && statut !== "TERMINE") {
      return NextResponse.json(
        { error: "Impossible de modifier une consultation terminée" },
        { status: 400 }
      );
    }

    // Préparer les données à mettre à jour
    const updates: any = {};

    if (titre !== undefined) updates.titre = titre;
    if (description !== undefined) updates.description = description;
    if (statut !== undefined) updates.statut = statut;
    if (enregistrementAutorise !== undefined) updates.enregistrement_autorise = enregistrementAutorise;
    if (enregistrementDemarre !== undefined) updates.enregistrement_demarre = enregistrementDemarre;

    // Si la date ou la durée change, recalculer la date de fin
    if (dateDebut || duree) {
      const newDateDebut = dateDebut ? new Date(dateDebut) : new Date(existing.date_debut);
      const newDuree = duree !== undefined ? duree : existing.duree;
      const newDateFin = new Date(newDateDebut.getTime() + newDuree * 60 * 1000);

      updates.date_debut = newDateDebut.toISOString();
      updates.date_fin = newDateFin.toISOString();
      updates.duree = newDuree;
    }

    // Mettre à jour
    const { data, error } = await supabaseAdmin
      .from("consultations_video")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        patient:patients!consultations_video_patient_id_fkey(id, prenom, nom, email),
        medecin:medecins!consultations_video_medecin_id_fkey(id, prenom, nom, specialite)
      `)
      .single();

    if (error) {
      console.error("Erreur mise à jour consultation:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Consultation mise à jour avec succès",
      consultation: data,
    });
  } catch (error: any) {
    console.error("Erreur PATCH consultation:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE - Supprimer une consultation
// =====================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      );
    }

    // Récupérer la consultation pour obtenir le room name
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from("consultations_video")
      .select("daily_room_name, statut")
      .eq("id", id)
      .single();

    if (fetchError || !consultation) {
      return NextResponse.json(
        { error: "Consultation non trouvée" },
        { status: 404 }
      );
    }

    // Ne pas permettre la suppression si la consultation est en cours
    if (consultation.statut === "EN_COURS") {
      return NextResponse.json(
        { error: "Impossible de supprimer une consultation en cours" },
        { status: 400 }
      );
    }

    // Supprimer la room Daily.co
    try {
      await deleteDailyRoom(consultation.daily_room_name);
      console.log("Room Daily.co supprimée:", consultation.daily_room_name);
    } catch (dailyError: any) {
      console.error("Erreur suppression room Daily.co:", dailyError);
      // Continuer quand même la suppression en BDD
    }

    // Supprimer de la base de données
    const { error: deleteError } = await supabaseAdmin
      .from("consultations_video")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Erreur suppression consultation:", deleteError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Consultation supprimée avec succès",
    });
  } catch (error: any) {
    console.error("Erreur DELETE consultation:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}