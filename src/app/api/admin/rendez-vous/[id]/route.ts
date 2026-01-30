import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Détails d'un rendez-vous
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

    const { data: rendezVous, error } = await supabaseAdmin
      .from('rendez_vous')
      .select(`
        *,
        patient:patients(id, prenom, nom, email, telephone, whatsapp),
        medecin:medecins(id, prenom, nom, specialite, telephone, email),
        clinique:cliniques(id, nom, adresse, ville, telephone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Erreur Supabase GET:", error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Rendez-vous non trouvé" },
          { status: 404 }
        );
      }
      
      throw error;
    }

    if (!rendezVous) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(rendezVous);
  } catch (error: any) {
    console.error("Erreur récupération rendez-vous:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un rendez-vous
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

    const updates = await request.json();

    // Supprimer les champs qui ne doivent pas être modifiés
    delete updates.id;
    delete updates.dateCreation;
    delete updates.patient;
    delete updates.medecin;
    delete updates.clinique;

    // Vérifier que le rendez-vous existe
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('rendez_vous')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour
    const { data: updatedRendezVous, error } = await supabaseAdmin
      .from('rendez_vous')
      .update({
        ...updates,
        dateMiseAJour: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        patient:patients(id, prenom, nom, email),
        medecin:medecins(id, prenom, nom, specialite),
        clinique:cliniques(id, nom, ville)
      `)
      .single();

    if (error) {
      console.error("Erreur Supabase UPDATE:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      rendezVous: updatedRendezVous,
    });
  } catch (error: any) {
    console.error("Erreur mise à jour rendez-vous:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un rendez-vous
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

    // Vérifier que le rendez-vous existe
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('rendez_vous')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer
    const { error } = await supabaseAdmin
      .from('rendez_vous')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Erreur Supabase DELETE:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Rendez-vous supprimé avec succès",
    });
  } catch (error: any) {
    console.error("Erreur suppression rendez-vous:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}