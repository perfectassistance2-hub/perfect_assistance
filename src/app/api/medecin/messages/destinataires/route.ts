// ========================================
// FICHIER: /app/api/medecin/messages/destinataires/route.ts
// ========================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    console.log('🔍 Récupération admins pour médecin:', user.userId);

    // Récupérer tous les ADMINS et SUPER_ADMINS
    const { data: utilisateurs, error } = await supabaseAdmin
      .from("utilisateurs")
      .select("id, prenom, nom, email, role")
      .eq("estActif", true)
      .in("role", ["ADMIN", "SUPER_ADMIN"])
      .order("prenom", { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération admins:', error);
      throw error;
    }

    console.log('✅ Admins trouvés:', utilisateurs?.length || 0);

    // Formater les destinataires
    const destinataires = (utilisateurs || []).map(user => ({
      id: user.id,
      nom: `${user.prenom} ${user.nom}`,
      prenom: user.prenom,
      email: user.email,
      role: user.role
    }));

    return NextResponse.json({
      success: true,
      destinataires
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}