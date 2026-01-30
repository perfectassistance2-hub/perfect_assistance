import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const utilisateurId = searchParams.get("utilisateurId");
    const { data, error } = await supabaseAdmin
      .from("parametres_utilisateur")
      .select("*")
      .eq("utilisateur_id", utilisateurId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return NextResponse.json(data || {});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { utilisateurId, ...parametres } = body;
    const { data, error } = await supabaseAdmin
      .from("parametres_utilisateur")
      .upsert({ utilisateur_id: utilisateurId, ...parametres })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, parametres: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}