// ========================================
// FICHIER: /app/api/medecin/messages/route.ts
// AVEC DELETE POUR SUPPRIMER SES MESSAGES
// ========================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

// Helper pour récupérer les infos d'un utilisateur (médecin, patient ou utilisateur)
async function getUserInfo(userId: string, userType: string) {
  if (userType === 'medecin') {
    const { data } = await supabaseAdmin
      .from("medecins")
      .select("id, prenom, nom, email")
      .eq("id", userId)
      .single();
    return data ? { ...data, role: 'medecin' } : null;
  } else if (userType === 'patient') {
    const { data } = await supabaseAdmin
      .from("patients")
      .select("id, prenom, nom, email")
      .eq("id", userId)
      .single();
    return data ? { ...data, role: 'patient' } : null;
  } else if (userType === 'utilisateur') {
    const { data } = await supabaseAdmin
      .from("utilisateurs")
      .select("id, prenom, nom, email, role")
      .eq("id", userId)
      .single();
    return data;
  }
  return null;
}

// GET - Liste des messages du médecin
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const medecinId = user.userId;

    // Récupérer les messages où le médecin est expéditeur ou destinataire
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .or(`and(expediteurId.eq.${medecinId},expediteurType.eq.medecin),and(destinataireId.eq.${medecinId},destinataireType.eq.medecin)`)
      .order("dateCreation", { ascending: true }); // ✅ Plus anciens en haut

    if (error) {
      console.error('❌ Erreur récupération messages:', error);
      throw error;
    }

    // Enrichir avec les infos des expéditeurs et destinataires
    const enrichedMessages = await Promise.all(
      (messages || []).map(async (msg) => {
        const expediteur = msg.expediteurId && msg.expediteurType
          ? await getUserInfo(msg.expediteurId, msg.expediteurType)
          : null;
        
        const destinataire = msg.destinataireId && msg.destinataireType
          ? await getUserInfo(msg.destinataireId, msg.destinataireType)
          : null;

        return {
          ...msg,
          expediteur,
          destinataire
        };
      })
    );

    return NextResponse.json({
      success: true,
      messages: enrichedMessages
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Envoyer un message
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const medecinId = user.userId;
    const body = await request.json();

    console.log('📤 Envoi message médecin:', { 
      medecinId, 
      destinataireId: body.destinataireId,
      destinataireType: body.destinataireType 
    });

    // Vérifier que le destinataire existe
    const destinataire = await getUserInfo(body.destinataireId, body.destinataireType);
    
    if (!destinataire) {
      return NextResponse.json(
        { error: "Destinataire introuvable" },
        { status: 404 }
      );
    }

    // Insérer le message
    const { data: message, error } = await supabaseAdmin
      .from("messages")
      .insert({
        expediteurId: medecinId,
        expediteurType: 'medecin',
        destinataireId: body.destinataireId,
        destinataireType: body.destinataireType,
        sujet: body.sujet,
        contenu: body.contenu,
        urlPieceJointe: body.urlPieceJointe || null,
        nomPieceJointe: body.nomPieceJointe || null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion message:', error);
      throw error;
    }

    console.log('✅ Message envoyé:', message.id);

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer ses propres messages
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const medecinId = user.userId;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId requis' },
        { status: 400 }
      );
    }

    console.log('🗑️ Suppression message médecin:', { medecinId, messageId });

    // Vérifier que le message appartient au médecin (qu'il l'a envoyé)
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .eq('expediteurId', medecinId)
      .eq('expediteurType', 'medecin')
      .single();

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
      throw error;
    }

    console.log('✅ Message supprimé');

    return NextResponse.json({
      success: true,
      message: 'Message supprimé avec succès'
    });

  } catch (error: any) {
    console.error("💥 Erreur messages DELETE:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}