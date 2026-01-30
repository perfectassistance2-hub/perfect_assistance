"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DailyIframe from '@daily-co/daily-js';

export default function ConsultationPatientPage() {
  const router = useRouter();
  const params = useParams();
  const [rdvId, setRdvId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rdv, setRdv] = useState<any>(null);
  const [callFrame, setCallFrame] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setRdvId(resolved.id as string);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (rdvId) {
      loadRendezVous();
    }

    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [rdvId]);

  const loadRendezVous = async () => {
    try {
      const response = await fetch(`/api/patient/rendez-vous/${rdvId}`);
      
      if (!response.ok) {
        throw new Error('Rendez-vous introuvable');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Erreur lors du chargement');
      }

      // Vérifier que c'est une consultation vidéo
      if (!data.rdv.consultationVideo || data.rdv.consultationVideo.length === 0) {
        throw new Error('Ce rendez-vous n\'a pas de consultation vidéo');
      }

      setRdv(data.rdv);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const joinCall = async () => {
    try {
      setLoading(true);

      const consultation = Array.isArray(rdv.consultationVideo) 
        ? rdv.consultationVideo[0] 
        : rdv.consultationVideo;

      if (!consultation || !consultation.lien_patient) {
        throw new Error('Lien de consultation non disponible');
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
        url: consultation.lien_patient,
        userName: `${rdv.patient?.prenom || 'Patient'} ${rdv.patient?.nom || ''}`
      });

      setCallFrame(frame);
      setIsInCall(true);

      // Événements
      frame.on('left-meeting', () => {
        setIsInCall(false);
        frame.destroy();
        router.push('/patient/rendez-vous');
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
          <div className="animate-spin h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
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
            onClick={() => router.push('/patient/rendez-vous')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all"
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

  if (!isInCall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-900 to-teal-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎥</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultation en ligne</h1>
            <p className="text-gray-600">Prêt à rejoindre votre médecin ?</p>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">👨‍⚕️</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">
                  Dr. {rdv.medecin?.prenom} {rdv.medecin?.nom}
                </h3>
                <p className="text-sm text-teal-700 font-medium mb-2">
                  {rdv.medecin?.specialite}
                </p>
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
              <span>Consultation sécurisée et confidentielle</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <span className="text-green-500">✅</span>
              <span>Enregistrement avec votre consentement uniquement</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/patient/rendez-vous/${rdvId}`)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
            >
              Retour
            </button>
            <button
              onClick={joinCall}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
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
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {rdv.medecin?.prenom[0]}{rdv.medecin?.nom[0]}
            </span>
          </div>
          <div>
            <h3 className="text-white font-medium">
              Dr. {rdv.medecin?.prenom} {rdv.medecin?.nom}
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