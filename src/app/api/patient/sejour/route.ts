import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Séjour API - Début (GET)');

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

    // Récupérer les séjours du patient (actifs et passés)
    const { data: sejours, error } = await supabaseAdmin
      .from('sejours')
      .select(`
        *,
        medecin:medecins(id, prenom, nom, specialite, telephone, email),
        clinique:cliniques(
          id,
          nom,
          ville,
          pays,
          adresse,
          telephone,
          email,
          siteWeb,
          specialites
        ),
        coordinateur:utilisateurs(id, prenom, nom, email, telephone)
      `)
      .eq('patientId', patientId)
      .order('dateArrivee', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Séparer séjours actifs et passés
    const sejoursActifs = sejours?.filter(s => 
      s.statut === 'PLANIFIE' || s.statut === 'EN_COURS'
    ) || [];
    
    const sejoursPasses = sejours?.filter(s => 
      s.statut === 'TERMINE' || s.statut === 'ANNULE'
    ) || [];

    return NextResponse.json({
      success: true,
      sejoursActifs,
      sejoursPasses
    });

  } catch (error: any) {
    console.error('💥 Erreur séjour GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}