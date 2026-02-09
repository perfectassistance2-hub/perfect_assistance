// app/api/admin/patients/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isEmailAlreadyUsed } from "@/lib/email-validator"; // ✅ Import pour PATCH

// GET - Détails d'un patient avec toutes ses relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;

    // Récupérer le patient ✅ AVEC MÉDECIN RÉFÉRENT
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select(`
        *,
        medecinReferent:medecins_referents!patients_medecin_referent_fkey(
          id,
          prenom,
          nom,
          email,
          telephone,
          specialite,
          etablissement,
          ville,
          pays
        )
      `)
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Patient non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer le dossier médical
    const { data: dossierMedical } = await supabaseAdmin
      .from('dossiers_medicaux')
      .select('*')
      .eq('patientId', patientId)
      .single();

    // ✅ CORRECTION - Récupérer les rendez-vous AVEC consultations vidéo
    const { data: rendezVous } = await supabaseAdmin
      .from('rendez_vous')
      .select(`
        *,
        medecin:medecins(id, prenom, nom, specialite),
        clinique:cliniques(id, nom, ville, adresse),
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
          date_fin,
          duree,
          enregistrement_autorise
        )
      `)
      .eq('patientId', patientId)
      .order('datePrevue', { ascending: false });

    // Récupérer les séjours avec relations
    const { data: sejours } = await supabaseAdmin
      .from('sejours')
      .select(`
        *,
        clinique:cliniques(nom),
        medecin:medecins(prenom, nom)
      `)
      .eq('patientId', patientId)
      .order('dateArrivee', { ascending: false });

    // Récupérer les devis
    const { data: devis } = await supabaseAdmin
      .from('devis')
      .select('*')
      .eq('patientId', patientId)
      .order('dateCreation', { ascending: false });

    // Récupérer les messages
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        expediteur:utilisateurs(prenom, nom)
      `)
      .eq('destinataireId', patientId)
      .order('dateCreation', { ascending: false });

    // Retirer le mot de passe du patient
    const { motDePasse: _, ...patientSansMotDePasse } = patient;

    return NextResponse.json({
      patient: patientSansMotDePasse,
      dossierMedical: dossierMedical || null,
      rendezVous: rendezVous || [],
      sejours: sejours || [],
      devis: devis || [],
      messages: messages || [],
    });
  } catch (error) {
    console.error("Erreur récupération patient:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du patient" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un patient
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const updates = await request.json();

    console.log('📝 PATCH patient:', patientId, updates);

    // Retirer les champs non modifiables
    delete updates.id;
    delete updates.dateCreation;
    delete updates.motDePasse; // Le mot de passe se change via une route dédiée

    // ✅ NOUVEAU - Vérifier l'email si modifié
    if (updates.email && updates.email !== "") {
      // Récupérer l'email actuel du patient
      const { data: currentPatient } = await supabaseAdmin
        .from('patients')
        .select('email')
        .eq('id', patientId)
        .single();

      // Vérifier uniquement si l'email a changé
      if (currentPatient && updates.email.toLowerCase() !== currentPatient.email.toLowerCase()) {
        const emailCheck = await isEmailAlreadyUsed(updates.email, patientId, 'patients');
        if (emailCheck.isUsed) {
          console.log(`❌ Email déjà utilisé dans: ${emailCheck.usedIn}`);
          return NextResponse.json(
            { error: emailCheck.message },
            { status: 400 }
          );
        }
      }
    }

    // Convertir chaîne vide en NULL
    if (updates.medecinreferentid === "") {
      updates.medecinreferentid = null;
    }

    // Vérifier uniquement si valeur non vide
    if (updates.medecinreferentid !== undefined && 
        updates.medecinreferentid !== null && 
        updates.medecinreferentid !== "") {
      
      const { data: medecinExists } = await supabaseAdmin
        .from('medecins_referents')
        .select('id')
        .eq('id', updates.medecinreferentid)
        .single();

      if (!medecinExists) {
        return NextResponse.json(
          { error: "Le médecin référent sélectionné n'existe pas" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour ✅ AVEC MÉDECIN RÉFÉRENT
    const { data: updatedPatient, error: updateError } = await supabaseAdmin
      .from('patients')
      .update({
        ...updates,
        dateMiseAJour: new Date().toISOString(),
      })
      .eq('id', patientId)
      .select(`
        *,
        medecinReferent:medecins_referents!patients_medecin_referent_fkey(
          id,
          prenom,
          nom,
          specialite,
          pays,
          email
        )
      `)
      .single();

    if (updateError) {
      console.error("Erreur mise à jour patient:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    console.log('✅ Patient mis à jour:', updatedPatient.id);

    // Retirer le mot de passe
    const { motDePasse: _, ...patientSansMotDePasse } = updatedPatient;

    return NextResponse.json({
      success: true,
      patient: patientSansMotDePasse,
    });
  } catch (error: any) {
    console.error("Erreur mise à jour patient:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;

    console.log('🗑️ Suppression patient:', patientId);

    // Supprimer le patient (cascade delete sur les relations)
    const { error } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (error) {
      throw error;
    }

    console.log('✅ Patient supprimé');

    return NextResponse.json({
      success: true,
      message: "Patient supprimé avec succès",
    });
  } catch (error: any) {
    console.error("Erreur suppression patient:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression du patient" },
      { status: 500 }
    );
  }
}