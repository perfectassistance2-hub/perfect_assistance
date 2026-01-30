import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Profil API - Début (GET)');

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

    // Récupérer les informations complètes du patient
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error || !patient) {
      return NextResponse.json(
        { error: 'Patient introuvable' },
        { status: 404 }
      );
    }

    // Récupérer le dossier médical
    const { data: dossierMedical } = await supabaseAdmin
      .from('dossiers_medicaux')
      .select('*')
      .eq('patientId', patientId)
      .single();

    return NextResponse.json({
      success: true,
      patient,
      dossierMedical: dossierMedical || null
    });

  } catch (error: any) {
    console.error('💥 Erreur profil GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('📊 Profil API - Début (PUT)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const body = await request.json();

    console.log('Données à mettre à jour:', body);

    // Filtrer les champs autorisés à être modifiés
    const allowedFields = [
      'telephone',
      'whatsapp',
      'ville',
      'adresse',
      'codePostal',
      'langue'
    ];

    const updates: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // Ajouter la date de mise à jour
    updates.dateMiseAJour = new Date().toISOString();

    // Mettre à jour le patient
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .update(updates)
      .eq('id', patientId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      patient,
      message: 'Profil mis à jour avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur profil PUT:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}