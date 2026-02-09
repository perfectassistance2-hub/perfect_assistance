// app/medecin/rendez-vous/[id]/visio/page.tsx

"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import DailyIframe from '@daily-co/daily-js';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

export default function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rdvId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rdv, setRdv] = useState<any>(null);
  const [callFrame, setCallFrame] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);

  useEffect(() => {
    loadRendezVous();

    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
      if (zegoInstanceRef.current) {
        zegoInstanceRef.current.destroy();
      }
    };
  }, []);

  const loadRendezVous = async () => {
    try {
      const response = await fetch(`/api/medecin/rendez-vous/${rdvId}`);
      
      if (!response.ok) {
        throw new Error('Rendez-vous introuvable');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Erreur lors du chargement');
      }

      // Vérifier qu'il y a une consultation vidéo
      if (!data.rendezVous.consultationVideo || data.rendezVous.consultationVideo.length === 0) {
        throw new Error('Ce rendez-vous n\'a pas de consultation vidéo associée');
      }

      setRdv(data.rendezVous);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ✅ Vérifier les permissions média
  const checkMediaPermissions = async (): Promise<boolean> => {
    setCheckingPermissions(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream.getTracks().forEach((track) => track.stop());
      setCheckingPermissions(false);
      return true;
    } catch (err: any) {
      setCheckingPermissions(false);
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError(
          "Accès refusé : Veuillez autoriser l'accès à votre caméra et microphone."
        );
      } else if (err.name === "NotFoundError") {
        setError(
          "Aucune caméra ou microphone détecté."
        );
      } else {
        setError(`Erreur d'accès aux médias : ${err.message}`);
      }
      
      console.error("Erreur permissions média:", err);
      return false;
    }
  };

  // ✅ Rejoindre avec Daily.co
  const joinCallDaily = async (consultation: any) => {
    try {
      if (!consultation.lien_medecin) {
        throw new Error('Lien de consultation non disponible');
      }

      const frame = DailyIframe.createFrame(videoContainerRef.current!, {
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '16px'
        }
      });

      await frame.join({
        url: consultation.lien_medecin,
        userName: `Dr. ${rdv.medecin?.prenom || ''} ${rdv.medecin?.nom || ''}`
      });

      setCallFrame(frame);
      setIsInCall(true);

      frame.on('left-meeting', () => {
        setIsInCall(false);
        frame.destroy();
        router.push('/medecin/rendez-vous');
      });

      frame.on('error', (error: any) => {
        console.error('Erreur Daily.co:', error);
        setError('Erreur lors de la visioconférence');
      });

    } catch (err: any) {
      setError(err.message);
    }
  };

  // ✅ Rejoindre avec ZegoCloud
  const joinCallZego = async (consultation: any) => {
    try {
      if (!consultation.zego_room_id) {
        throw new Error('Room ID ZegoCloud non disponible');
      }

      const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0");
      const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
      
      if (!appID || !serverSecret) {
        throw new Error('Configuration ZegoCloud manquante');
      }

      const userID = rdv.medecin?.id || `medecin_${Date.now()}`;
      const userName = `Dr. ${rdv.medecin?.prenom || ''} ${rdv.medecin?.nom || ''}`;

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
        showLayoutButton: true,
        showScreenSharingButton: true, // ✅ Partage d'écran pour le médecin
        showTextChat: true,
        showUserName: true,
        maxUsers: 5,
        
        onJoinRoom: () => {
          console.log('✅ Connecté à ZegoCloud');
          setIsInCall(true);
        },
        
        onLeaveRoom: () => {
          console.log('👋 Déconnecté de ZegoCloud');
          setIsInCall(false);
          zegoInstanceRef.current = null;
          router.push('/medecin/rendez-vous');
        },
      });

    } catch (err: any) {
      console.error('❌ Erreur ZegoCloud:', err);
      if (err.code === 1003002) {
        setError('Erreur de connexion au serveur ZegoCloud');
      } else if (err.code === 1003003) {
        setError('Token invalide. Veuillez vérifier la configuration');
      } else {
        setError(`Erreur lors de la connexion : ${err.message || 'Erreur inconnue'}`);
      }
    }
  };

  // ✅ Fonction principale de connexion
  const joinCall = async () => {
    try {
      setLoading(true);

      // Vérifier les permissions
      const hasPermissions = await checkMediaPermissions();
      if (!hasPermissions) {
        setLoading(false);
        return;
      }

      const consultation = Array.isArray(rdv.consultationVideo) 
        ? rdv.consultationVideo[0] 
        : rdv.consultationVideo;

      if (!consultation) {
        throw new Error('Consultation non disponible');
      }

      // ✅ Router vers la bonne plateforme
      if (consultation.plateforme === 'DAILY') {
        await joinCallDaily(consultation);
      } else if (consultation.plateforme === 'ZEGOCLOUD') {
        await joinCallZego(consultation);
      } else {
        throw new Error('Plateforme de visioconférence non supportée');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const leaveCall = () => {
    if (callFrame) {
      callFrame.leave();
    } else if (zegoInstanceRef.current) {
      zegoInstanceRef.current.destroy();
      zegoInstanceRef.current = null;
      setIsInCall(false);
      router.push('/medecin/rendez-vous');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Chargement de la consultation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/medecin/rendez-vous')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all"
          >
            Retour aux rendez-vous
          </button>
        </div>
      </div>
    );
  }

  const consultation = Array.isArray(rdv.consultationVideo) 
    ? rdv.consultationVideo[0] 
    : rdv.consultationVideo;

  // ✅ Badge plateforme
  const getPlatformBadge = () => {
    if (!consultation) return null;
    
    if (consultation.plateforme === 'DAILY') {
      return (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
          <span className="mr-1">📹</span>
          Powered by Daily.co
        </div>
      );
    } else if (consultation.plateforme === 'ZEGOCLOUD') {
      return (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mb-4">
          <span className="mr-1">🎥</span>
          Powered by ZegoCloud
        </div>
      );
    }
    return null;
  };

  if (!isInCall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎥</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultation en ligne</h1>
            <p className="text-gray-600">Prêt à rejoindre votre patient ?</p>
            {getPlatformBadge()}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">👤</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">
                  {rdv.patient?.prenom} {rdv.patient?.nom}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  📅 {new Date(rdv.datePrevue).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  🕐 {new Date(rdv.datePrevue).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} • Durée: {rdv.duree} minutes
                </p>
                {rdv.raison && (
                  <p className="text-sm text-gray-600 mt-2">
                    📋 {rdv.raison}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Message permissions */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900 font-medium mb-2">
              <span className="font-semibold">⚠️ Permissions requises :</span>
            </p>
            <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
              <li>Accès à votre caméra</li>
              <li>Accès à votre microphone</li>
            </ul>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <span className="text-green-500">✅</span>
              <span>Partage d'écran disponible</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <span className="text-green-500">✅</span>
              <span>Consultation sécurisée et cryptée</span>
            </div>
            {consultation?.enregistrement_autorise && (
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <span className="text-blue-500">🔴</span>
                <span>
                  Enregistrement {consultation.plateforme === 'DAILY' ? 'local disponible' : 'non disponible (ZegoCloud)'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/medecin/rendez-vous')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={joinCall}
              disabled={loading || checkingPermissions}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {checkingPermissions ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Vérification...
                </>
              ) : loading ? (
                'Connexion...'
              ) : (
                '🎥 Rejoindre la consultation'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header minimal */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {rdv.patient?.prenom[0]}{rdv.patient?.nom[0]}
            </span>
          </div>
          <div>
            <h3 className="text-white font-medium">
              {rdv.patient?.prenom} {rdv.patient?.nom}
            </h3>
            <p className="text-gray-400 text-sm">Consultation en cours</p>
          </div>
        </div>

        <button
          onClick={leaveCall}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
        >
          🚪 Quitter
        </button>
      </div>

      {/* Conteneur vidéo */}
      <div ref={videoContainerRef} className="flex-1" />
    </div>
  );
}