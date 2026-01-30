import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Liste toutes les cliniques
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabaseAdmin
      .from('cliniques')
      .select('*')
      .order('nom');

    if (!includeInactive) {
      query = query.eq('estActif', true);
    }

    const { data: cliniques, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(cliniques || []);
  } catch (error) {
    console.error("Erreur chargement cliniques:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des cliniques" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle clinique
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nom,
      adresse,
      ville,
      pays = "Maroc",
      telephone,
      email,
      siteWeb,
      specialites,
    } = body;

    // Validation
    if (!nom || !adresse || !ville || !telephone) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Créer la clinique
    const { data: newClinique, error } = await supabaseAdmin
      .from('cliniques')
      .insert({
        nom,
        adresse,
        ville,
        pays,
        telephone,
        email: email || null,
        siteWeb: siteWeb || null,
        specialites: specialites ? JSON.stringify(specialites) : null,
        estActif: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      clinique: newClinique,
    });
  } catch (error) {
    console.error("Erreur création clinique:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la clinique" },
      { status: 500 }
    );
  }
}