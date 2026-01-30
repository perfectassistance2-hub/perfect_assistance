// Fichier: app/medecin/rendez-vous/[id]/consultation/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DailyIframe from '@daily-co/daily-js';

export default function ConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const rdvId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rdv, setRdv] = useState<any>(null);
  const [callFrame, setCallFrame] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRendezVous();

    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, []);

  const loadRendezVous = async () => {
    try {
      // Charger le RDV (vous devrez créer cette API)
      const response = await fetch(`/api/medecin/rendez-vous/${rdvId}`);
      
      if (!response.ok) {
        throw new Error('Rendez-vous introuvable');
      }

      const data = await response.json();
      
      if (data.rendezVous.type !== 'EN_LIGNE') {
        throw new Error('Ce rendez-vous n\'est pas en ligne');
      }

      setRdv(data.rendezVous);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const joinCall = async () => {
    try {
      setLoading(true);

      let roomUrl = rdv.urlReunion;

      // Si pas d'URL, créer une salle
      if (!roomUrl) {
        const createResponse = await fetch(`/api/medecin/rendez-vous/${rdvId}/create-room`, {
          method: 'POST'
        });

        if (!createResponse.ok) {
          throw new Error('Erreur création salle');
        }

        const createData = await createResponse.json();
        roomUrl = createData.roomUrl;
      }

      // Créer le call frame Daily.co
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

      // Rejoindre la salle
      await frame.join({
        url: roomUrl,
        userName: `Dr. ${rdv.medecin?.prenom} ${rdv.medecin?.nom}`
      });

      setCallFrame(frame);
      setIsInCall(true);

      // Événements
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
    } finally {
      setLoading(false);
    }
  };

  const leaveCall = () => {
    if (callFrame) {
      callFrame.leave();
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

          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <span className="text-green-500">✅</span>
              <span>Votre microphone et caméra seront activés</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <span className="text-green-500">✅</span>
              <span>Partage d'écran disponible</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <span className="text-green-500">✅</span>
              <span>Enregistrement automatique activé</span>
            </div>
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
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Connexion...' : '🎥 Rejoindre la consultation'}
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