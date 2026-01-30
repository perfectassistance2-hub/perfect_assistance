// ========================================
// FICHIER: /app/api/patient/messages/route.ts
// CORRIGÉ - Syntaxe OR sans guillemets
// ========================================
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Messages API - Début (GET)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    console.log('PatientId:', patientId);

    // ✅ CORRECTION: Supprimer les guillemets autour des noms de colonnes
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`and(destinataireId.eq.${patientId},destinataireType.eq.patient),and(expediteurId.eq.${patientId},expediteurType.eq.patient)`)
      .order('dateCreation', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération messages:', error);
      throw new Error(error.message);
    }

    console.log(`✅ ${messages?.length || 0} messages bruts récupérés`);

    // Enrichir avec les infos expediteur (si c'est un admin)
    const enrichedMessages = await Promise.all(
      (messages || []).map(async (msg) => {
        let expediteur = null;
        
        if (msg.expediteurId && msg.expediteurType === 'utilisateur') {
          const { data } = await supabaseAdmin
            .from('utilisateurs')
            .select('id, prenom, nom, role')
            .eq('id', msg.expediteurId)
            .maybeSingle(); // ✅ Utiliser maybeSingle au lieu de single
          expediteur = data;
        }
        
        return { ...msg, expediteur };
      })
    );

    console.log('✅ Messages enrichis:', enrichedMessages?.length || 0);
    
    return NextResponse.json({
      success: true,
      messages: enrichedMessages || []
    });

  } catch (error: any) {
    console.error('💥 Erreur messages GET:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST pour envoyer un message du PATIENT vers un ADMIN
export async function POST(request: NextRequest) {
  try {
    console.log('📊 Messages API - Début (POST)');

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const body = await request.json();

    const { contenu, sujet, destinataireId } = body;

    if (!contenu) {
      return NextResponse.json(
        { error: 'Le contenu du message est requis' },
        { status: 400 }
      );
    }

    console.log('📤 Envoi message:', { patientId, destinataireId });

    // Patient → Admin
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        expediteurId: patientId,
        expediteurType: 'patient',
        destinataireId: destinataireId || null,
        destinataireType: 'utilisateur',
        contenu,
        sujet: sujet || null,
        estLu: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion message:', error);
      throw new Error(error.message);
    }

    console.log('✅ Message envoyé:', message.id);

    return NextResponse.json({
      success: true,
      message,
      messageText: 'Message envoyé avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur messages POST:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT pour marquer comme lu
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId requis' },
        { status: 400 }
      );
    }

    // Marquer comme lu les messages reçus par le patient
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ 
        estLu: true,
        dateLecture: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('destinataireId', patientId)
      .eq('destinataireType', 'patient');

    if (error) {
      console.error('❌ Erreur marquage lu:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Message marqué comme lu'
    });

  } catch (error: any) {
    console.error('💥 Erreur messages PUT:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE pour supprimer ses propres messages
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId requis' },
        { status: 400 }
      );
    }

    // Vérifier que le message appartient au patient (qu'il l'a envoyé)
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .eq('expediteurId', patientId)
      .eq('expediteurType', 'patient')
      .maybeSingle(); // ✅ Utiliser maybeSingle

    if (!message) {
      return NextResponse.json(
        { error: 'Message non trouvé ou vous ne pouvez pas le supprimer' },
        { status: 404 }
      );
    }

    // Supprimer le message
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('❌ Erreur suppression:', error);
      throw new Error(error.message);
    }

    console.log('✅ Message supprimé');

    return NextResponse.json({
      success: true,
      message: 'Message supprimé avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur messages DELETE:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}