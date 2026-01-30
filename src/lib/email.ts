// src/lib/email.ts
import nodemailer from 'nodemailer';

/**
 * Interface pour les paramètres d'envoi d'email
 */
interface SendEmailParams {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Configuration du transporteur principal (direction@perfectassistance.fr)
 */
function createPrimaryTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true pour le port 465, false pour les autres
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

/**
 * Configuration du transporteur de secours (perfectassistance2@gmail.com)
 */
function createFallbackTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_FALLBACK_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_FALLBACK_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_FALLBACK_USER,
      pass: process.env.EMAIL_FALLBACK_PASSWORD,
    },
  });
}

/**
 * Fonction pour envoyer des emails avec système de fallback automatique
 * 
 * CONFIGURATION REQUISE dans .env.local :
 * 
 * # Configuration principale (direction@perfectassistance.fr)
 * EMAIL_HOST=smtp.votreservice.com
 * EMAIL_PORT=587
 * EMAIL_USER=direction@perfectassistance.fr
 * EMAIL_PASSWORD=votre-mot-de-passe
 * 
 * # Configuration de secours (Gmail)
 * EMAIL_FALLBACK_HOST=smtp.gmail.com
 * EMAIL_FALLBACK_PORT=587
 * EMAIL_FALLBACK_USER=perfectassistance2@gmail.com
 * EMAIL_FALLBACK_PASSWORD=votre-mot-de-passe-application-gmail
 */
export async function sendEmail({
  from = "support@perfectassistance.fr",
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<void> {
  
  // Tentative 1 : Envoi avec le compte principal
  try {
    const primaryTransporter = createPrimaryTransporter();
    
    await primaryTransporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });
    
    console.log(`✅ Email envoyé avec succès à ${to} via ${process.env.EMAIL_USER}`);
    return; // Succès, on sort de la fonction
    
  } catch (primaryError) {
    console.warn(`⚠️ Échec envoi avec compte principal (${process.env.EMAIL_USER}):`, primaryError);
    console.log(`🔄 Tentative avec le compte de secours...`);
  }

  // Tentative 2 : Envoi avec le compte de secours (Gmail)
  try {
    const fallbackTransporter = createFallbackTransporter();
    
    // Utiliser l'adresse Gmail comme expéditeur pour le fallback
    const fallbackFrom = process.env.EMAIL_FALLBACK_USER || "perfectassistance2@gmail.com";
    
    await fallbackTransporter.sendMail({
      from: fallbackFrom,
      to,
      subject,
      html,
      text,
      replyTo: "support@perfectassistance.fr", // Les réponses iront vers le compte principal
    });
    
    console.log(`✅ Email envoyé avec succès à ${to} via compte de secours (${fallbackFrom})`);
    return; // Succès avec le fallback
    
  } catch (fallbackError) {
    console.error(`❌ Échec envoi avec compte de secours:`, fallbackError);
    throw new Error(`Impossible d'envoyer l'email après 2 tentatives`);
  }
}