import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Documents API - Début (GET)');

    const user = await getAuthUser(request);
    
    console.log('User:', user);

    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    console.log('PatientId:', patientId);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filtrer par type si fourni

    let query = supabaseAdmin
      .from('documents')
      .select('*')
      .eq('patientId', patientId);

    // Ne filtrer que si le type est spécifié ET différent de 'TOUS'
    if (type && type !== 'TOUS' && type !== 'tous') {
      query = query.eq('type', type);
    }

    const { data: documents, error } = await query.order('dateTeleversement', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Grouper par type (types alignés avec l'admin)
    const parType: any = {
      PASSEPORT: [],
      CARTE_IDENTITE: [],
      EXAMEN_MEDICAL: [],
      ORDONNANCE: [],
      FACTURE: [],
      RECU: [],
      AUTRE: []
    };

    documents?.forEach(doc => {
      const docType = doc.type || 'AUTRE';
      if (parType[docType]) {
        parType[docType].push(doc);
      } else {
        parType.AUTRE.push(doc);
      }
    });

    return NextResponse.json({
      success: true,
      documents: documents || [],
      parType
    });

  } catch (error: any) {
    console.error('💥 Erreur documents GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST pour upload (à implémenter avec Supabase Storage)
export async function POST(request: NextRequest) {
  try {
    console.log('📊 Documents API - Début (POST)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const body = await request.json();

    const { titre, description, type, urlFichier, nomFichier, tailleFichier, typeMime } = body;

    if (!titre || !type || !urlFichier || !nomFichier) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Créer le document
    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .insert({
        patientId,
        titre,
        description: description || null,
        type,
        urlFichier,
        nomFichier,
        tailleFichier: tailleFichier || 0,
        typeMime: typeMime || 'application/octet-stream',
        ajoutePar: 'patient',
        partageAvecMedecin: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      document,
      message: 'Document ajouté avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur documents POST:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}