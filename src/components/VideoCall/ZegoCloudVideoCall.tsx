// components/VideoCall/ZegoCloudVideoCall.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

type ZegoCloudVideoCallProps = {
  consultation: any;
  isPiPMode: boolean;
  onTogglePiP: () => void;
  onLeave: () => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  onUpdateStatut: (statut: string) => void;
  onParticipantsChange: (participants: any[]) => void;
};

export default function ZegoCloudVideoCall({
  consultation,
  isPiPMode,
  onTogglePiP,
  onLeave,
  onError,
  onSuccess,
  onUpdateStatut,
  onParticipantsChange,
}: ZegoCloudVideoCallProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const zegoContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (zegoInstanceRef.current) {
        zegoInstanceRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    onParticipantsChange(participants);
  }, [participants]);

  const generateToken = (userID: string) => {
    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0");
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
    const roomID = consultation.zego_room_id || consultation.id;

    // Générer le token avec ZegoUIKitPrebuilt
    return ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      userID,
      userID
    );
  };

  const joinCall = async () => {
    try {
      const userStr = localStorage.getItem("admin_user");
      if (!userStr) {
        throw new Error("Session expirée");
      }
      const user = JSON.parse(userStr);

      const userID = user.id;
      const userName = `Admin - ${user.prenom} ${user.nom}`;
      const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0");
      const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
      const roomID = consultation.zego_room_id || consultation.id;

      // Générer le token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        userID,
        userName
      );

      // Créer l'instance ZegoUIKit
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      // Configuration
      zp.joinRoom({
        container: zegoContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        showPreJoinView: false,
        showRoomTimer: true,
        showUserList: true,
        maxUsers: 10,
        layout: "Auto",
        showLayoutButton: true,
        showScreenSharingButton: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showTextChat: true,
        showUserName: true,
        lowerLeftNotification: {
          showUserJoinAndLeave: true,
          showTextChat: true,
        },
        branding: {
          logoURL: "/images/logo_perfect.jpeg",
        },
        onJoinRoom: () => {
          setIsJoined(true);
          if (consultation.statut === "PLANIFIE") {
            onUpdateStatut("EN_COURS");
          }
          onSuccess("Connecté à la visioconférence ZegoCloud");
        },
        onLeaveRoom: () => {
          setIsJoined(false);
          setParticipants([]);
          onLeave();
        },
        onUserJoin: (users: any[]) => {
          setParticipants((prev) => [...prev, ...users]);
        },
        onUserLeave: (users: any[]) => {
          setParticipants((prev) =>
            prev.filter((p) => !users.some((u) => u.userID === p.userID))
          );
        },
      });
    } catch (err: any) {
      onError("Erreur lors de la connexion à ZegoCloud");
      console.error(err);
    }
  };

  const leaveCall = () => {
    if (zegoInstanceRef.current) {
      zegoInstanceRef.current.destroy();
      zegoInstanceRef.current = null;
      setIsJoined(false);
      setParticipants([]);
      onLeave();
    }
  };

  const toggleMute = () => {
    if (zegoInstanceRef.current) {
      zegoInstanceRef.current.setMicrophoneMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (zegoInstanceRef.current) {
      zegoInstanceRef.current.setCameraMuted(!isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  };

  if (!isJoined) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900 to-purple-800">
        <div className="text-center">
          <div className="text-8xl mb-6">🎥</div>
          <h2 className="text-2xl font-bold text-white mb-2">Prêt à démarrer</h2>
          <p className="text-purple-200 mb-6">Rejoignez la consultation vidéo (ZegoCloud)</p>
          <button
            onClick={joinCall}
            className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
          >
            🎮 Rejoindre la consultation
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Conteneur ZegoCloud */}
      <div ref={zegoContainerRef} className="w-full h-full bg-black" />

      {/* Contrôles additionnels si nécessaire */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-center space-x-3">
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