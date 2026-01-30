// Fichier: app/api/medecin/rendez-vous/[id]/create-room/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== 'medecin') {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const rdvId = params.id;

    // Créer une salle Daily.co
    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: `consultation-${rdvId}`,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: 'cloud',
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // Expire dans 2h
        }
      })
    });

    if (!dailyResponse.ok) {
      const errorData = await dailyResponse.json();
      console.error('Erreur Daily.co:', errorData);
      throw new Error('Erreur création salle Daily.co');
    }

    const roomData = await dailyResponse.json();

    return NextResponse.json({
      success: true,
      roomUrl: roomData.url,
      roomName: roomData.name
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}