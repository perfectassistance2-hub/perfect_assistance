import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(request: NextRequest) {
  try {
    const { utilisateurId, currentPassword, newPassword } = await request.json();
    // Utiliser Supabase Auth pour changer le mot de passe
    // Code dépend de votre setup Auth
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}