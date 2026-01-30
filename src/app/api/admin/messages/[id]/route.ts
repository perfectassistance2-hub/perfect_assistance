// ========================================
// FICHIER: /app/api/admin/messages/[id]/route.ts
// ========================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// PATCH - Marquer comme lu
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messagesId } = await params;
    
    console.log(`📬 PATCH /api/admin/messages/${messagesId} - Marquage comme lu`);
    
    const { data: updatedMessage, error } = await supabaseAdmin
      .from("messages")
      .update({
        estLu: true,
        dateLecture: new Date().toISOString(),
      })
      .eq("id", messagesId)
      .select()
      .single();

    if (error) {
      console.error("❌ Erreur mise à jour:", error);
      throw error;
    }

    console.log("✅ Message marqué comme lu");

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour message:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messagesId } = await params;
    
    console.log(`🗑️ DELETE /api/admin/messages/${messagesId}`);
    
    const { error } = await supabaseAdmin
      .from("messages")
      .delete()
      .eq("id", messagesId);

    if (error) {
      console.error("❌ Erreur suppression:", error);
      throw error;
    }

    console.log("✅ Message supprimé");

    return NextResponse.json({
      success: true,
      message: "Message supprimé",
    });
  } catch (error) {
    console.error("❌ Erreur suppression message:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}