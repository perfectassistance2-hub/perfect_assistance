import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Notifications API - Début (GET)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const { searchParams } = new URL(request.url);
    const filtre = searchParams.get('filtre'); // 'all', 'non_lues', 'lues'

    console.log('PatientId:', patientId, 'Filtre:', filtre);

    // Construction de la requête selon le filtre
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('patientId', patientId)
      .order('dateCreation', { ascending: false });

    if (filtre === 'non_lues') {
      query = query.eq('estLu', false);
    } else if (filtre === 'lues') {
      query = query.eq('estLu', true);
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Compter les non lues
    const { count: countNonLues } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('patientId', patientId)
      .eq('estLu', false);

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      countNonLues: countNonLues || 0
    });

  } catch (error: any) {
    console.error('💥 Erreur notifications GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT pour marquer comme lu
export async function PUT(request: NextRequest) {
  try {
    console.log('📊 Notifications API - Début (PUT)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Marquer toutes les notifications comme lues
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ 
          estLu: true,
          dateLecture: new Date().toISOString()
        })
        .eq('patientId', patientId)
        .eq('estLu', false);

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        message: 'Toutes les notifications marquées comme lues'
      });
    } else {
      // Marquer une notification spécifique comme lue
      if (!notificationId) {
        return NextResponse.json(
          { error: 'notificationId requis' },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ 
          estLu: true,
          dateLecture: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('patientId', patientId);

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        message: 'Notification marquée comme lue'
      });
    }

  } catch (error: any) {
    console.error('💥 Erreur notifications PUT:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE pour supprimer une notification
export async function DELETE(request: NextRequest) {
  try {
    console.log('📊 Notifications API - Début (DELETE)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId requis' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('patientId', patientId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Notification supprimée'
    });

  } catch (error: any) {
    console.error('💥 Erreur notifications DELETE:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}