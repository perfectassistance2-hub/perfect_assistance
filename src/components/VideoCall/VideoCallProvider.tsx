// components/VideoCall/VideoCallProvider.tsx

"use client";

import { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

interface VideoCallProviderProps {
  consultation: any;
  isPiPMode: boolean;
  onTogglePiP: () => void;
  onLeave: () => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  onUpdateStatut: (statut: string) => void;
  onParticipantsChange: (participants: any[]) => void;
}

export default function VideoCallProvider({
  consultation,
  isPiPMode,
  onTogglePiP,
  onLeave,
  onError,
  onSuccess,
  onUpdateStatut,
  onParticipantsChange
}: VideoCallProviderProps) {
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<any>(null);
  const zegoInstanceRef = useRef<any>(null);

  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [showNavMenu, setShowNavMenu] = useState(false);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowControls(false), 3000);
    };

    if (isJoined) {
      resetTimer();
      const handleActivity = () => resetTimer();
      
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('click', handleActivity);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('click', handleActivity);
      };
    }
  }, [isJoined]);

  const cleanup = () => {
    // ✅ Nettoyer le conteneur vidéo
    if (videoContainerRef.current) {
      videoContainerRef.current.innerHTML = '';
    }

    if (callObjectRef.current) {
      try {
        callObjectRef.current.destroy();
      } catch (err) {
        console.error('Erreur cleanup Daily:', err);
      }
      callObjectRef.current = null;
    }
    
    if (zegoInstanceRef.current) {
      try {
        if (zegoInstanceRef.current && typeof zegoInstanceRef.current.destroy === 'function') {
          zegoInstanceRef.current.destroy();
        }
      } catch (err) {
        console.warn('Cleanup ZegoCloud (erreur ignorée):', err);
      }
      zegoInstanceRef.current = null;
    }
  };

  const checkMediaPermissions = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err: any) {
      console.error('Erreur permissions média:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        onError('🚫 Accès refusé à la caméra/microphone. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.');
      } else if (err.name === 'NotFoundError') {
        onError('📷 Aucune caméra ou microphone détecté sur cet appareil.');
      } else {
        onError(`Erreur d'accès aux médias : ${err.message}`);
      }
      
      return false;
    }
  };

  const joinCallDaily = async () => {
    if (!consultation.daily_room_url) {
      onError('URL Daily.co non disponible');
      return;
    }

    try {
      const userStr = localStorage.getItem("admin_user");
      if (!userStr) {
        throw new Error("Session expirée");
      }
      const user = JSON.parse(userStr);

      const callFrame = DailyIframe.createFrame(videoContainerRef.current!, {
        showLeaveButton: false,
        showFullscreenButton: false,
        iframeStyle: {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          border: 'none'
        }
      });

      await callFrame.join({
        url: consultation.daily_room_url,
        userName: `Admin - ${user.prenom} ${user.nom}`,
      });

      callObjectRef.current = callFrame;
      setIsJoined(true);

      callFrame.on('participant-joined', (event: any) => {
        updateParticipants(callFrame);
      });

      callFrame.on('participant-left', (event: any) => {
        updateParticipants(callFrame);
      });

      callFrame.on('participant-updated', (event: any) => {
        updateParticipants(callFrame);
      });

      callFrame.on('recording-started', () => {
        setIsRecording(true);
        onSuccess('Enregistrement démarré');
      });

      callFrame.on('recording-stopped', () => {
        setIsRecording(false);
        onSuccess('Enregistrement arrêté');
      });

      callFrame.on('left-meeting', () => {
        // ✅ Réinitialiser tous les états
        resetAllStates();
        cleanup();
        onLeave();
      });

      callFrame.on('error', (error: any) => {
        console.error('Erreur Daily:', error);
        onError('Erreur de connexion');
      });

      updateParticipants(callFrame);

      if (consultation.statut === 'PLANIFIE') {
        await onUpdateStatut('EN_COURS');
      }

    } catch (err: any) {
      console.error('Erreur joinCallDaily:', err);
      onError(err.message);
    }
  };

  const updateParticipants = (callFrame: any) => {
    const participantsData = callFrame.participants();
    const participantsList = Object.values(participantsData);
    setParticipants(participantsList);
    onParticipantsChange(participantsList);
  };

  const joinCallZego = async () => {
    if (!consultation.zego_room_id) {
      onError('Room ID ZegoCloud non disponible');
      return;
    }

    try {
      const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0");
      const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
      
      if (!appID || !serverSecret) {
        throw new Error('Configuration ZegoCloud manquante');
      }

      const userStr = localStorage.getItem("admin_user");
      if (!userStr) {
        throw new Error("Session expirée");
      }
      const user = JSON.parse(userStr);

      const userID = `admin_${Date.now()}`;
      const userName = `Admin - ${user.prenom} ${user.nom}`;

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        consultation.zego_room_id,
        userID,
        userName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      await zp.joinRoom({
        container: videoContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        showPreJoinView: false,
        turnOnCameraWhenJoining: true,
        turnOnMicrophoneWhenJoining: true,
        showLayoutButton: false,
        
        onJoinRoom: () => {
          console.log('✅ Connecté à ZegoCloud');
          setIsJoined(true);
          if (consultation.statut === 'PLANIFIE') {
            onUpdateStatut('EN_COURS');
          }
        },
        
        onLeaveRoom: () => {
          console.log('👋 Déconnecté de ZegoCloud');
          // ✅ Réinitialiser tous les états
          resetAllStates();
          zegoInstanceRef.current = null;
          onLeave();
        },

        onUserJoin: (users: any[]) => {
          setParticipants(users);
          onParticipantsChange(users);
        },

        onUserLeave: (users: any[]) => {
          setParticipants(users);
          onParticipantsChange(users);
        }
      });

    } catch (err: any) {
      console.error('❌ Erreur ZegoCloud:', err);
      
      if (err.code === 1003002) {
        onError('Erreur de connexion au serveur ZegoCloud');
      } else if (err.code === 1003003) {
        onError('Token ZegoCloud invalide');
      } else {
        onError(`Erreur ZegoCloud : ${err.message || 'Erreur inconnue'}`);
      }
    }
  };

  // ✅ NOUVELLE FONCTION - Réinitialiser tous les états
  const resetAllStates = () => {
    setIsJoined(false);
    setIsJoining(false);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setIsRecording(false);
    setParticipants([]);
    setShowControls(true);
    setShowNavMenu(false);
    onParticipantsChange([]);
  };

  const handleJoin = async () => {
    if (isJoining || isJoined) return;

    setIsJoining(true);

    try {
      const hasPermissions = await checkMediaPermissions();
      if (!hasPermissions) {
        setIsJoining(false);
        return;
      }

      cleanup();

      if (consultation.plateforme === 'DAILY') {
        await joinCallDaily();
      } else if (consultation.plateforme === 'ZEGOCLOUD') {
        await joinCallZego();
      } else {
        throw new Error('Plateforme non supportée');
      }
    } catch (err: any) {
      onError(err.message);
      // ✅ En cas d'erreur, revenir à l'écran d'accueil
      resetAllStates();
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      if (consultation.plateforme === 'DAILY' && callObjectRef.current) {
        await callObjectRef.current.leave();
        // Daily déclenchera automatiquement 'left-meeting'
      } else if (consultation.plateforme === 'ZEGOCLOUD' && zegoInstanceRef.current) {
        if (typeof zegoInstanceRef.current.destroy === 'function') {
          zegoInstanceRef.current.destroy();
        }
        // ZegoCloud déclenchera automatiquement 'onLeaveRoom'
      } else {
        // ✅ Si pas d'objet d'appel, réinitialiser manuellement
        resetAllStates();
        cleanup();
        onLeave();
      }
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      // ✅ Même en cas d'erreur, réinitialiser
      resetAllStates();
      cleanup();
      onLeave();
    }
  };

  const toggleMute = async () => {
    if (consultation.plateforme === 'DAILY' && callObjectRef.current) {
      await callObjectRef.current.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = async () => {
    if (consultation.plateforme === 'DAILY' && callObjectRef.current) {
      await callObjectRef.current.setLocalVideo(!isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleScreenShare = async () => {
    if (consultation.plateforme === 'DAILY' && callObjectRef.current) {
      if (isScreenSharing) {
        await callObjectRef.current.stopScreenShare();
      } else {
        await callObjectRef.current.startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    }
  };

  const startRecording = async () => {
    if (consultation.plateforme === 'DAILY' && callObjectRef.current && consultation.enregistrement_autorise) {
      try {
        await callObjectRef.current.startRecording();
      } catch (err) {
        onError('Erreur lors du démarrage de l\'enregistrement');
      }
    }
  };

  const stopRecording = async () => {
    if (consultation.plateforme === 'DAILY' && callObjectRef.current && isRecording) {
      try {
        await callObjectRef.current.stopRecording();
      } catch (err) {
        onError('Erreur lors de l\'arrêt de l\'enregistrement');
      }
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowNavMenu(false);
  };

  if (!isJoined) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center max-w-md px-4">
          <div className="text-8xl mb-6">🎥</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Prêt à démarrer
          </h2>
          <p className="text-gray-300 mb-2">
            Rejoignez la consultation
          </p>
          <p className="text-sm text-gray-400 mb-8">
            {consultation.plateforme === 'DAILY' ? '📹 Daily.co' : '🎥 ZegoCloud'}
          </p>
          
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-left">
            <p className="text-yellow-300 text-sm font-medium mb-2">
              ⚠️ Permissions requises
            </p>
            <ul className="text-yellow-200/80 text-xs space-y-1">
              <li>• Accès à votre caméra</li>
              <li>• Accès à votre microphone</li>
            </ul>
          </div>

          <button
            onClick={handleJoin}
            disabled={isJoining}
            className={`px-8 py-4 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-all text-lg font-medium ${
              isJoining ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            {isJoining ? '⏳ Vérification des permissions...' : '🎮 Rejoindre'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div 
        ref={videoContainerRef} 
        className="w-full h-full"
      />

      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-white text-sm font-medium">En direct</span>
            </div>
            <span className="text-white/80 text-sm">
              {participants.length} participant{participants.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowNavMenu(!showNavMenu)}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all"
                title="Navigation"
              >
                <span className="text-white text-xl">☰</span>
              </button>

              {showNavMenu && (
                <div className="absolute right-0 top-full mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden min-w-[200px]">
                  <button
                    onClick={() => openInNewTab('/admin')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <span>🏠</span>
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => openInNewTab('/admin/patients')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <span>👥</span>
                    <span>Patients</span>
                  </button>
                  <button
                    onClick={() => openInNewTab(`/admin/patients/${consultation.patient.id}`)}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <span>📋</span>
                    <span>Dossier patient</span>
                  </button>
                  <button
                    onClick={() => openInNewTab('/admin/rendez-vous')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <span>📅</span>
                    <span>Rendez-vous</span>
                  </button>
                  <button
                    onClick={() => openInNewTab('/admin/consultations-video')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <span>🎥</span>
                    <span>Consultations vidéo</span>
                  </button>
                  <div className="border-t border-gray-700"></div>
                  <button
                    onClick={() => setShowNavMenu(false)}
                    className="w-full px-4 py-3 text-left text-gray-400 hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <span>✕</span>
                    <span>Fermer</span>
                  </button>
                </div>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center space-x-2 bg-red-500/20 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-red-500 text-sm font-medium">REC</span>
              </div>
            )}
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
              {consultation.plateforme === 'DAILY' ? '📹 Daily' : '🎥 Zego'}
            </span>
          </div>
        </div>
      </div>

      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 z-10 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`group relative p-4 rounded-full transition-all ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title={isMuted ? 'Réactiver le micro' : 'Couper le micro'}
          >
            <span className="text-white text-2xl">{isMuted ? '🔇' : '🎤'}</span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {isMuted ? 'Réactiver' : 'Couper'}
            </span>
          </button>

          <button
            onClick={toggleCamera}
            className={`group relative p-4 rounded-full transition-all ${
              isCameraOff 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
            title={isCameraOff ? 'Activer la caméra' : 'Désactiver la caméra'}
          >
            <span className="text-white text-2xl">{isCameraOff ? '📷' : '📹'}</span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {isCameraOff ? 'Activer' : 'Désactiver'}
            </span>
          </button>

          {consultation.plateforme === 'DAILY' && (
            <button
              onClick={toggleScreenShare}
              className={`group relative p-4 rounded-full transition-all ${
                isScreenSharing 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
              }`}
              title="Partager l'écran"
            >
              <span className="text-white text-2xl">🖥️</span>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {isScreenSharing ? 'Arrêter partage' : 'Partager écran'}
              </span>
            </button>
          )}

          {consultation.enregistrement_autorise && consultation.plateforme === 'DAILY' && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`group relative px-6 py-4 rounded-full transition-all font-bold ${
                isRecording 
                  ? 'bg-red-700 hover:bg-red-800 animate-pulse' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <span className="text-white">
                {isRecording ? '⏹️ STOP' : '🔴 REC'}
              </span>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {isRecording ? 'Arrêter' : 'Enregistrer'}
              </span>
            </button>
          )}

          <div className="w-px h-12 bg-white/20"></div>

          <button
            onClick={onTogglePiP}
            className="group relative p-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all"
            title="Mode PiP"
          >
            <span className="text-white text-2xl">{isPiPMode ? '📺' : '🖼️'}</span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Mode {isPiPMode ? 'Normal' : 'PiP'}
            </span>
          </button>

          <button
            onClick={handleLeave}
            className="group relative px-8 py-4 bg-red-600 hover:bg-red-700 rounded-full transition-all font-bold"
          >
            <span className="text-white text-lg">📞 Quitter</span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Quitter la consultation
            </span>
          </button>
        </div>
      </div>

      {!showControls && (
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm cursor-pointer hover:bg-white/20 transition-all z-10"
          onClick={() => setShowControls(true)}
        >
          👆 Déplacer la souris pour afficher les contrôles
        </div>
      )}
    </div>
  );
}