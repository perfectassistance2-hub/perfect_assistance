import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: NextRequest) {
  try {
    const { utilisateurId, prenom, nom, telephone } = await request.json();
    const { data, error } = await supabaseAdmin
      .from("utilisateurs")
      .update({ prenom, nom, telephone })
      .eq("id", utilisateurId)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, utilisateur: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}