import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Liste des documents d'un patient
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const type = searchParams.get('type');

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID requis" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('documents')
      .select('*')
      .eq('patientId', patientId)
      .order('dateTeleversement', { ascending: false });

    if (type && type !== 'TOUS') {
      query = query.eq('type', type);
    }

    const { data: documents, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(documents || []);
  } catch (error) {
    console.error("Erreur chargement documents:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des documents" },
      { status: 500 }
    );
  }
}

// POST - Créer/uploader un document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      type,
      titre,
      description,
      urlFichier,
      nomFichier,
      tailleFichier,
      typeMime,
    } = body;

    // Validation
    if (!patientId || !type || !titre || !urlFichier || !nomFichier) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // Créer le document
    const { data: newDocument, error } = await supabaseAdmin
      .from('documents')
      .insert({
        patientId,
        type,
        titre,
        description: description || null,
        urlFichier,
        nomFichier,
        tailleFichier: tailleFichier || 0,
        typeMime: typeMime || 'application/octet-stream',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      document: newDocument,
    });
  } catch (error) {
    console.error("Erreur création document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du document" },
      { status: 500 }
    );
  }
}