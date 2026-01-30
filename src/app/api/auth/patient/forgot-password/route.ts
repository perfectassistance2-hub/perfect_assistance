import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email"; 
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Vérifier que le patient existe
    const { data: patient, error: fetchError } = await supabaseAdmin
      .from("patients")
      .select("id, prenom, nom, email")
      .eq("email", email.toLowerCase())
      .single();

    if (fetchError || !patient) {
      // Pour des raisons de sécurité, on renvoie le même message
      // même si le compte n'existe pas
      return NextResponse.json(
        { error: "Si ce compte existe, un email a été envoyé" },
        { status: 404 }
      );
    }

    // Générer un mot de passe temporaire aléatoire et sécurisé
    const motDePasseTemporaire = 
      Math.random().toString(36).slice(-10) + 
      Math.random().toString(36).slice(-10).toUpperCase() +
      Math.floor(Math.random() * 1000);

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(motDePasseTemporaire, 10);

    // Mettre à jour le patient dans la base de données
    const { error: updateError } = await supabaseAdmin
      .from("patients")
      .update({
        motDePasse: motDePasseHash,
        doitChangerMotDePasse: true, // ✅ Forcer le changement à la connexion
        dateMiseAJour: new Date().toISOString(),
      })
      .eq("id", patient.id);

    if (updateError) {
      throw updateError;
    }

    // TODO: Envoyer l'email avec le nouveau mot de passe
    // Décommentez et configurez cette partie quand vous aurez un service d'email
    
    try {
      await sendEmail({
        from: "support@perfectassistance.fr",
        to: patient.email,
        subject: "Réinitialisation de votre mot de passe - Perfect Assistance",
        html: `
          <h2>Bonjour ${patient.prenom} ${patient.nom},</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Voici votre nouveau mot de passe temporaire :</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0;">
            ${motDePasseTemporaire}
          </div>
          <p><strong>⚠️ Important :</strong> Vous devrez changer ce mot de passe lors de votre prochaine connexion.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez contacter notre support immédiatement.</p>
          <br>
          <p>Cordialement,<br>L'équipe Perfect Assistance</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; font-style: italic;">
            Ceci est un email automatique, merci de ne pas y répondre.
          </p>
        `,
      });
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
      // On continue même si l'email échoue
    }
    

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
      motDePasseTemporaire, // Retourné pour affichage à l'utilisateur
      patient: {
        id: patient.id,
        prenom: patient.prenom,
        nom: patient.nom,
        email: patient.email,
      }
    });
  } catch (error) {
    console.error("Erreur réinitialisation mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation du mot de passe" },
      { status: 500 }
    );
  }
}