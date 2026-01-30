import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Devis API - Début (GET)');

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

    // Récupérer tous les devis du patient
    const { data: devis, error } = await supabaseAdmin
      .from('devis')
      .select(`
        *,
        sejour:sejours(
          id,
          typeTraitement,
          dateArrivee,
          dateDepart
        )
      `)
      .eq('patientId', patientId)
      .order('dateCreation', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      devis: devis || []
    });

  } catch (error: any) {
    console.error('💥 Erreur devis GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}