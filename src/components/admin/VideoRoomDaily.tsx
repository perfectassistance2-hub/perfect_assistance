// components/admin/VideoRoomDaily.tsx

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import DailyIframe, { 
  DailyCall, 
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft 
} from "@daily-co/daily-js";

type VideoRoomDailyProps = {
  roomUrl: string;
  userName: string;
  isOwner?: boolean;
  enregistrementAutorise?: boolean;
  onLeave?: () => void;
};

export default function VideoRoomDaily({
  roomUrl,
  userName,
  isOwner = false,
  enregistrementAutorise = false,
  onLeave,
}: VideoRoomDailyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<number>(0);
  
  // MediaRecorder pour enregistrement local
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Créer et joindre la room
    const createAndJoinRoom = async () => {
      try {
        setIsLoading(true);

        if (!containerRef.current) {
          throw new Error("Container non trouvé");
        }

        // Créer l'instance Daily
        const daily = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "8px",
          },
        });

        callRef.current = daily;

        // Event listeners
        daily
          .on("joined-meeting", handleJoinedMeeting)
          .on("left-meeting", handleLeftMeeting)
          .on("participant-joined", handleParticipantJoined)
          .on("participant-left", handleParticipantLeft)
          .on("error", handleError);

        // Rejoindre la room
        await daily.join({
          url: roomUrl,
          userName: userName,
        });

        setIsLoading(false);
      } catch (err: any) {
        console.error("Erreur création room:", err);
        setError(err.message || "Erreur lors de la connexion");
        setIsLoading(false);
      }
    };

    createAndJoinRoom();

    // Cleanup
    return () => {
      if (callRef.current) {
        callRef.current.destroy();
      }
      stopLocalRecording();
    };
  }, [roomUrl, userName]);

  // === EVENT HANDLERS ===

  const handleJoinedMeeting = useCallback(() => {
    console.log("✅ Rejoint la réunion");
    setIsJoined(true);
    updateParticipantsCount();
  }, []);

  const handleLeftMeeting = useCallback(() => {
    console.log("👋 Quitté la réunion");
    setIsJoined(false);
    if (onLeave) {
      onLeave();
    }
  }, [onLeave]);

  const handleParticipantJoined = useCallback((event: DailyEventObjectParticipant) => {
    console.log("👤 Participant rejoint:", event.participant.user_name);
    updateParticipantsCount();
  }, []);

  const handleParticipantLeft = useCallback((event: DailyEventObjectParticipantLeft) => {
    console.log("👋 Participant parti:", event.participant.user_name);
    updateParticipantsCount();
  }, []);

  const handleError = useCallback((event: any) => {
    console.error("❌ Erreur Daily:", event);
    setError(event.errorMsg || "Une erreur est survenue");
  }, []);

  // === UTILS ===

  const updateParticipantsCount = () => {
    if (callRef.current) {
      const participants = callRef.current.participants();
      setParticipants(Object.keys(participants).length);
    }
  };

  // === ENREGISTREMENT LOCAL ===

  const startLocalRecording = async () => {
    try {
      if (!callRef.current) {
        throw new Error("Room non disponible");
      }

      // Demander confirmation
      if (!confirm("⚠️ Démarrer l'enregistrement local ?\n\nL'enregistrement sera sauvegardé sur votre ordinateur (pas sur le serveur).")) {
        return;
      }

      // Obtenir le stream de la réunion
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Créer le MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        // Créer un lien de téléchargement
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `consultation-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("✅ Enregistrement sauvegardé");
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("🔴 Enregistrement démarré");

    } catch (err: any) {
      console.error("Erreur enregistrement:", err);
      alert("❌ Impossible de démarrer l'enregistrement");
    }
  };

  const stopLocalRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("⏹️ Enregistrement arrêté");
    }
  };

  // === CONTRÔLES ===

  const toggleCamera = () => {
    if (callRef.current) {
      const isVideoOff = callRef.current.localVideo();
      callRef.current.setLocalVideo(!isVideoOff);
    }
  };

  const toggleMicrophone = () => {
    if (callRef.current) {
      const isAudioOff = callRef.current.localAudio();
      callRef.current.setLocalAudio(!isAudioOff);
    }
  };

  const leaveRoom = () => {
    if (callRef.current) {
      stopLocalRecording();
      callRef.current.leave();
    }
  };

  // === RENDER ===

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#4DB8A8] mx-auto mb-4"></div>
          <p className="text-white text-lg">Connexion à la salle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-white text-2xl font-bold mb-2">
            Erreur de connexion
          </h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-gray-900 flex flex-col">
      {/* Barre de statut */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">En ligne</span>
          </div>
          <div className="text-gray-400 text-sm">
            👥 {participants} participant{participants > 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Bouton enregistrement (si autorisé et owner) */}
          {enregistrementAutorise && isOwner && (
            <button
              onClick={isRecording ? stopLocalRecording : startLocalRecording}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
              title={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement local"}
            >
              {isRecording ? "🔴 Enregistrement..." : "⚫ Enregistrer"}
            </button>
          )}

          {isRecording && (
            <span className="text-red-400 text-sm font-medium animate-pulse">
              Enregistrement local en cours
            </span>
          )}
        </div>
      </div>

      {/* Container de la vidéo */}
      <div ref={containerRef} className="flex-1" />

      {/* Contrôles (si besoin de contrôles personnalisés) */}
      {/* 
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center space-x-4">
        <button
          onClick={toggleMicrophone}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white"
          title="Micro"
        >
          🎤
        </button>
        <button
          onClick={toggleCamera}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white"
          title="Caméra"
        >
          📹
        </button>
        <button
          onClick={leaveRoom}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white"
          title="Quitter"
        >
          📞
        </button>
      </div>
      */}
    </div>
  );
}