import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Rendez-vous API - Début (GET)');

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
    const filter = searchParams.get('filter') || 'tous'; // 'avenir', 'passes', 'tous'

    let query = supabaseAdmin
      .from('rendez_vous')
      .select(`
        *,
        medecin:medecins(id, prenom, nom, specialite, telephone, email),
        clinique:cliniques(id, nom, ville, adresse, telephone),
        consultationVideo:consultations_video(
          id,
          daily_room_name,
          daily_room_url,
          lien_patient,
          statut
        )
      `)
      .eq('patientId', patientId);

    // Filtrer selon le paramètre
    const now = new Date().toISOString();
    if (filter === 'avenir') {
      query = query.gte('datePrevue', now).in('statut', ['PLANIFIE', 'CONFIRME']);
    } else if (filter === 'passes') {
      query = query.or(`datePrevue.lt.${now},statut.eq.TERMINE,statut.eq.ANNULE`);
    }

    const { data: rendezVous, error } = await query.order('datePrevue', { ascending: filter === 'avenir' });

    if (error) {
      throw new Error(error.message);
    }

    // Séparer par catégories
    const avenir = rendezVous?.filter(rdv => 
      new Date(rdv.datePrevue) >= new Date() && 
      (rdv.statut === 'PLANIFIE' || rdv.statut === 'CONFIRME')
    ) || [];

    const passes = rendezVous?.filter(rdv => 
      new Date(rdv.datePrevue) < new Date() || 
      rdv.statut === 'TERMINE' || 
      rdv.statut === 'ANNULE'
    ) || [];

    return NextResponse.json({
      success: true,
      avenir,
      passes,
      tous: rendezVous || []
    });

  } catch (error: any) {
    console.error('💥 Erreur rendez-vous GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}