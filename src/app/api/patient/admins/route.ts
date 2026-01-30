// ========================================
// FICHIER: /app/api/patient/admins/route.ts
// ========================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    console.log('🔍 Récupération admins pour patient:', user.userId);

    // ✅ Récupérer TOUS les admins actifs
    const { data: utilisateurs, error } = await supabaseAdmin
      .from("utilisateurs")
      .select("id, prenom, nom, email, role, telephone, photo_url")
      .eq("estActif", true)
      .in("role", ["ADMIN", "SUPER_ADMIN", "COORDINATEUR"])
      .order("prenom", { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération admins:', error);
      throw error;
    }

    console.log('✅ Admins trouvés:', utilisateurs?.length || 0);

    // Marquer Vann Cliff comme recommandé
    const admins = (utilisateurs || []).map(user => ({
      id: user.id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
      telephone: user.telephone,
      photoUrl: user.photo_url, // ✅ Conversion snake_case → camelCase
      estRecommande: user.prenom === 'Vann' && user.nom === 'Cliff'
    }));

    // Logs détaillés
    admins.forEach(admin => {
      console.log(`  - ${admin.prenom} ${admin.nom} (${admin.id}) ${admin.estRecommande ? '⭐' : ''}`);
    });

    return NextResponse.json({
      success: true,
      admins
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}