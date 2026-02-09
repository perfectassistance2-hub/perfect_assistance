// components/VideoCall/DailyVideoCall.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import DailyIframe from "@daily-co/daily-js";

type DailyVideoCallProps = {
  consultation: any;
  isPiPMode: boolean;
  onTogglePiP: () => void;
  onLeave: () => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  onUpdateStatut: (statut: string) => void;
  onParticipantsChange: (participants: any[]) => void;
};

export default function DailyVideoCall({
  consultation,
  isPiPMode,
  onTogglePiP,
  onLeave,
  onError,
  onSuccess,
  onUpdateStatut,
  onParticipantsChange,
}: DailyVideoCallProps) {
  const [callObject, setCallObject] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const callFrameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.destroy();
      }
    };
  }, []);

  useEffect(() => {
    onParticipantsChange(participants);
  }, [participants]);

  const joinCall = async () => {
    try {
      const userStr = localStorage.getItem("admin_user");
      if (!userStr) {
        throw new Error("Session expirée");
      }
      const user = JSON.parse(userStr);

      const userName = `Admin - ${user.prenom} ${user.nom}`;

      const callFrame = DailyIframe.createFrame(callFrameRef.current!, {
        showLeaveButton: false,
        showFullscreenButton: true,
        iframeStyle: {
          position: "absolute",
          top: "0px",
          left: "0px",
          width: "100%",
          height: "100%",
          border: "none",
        },
      });

      await callFrame.join({
        url: consultation.daily_room_url,
        userName,
      });

      setCallObject(callFrame);
      setIsJoined(true);

      // Événements
      callFrame.on("participant-joined", (event: any) => {
        setParticipants((prev) => [...prev, event.participant]);
      });

      callFrame.on("participant-left", (event: any) => {
        setParticipants((prev) =>
          prev.filter((p) => p.session_id !== event.participant.session_id)
        );
      });

      callFrame.on("participant-updated", (event: any) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.session_id === event.participant.session_id ? event.participant : p
          )
        );
      });

      callFrame.on("recording-started", () => setIsRecording(true));
      callFrame.on("recording-stopped", () => setIsRecording(false));
      
      callFrame.on("left-meeting", async () => {
        if (callFrame) {
          callFrame.destroy();
          setCallObject(null);
          setParticipants([]);
          setIsJoined(false);
        }
      });

      // Mettre à jour le statut
      if (consultation.statut === "PLANIFIE") {
        await onUpdateStatut("EN_COURS");
      }

      onSuccess("Connecté à la visioconférence");
    } catch (err: any) {
      onError("Erreur lors de la connexion à la visioconférence");
      console.error(err);
    }
  };

  const leaveCall = async () => {
    if (callObject) {
      await callObject.leave();
      callObject.destroy();
      setCallObject(null);
      setParticipants([]);
      setIsJoined(false);
      onLeave();
    }
  };

  const toggleMute = async () => {
    if (callObject) {
      await callObject.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = async () => {
    if (callObject) {
      await callObject.setLocalVideo(!isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleScreenShare = async () => {
    if (callObject) {
      if (isScreenSharing) {
        await callObject.stopScreenShare();
      } else {
        await callObject.startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    }
  };

  const startRecording = async () => {
    if (callObject && consultation?.enregistrement_autorise) {
      try {
        await callObject.startRecording();
        setIsRecording(true);
        onSuccess("Enregistrement démarré");
      } catch (err) {
        onError("Erreur lors du démarrage de l'enregistrement");
      }
    }
  };

  const stopRecording = async () => {
    if (callObject && isRecording) {
      try {
        await callObject.stopRecording();
        setIsRecording(false);
        onSuccess("Enregistrement arrêté");
      } catch (err) {
        onError("Erreur lors de l'arrêt de l'enregistrement");
      }
    }
  };

  if (!isJoined) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="text-8xl mb-6">🎥</div>
          <h2 className="text-2xl font-bold text-white mb-2">Prêt à démarrer</h2>
          <p className="text-gray-400 mb-6">Rejoignez la consultation vidéo (Daily)</p>
          <button
            onClick={joinCall}
            className="px-8 py-4 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors text-lg font-medium"
          >
            🎮 Rejoindre la consultation
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Vidéo Daily */}
      <div ref={callFrameRef} className="w-full h-full relative bg-black" />

      {/* Barre de contrôles */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
            }`}
            title={isMuted ? "Réactiver le micro" : "Couper le micro"}
          >
            <span className="text-white text-xl">{isMuted ? "🔇" : "🔊"}</span>
          </button>

          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full transition-colors ${
              isCameraOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
            }`}
            title={isCameraOff ? "Activer la caméra" : "Désactiver la caméra"}
          >
            <span className="text-white text-xl">{isCameraOff ? "📷" : "📹"}</span>
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-white/20 hover:bg-white/30"
            }`}
            title={isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}
          >
            <span className="text-white text-xl">🖥️</span>
          </button>

          {consultation.enregistrement_autorise && (
            <>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                  title="Démarrer l'enregistrement"
                >
                  <span className="text-white text-xl">🔴</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="p-3 rounded-full bg-red-700 hover:bg-red-800 transition-colors animate-pulse"
                  title="Arrêter l'enregistrement"
                >
                  <span className="text-white text-xl">⏹️</span>
                </button>
              )}
            </>
          )}

          <div className="flex-1"></div>

          <button
            onClick={onTogglePiP}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title={isPiPMode ? "Mode plein écran" : "Mode mini"}
          >
            <span className="text-white text-xl">{isPiPMode ? "⛶" : "◱"}</span>
          </button>

          <button
            onClick={leaveCall}
            className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <span className="text-white font-medium">📞 Quitter</span>
          </button>
        </div>
      </div>
    </>
  );
}