import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const utilisateurId = formData.get("utilisateurId") as string;
    
    const fileName = `${utilisateurId}-${Date.now()}.${photo.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("profiles")
      .upload(fileName, photo, { upsert: true });
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabaseAdmin.storage.from("profiles").getPublicUrl(fileName);
    
    const { error: updateError } = await supabaseAdmin
      .from("utilisateurs")
      .update({ photo_url: publicUrl })
      .eq("id", utilisateurId);
    if (updateError) throw updateError;
    
    return NextResponse.json({ success: true, photoUrl: publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { utilisateurId } = await request.json();
    const { error } = await supabaseAdmin
      .from("utilisateurs")
      .update({ photo_url: null })
      .eq("id", utilisateurId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}