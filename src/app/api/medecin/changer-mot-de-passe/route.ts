// Fichier: app/api/medecin/changer-mot-de-passe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getAuthUser(request);
    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword, isFirstLogin } = await request.json();

    console.log('🔑 Changement mot de passe médecin:', user.userId);

    // Validation du nouveau mot de passe
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Validation force du mot de passe
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre" },
        { status: 400 }
      );
    }

    // Récupérer le médecin
    const { data: medecin, error: fetchError } = await supabaseAdmin
      .from("medecins")
      .select("motDePasse, doitChangerMotDePasse")
      .eq("id", user.userId)
      .single();

    if (fetchError || !medecin) {
      return NextResponse.json(
        { error: "Médecin introuvable" },
        { status: 404 }
      );
    }

    // Si ce n'est pas la première connexion et pas un changement obligatoire,
    // vérifier le mot de passe actuel
    if (!isFirstLogin && !medecin.doitChangerMotDePasse) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Mot de passe actuel requis" },
          { status: 400 }
        );
      }

      const passwordMatch = await bcrypt.compare(currentPassword, medecin.motDePasse);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 401 }
        );
      }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe ET reset le flag
    const { error: updateError } = await supabaseAdmin
      .from("medecins")
      .update({ 
        motDePasse: hashedPassword,
        doitChangerMotDePasse: false // Reset le flag
      })
      .eq("id", user.userId);

    if (updateError) {
      console.error("Erreur mise à jour:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du mot de passe" },
        { status: 500 }
      );
    }

    console.log('✅ Mot de passe médecin changé');

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès"
    });
  } catch (error: any) {
    console.error("💥 Erreur changement mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    );
  }
}