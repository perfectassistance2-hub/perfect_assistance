// lib/zegocloud-config.ts

export const ZEGOCLOUD_CONFIG = {
  APP_ID: parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0"),
  SERVER_SECRET: process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "",
  MAX_PARTICIPANTS: 10,
  MAX_DURATION_MINUTES: 240, // 4 heures
};

/**
 * Obtenir l'URL de base de l'application
 */
function getBaseUrl(): string {
  // En production, utiliser la variable d'environnement ou détecter automatiquement
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Détection automatique pour Vercel
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  // Fallback pour le développement local
  return 'http://localhost:3000';
}

/**
 * Générer un ID de room unique pour ZegoCloud
 */
export function generateZegoRoomId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `zego_${timestamp}_${random}`;
}

/**
 * Générer un lien d'accès pour ZegoCloud
 * Note: ZegoCloud utilise un système de token généré côté client
 * Le lien contient les paramètres nécessaires pour rejoindre
 */
export function generateZegoAccessLink(
  roomId: string,
  userName: string,
  role: 'patient' | 'medecin' | 'admin'
): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/visio/zego/${roomId}?userName=${encodeURIComponent(userName)}&role=${role}`;
}

/**
 * Valider la configuration ZegoCloud
 */
export function validateZegoConfig(): boolean {
  return !!(ZEGOCLOUD_CONFIG.APP_ID && ZEGOCLOUD_CONFIG.SERVER_SECRET);
}