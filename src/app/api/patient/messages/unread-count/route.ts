// ========================================
// FICHIER: /app/api/patient/messages/unread-count/route.ts
// ========================================
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;

    // Compter les messages NON LUS reçus par le patient
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('destinataireId', patientId)
      .eq('destinataireType', 'patient')
      .eq('estLu', false);

    if (error) {
      console.error('❌ Erreur comptage messages:', error);
      throw error;
    }

    console.log(`✅ Messages non lus patient ${patientId}:`, count || 0);

    return NextResponse.json({
      success: true,
      count: count || 0
    });

  } catch (error: any) {
    console.error('💥 Erreur:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}