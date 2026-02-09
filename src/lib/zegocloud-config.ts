// lib/zegocloud-config.ts

export const ZEGOCLOUD_CONFIG = {
  APP_ID: parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0"),
  SERVER_SECRET: process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "",
  MAX_PARTICIPANTS: 10,
  MAX_DURATION_MINUTES: 240, // 4 heures
};

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/visio/zego/${roomId}?userName=${encodeURIComponent(userName)}&role=${role}`;
}

/**
 * Valider la configuration ZegoCloud
 */
export function validateZegoConfig(): boolean {
  return !!(ZEGOCLOUD_CONFIG.APP_ID && ZEGOCLOUD_CONFIG.SERVER_SECRET);
}