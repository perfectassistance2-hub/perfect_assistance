// =====================================================
// CONFIGURATION DAILY.CO
// =====================================================

/**
 * Configuration pour l'intégration Daily.co
 * 
 * ÉTAPES D'INSTALLATION :
 * 
 * 1. Créer un compte sur https://daily.co
 * 2. Obtenir votre API Key depuis le dashboard
 * 3. Ajouter dans .env.local :
 *    DAILY_API_KEY=votre_api_key_ici
 *    NEXT_PUBLIC_DAILY_DOMAIN=votre-domaine.daily.co
 * 
 * 4. Installer le SDK :
 *    npm install @daily-co/daily-js
 *    npm install @daily-co/daily-react
 */

// =====================================================
// TYPES
// =====================================================

export type DailyRoomConfig = {
  name: string; // Nom unique de la room
  privacy: 'public' | 'private';
  properties?: {
    exp?: number; // Timestamp d'expiration (Unix)
    enable_screenshare?: boolean;
    enable_chat?: boolean;
    enable_recording?: 'cloud' | 'local' | 'raw-tracks';
    start_video_off?: boolean;
    start_audio_off?: boolean;
    max_participants?: number;
  };
};

export type DailyRoomResponse = {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: {
    exp?: number;
    enable_screenshare?: boolean;
    enable_chat?: boolean;
    enable_recording?: string;
  };
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Générer un nom unique pour une room Daily.co
 */
export function generateRoomName(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `perfect-assistance-${timestamp}-${random}`;
}

/**
 * Créer une room Daily.co via l'API
 */
export async function createDailyRoom(config: DailyRoomConfig): Promise<DailyRoomResponse> {
  const apiKey = process.env.DAILY_API_KEY;
  
  if (!apiKey) {
    throw new Error('DAILY_API_KEY non configurée dans .env.local');
  }

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur Daily.co: ${error.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Supprimer une room Daily.co
 */
export async function deleteDailyRoom(roomName: string): Promise<void> {
  const apiKey = process.env.DAILY_API_KEY;
  
  if (!apiKey) {
    throw new Error('DAILY_API_KEY non configurée');
  }

  const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.json();
    throw new Error(`Erreur suppression room: ${error.error || response.statusText}`);
  }
}

/**
 * Obtenir les infos d'une room Daily.co
 */
export async function getDailyRoom(roomName: string): Promise<DailyRoomResponse> {
  const apiKey = process.env.DAILY_API_KEY;
  
  if (!apiKey) {
    throw new Error('DAILY_API_KEY non configurée');
  }

  const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur récupération room: ${error.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Générer un token d'accès pour une room (optionnel, pour plus de sécurité)
 */
export async function createMeetingToken(
  roomName: string,
  userName: string,
  isOwner: boolean = false
): Promise<string> {
  const apiKey = process.env.DAILY_API_KEY;
  
  if (!apiKey) {
    throw new Error('DAILY_API_KEY non configurée');
  }

  const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
        enable_recording: isOwner ? 'local' : undefined,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erreur création token: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

// =====================================================
// CONSTANTES
// =====================================================

export const DAILY_CONFIG = {
  // Durée max d'une consultation (4 heures)
  MAX_DURATION_MINUTES: 240,
  
  // Nombre max de participants
  MAX_PARTICIPANTS: 10,
  
  // Expiration par défaut des rooms (24h après création)
  DEFAULT_EXPIRATION_HOURS: 24,
  
  // Options par défaut
  DEFAULT_ROOM_OPTIONS: {
    enable_screenshare: true,
    enable_chat: true,
    enable_recording: 'local' as const,
    start_video_off: false,
    start_audio_off: false,
  },
};

// =====================================================
// UTILITAIRES
// =====================================================

/**
 * Calculer le timestamp d'expiration
 */
export function calculateExpiration(durationMinutes: number): number {
  const now = Date.now();
  const expirationMs = now + (durationMinutes + 60) * 60 * 1000; // +1h de marge
  return Math.floor(expirationMs / 1000);
}

/**
 * Valider la configuration d'une room
 */
export function validateRoomConfig(config: Partial<DailyRoomConfig>): boolean {
  if (!config.name || config.name.length < 5) {
    return false;
  }
  
  if (config.privacy && !['public', 'private'].includes(config.privacy)) {
    return false;
  }
  
  return true;
}