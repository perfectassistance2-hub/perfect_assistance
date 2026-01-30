// ========================================
// FICHIER: /app/api/medecin/messages/[id]/route.ts
// ========================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

// PATCH - Marquer un message comme lu
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id: messageId } = await params;
    const medecinId = user.userId;

    console.log('📝 Marquage message lu:', { messageId, medecinId });

    // Marquer comme lu seulement si le médecin est le destinataire
    const { data: message, error } = await supabaseAdmin
      .from("messages")
      .update({
        estLu: true,
        dateLecture: new Date().toISOString()
      })
      .eq("id", messageId)
      .eq("destinataireId", medecinId)
      .eq("destinataireType", "medecin")
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur marquage lu:', error);
      throw error;
    }

    console.log('✅ Message marqué comme lu');

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