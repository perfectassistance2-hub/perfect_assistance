import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// GET - Récupérer le dossier médical
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;

    const { data: dossier, error } = await supabaseAdmin
      .from('dossiers_medicaux')
      .select('*')
      .eq('patientId', patientId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return NextResponse.json(dossier || null);
  } catch (error) {
    console.error("Erreur récupération dossier médical:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// POST - Créer un dossier médical
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const body = await request.json();

    // Vérifier si un dossier existe déjà
    const { data: existing } = await supabaseAdmin
      .from('dossiers_medicaux')
      .select('id')
      .eq('patientId', patientId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Un dossier médical existe déjà pour ce patient" },
        { status: 400 }
      );
    }

    const dossierId = uuidv4();
    const now = new Date().toISOString();

    const { data: newDossier, error } = await supabaseAdmin
      .from('dossiers_medicaux')
      .insert({
        id: dossierId,
        patientId,
        groupeSanguin: body.groupeSanguin || null,
        allergies: body.allergies || null,
        maladiesChroniques: body.maladiesChroniques || null,
        medicamentsActuels: body.medicamentsActuels || null,
        antecedentsChirurgicaux: body.antecedentsChirurgicaux || null,
        antecedentsFamiliaux: body.antecedentsFamiliaux || null,
        raisonVisite: body.raisonVisite || null,
        traitementNecessaire: body.traitementNecessaire || null,
        notes: body.notes || null,
        dateCreation: now,
        dateMiseAJour: now,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création dossier:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      dossier: newDossier,
    });
  } catch (error: any) {
    console.error("Erreur création dossier médical:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour le dossier médical
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const updates = await request.json();

    const { data: updatedDossier, error } = await supabaseAdmin
      .from('dossiers_medicaux')
      .update({
        ...updates,
        dateMiseAJour: new Date().toISOString(),
      })
      .eq('patientId', patientId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      dossier: updatedDossier,
    });
  } catch (error) {
    console.error("Erreur mise à jour dossier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer le dossier médical (admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;

    const { error } = await supabaseAdmin
      .from('dossiers_medicaux')
      .delete()
      .eq('patientId', patientId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Dossier médical supprimé",
    });
  } catch (error) {
    console.error("Erreur suppression dossier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}