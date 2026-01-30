// app/api/admin/patients/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    // Récupérer les rendez-vous avec relations
    const { data: rendezVous } = await supabaseAdmin
      .from('rendez_vous')
      .select(`
        *,
        medecin:medecins(prenom, nom),
        clinique:cliniques(nom)
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

    // Retirer les champs non modifiables
    delete updates.id;
    delete updates.dateCreation;
    delete updates.motDePasse; // Le mot de passe se change via une route dédiée

    // ✅ CORRECTION : Convertir chaîne vide en NULL
    if (updates.medecinreferentid === "") {
      updates.medecinreferentid = null;
    }

    // ✅ CORRECTION : Vérifier uniquement si valeur non vide
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

    // Supprimer le patient (cascade delete sur les relations)
    const { error } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Patient supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression patient:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du patient" },
      { status: 500 }
    );
  }
}