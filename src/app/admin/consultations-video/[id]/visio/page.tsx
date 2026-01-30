// app/admin/consultations-video/[id]/visio/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DailyIframe from "@daily-co/daily-js";

type Consultation = {
  id: string;
  titre: string;
  description: string | null;
  date_debut: string;
  date_fin: string;
  duree: number;
  statut: string;
  daily_room_url: string;
  daily_room_name: string;
  lien_patient: string;
  lien_medecin: string;
  enregistrement_autorise: boolean;
  enregistrement_demarre: boolean;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string | null;
  };
  medecin: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
    email: string | null;
  } | null;
  rendez_vous: {
    id: string;
    datePrevue: string;
    raison: string;
    type: string;
  } | null;
  createur: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
  };
};

export default function VisioControlPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // États de la visioconférence
  const [callObject, setCallObject] = useState<any>(null);
  const [callState, setCallState] = useState<string>("idle");
  const [participants, setParticipants] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const callFrameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadConsultation();
    }
    
    return () => {
      if (callObject) {
        callObject.destroy();
      }
    };
  }, [id]);

  const loadConsultation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/consultations-video/${id}`);
      
      if (!response.ok) {
        throw new Error("Consultation non trouvée");
      }

      const data = await response.json();
      setConsultation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (newStatut: string) => {
    try {
      const response = await fetch(`/api/admin/consultations-video/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      await loadConsultation();
      setSuccess(`Statut mis à jour : ${newStatut}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const joinCall = async () => {
    if (!consultation) return;

    try {
      const userStr = localStorage.getItem("admin_user");
      if (!userStr) {
        throw new Error("Session expirée");
      }
      const user = JSON.parse(userStr);

      const userName = `Admin - ${user.prenom} ${user.nom}`;
      const callFrame = DailyIframe.createFrame(callFrameRef.current!, {
        showLeaveButton: true,
        iframeStyle: {
          position: 'relative',
          width: '100%',
          height: '600px',
          border: 'none',
          borderRadius: '8px',
        },
      });

      await callFrame.join({
        url: consultation.daily_room_url,
        userName,
      });

      setCallObject(callFrame);

      // Événements
      callFrame.on("participant-joined", handleParticipantJoined);
      callFrame.on("participant-left", handleParticipantLeft);
      callFrame.on("participant-updated", handleParticipantUpdated);
      callFrame.on("call-state-update", handleCallStateUpdate);
      callFrame.on("recording-started", () => setIsRecording(true));
      callFrame.on("recording-stopped", () => setIsRecording(false));
      callFrame.on("left-meeting", handleLeftMeeting);

      // Mettre à jour le statut
      if (consultation.statut === "PLANIFIE") {
        await updateStatut("EN_COURS");
      }
    } catch (err: any) {
      setError("Erreur lors de la connexion à la visioconférence");
      console.error(err);
    }
  };

  const leaveCall = async () => {
    if (callObject) {
      await callObject.leave();
      callObject.destroy();
      setCallObject(null);
      setCallState("idle");
      setParticipants([]);
    }
  };

  const handleParticipantJoined = (event: any) => {
    setParticipants((prev) => [...prev, event.participant]);
  };

  const handleParticipantLeft = (event: any) => {
    setParticipants((prev) =>
      prev.filter((p) => p.session_id !== event.participant.session_id)
    );
  };

  const handleParticipantUpdated = (event: any) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.session_id === event.participant.session_id ? event.participant : p
      )
    );
  };

  const handleCallStateUpdate = (event: any) => {
    setCallState(event.action);
  };

  const handleLeftMeeting = async () => {
    if (callObject) {
      callObject.destroy();
      setCallObject(null);
      setCallState("idle");
      setParticipants([]);
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
        
        await fetch(`/api/admin/consultations-video/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enregistrementDemarre: true }),
        });
        
        setSuccess("Enregistrement démarré - sauvegarde locale");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Erreur lors du démarrage de l'enregistrement");
      }
    }
  };

  const stopRecording = async () => {
    if (callObject && isRecording) {
      try {
        await callObject.stopRecording();
        setIsRecording(false);
        setSuccess("Enregistrement arrêté");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Erreur lors de l'arrêt de l'enregistrement");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error && !consultation) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link
          href="/admin/consultations-video"
          className="mt-4 inline-block text-[#4DB8A8] hover:text-[#3DA391]"
        >
          ← Retour aux consultations
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/admin/consultations-video/${id}`}
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour aux détails
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎮 Console de contrôle
            </h1>
            <p className="text-gray-600">
              {consultation!.titre}
            </p>
          </div>
          {callObject && (
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-gray-600">En direct</span>
              </span>
              {isRecording && (
                <span className="flex items-center space-x-2 bg-red-100 px-3 py-1 rounded-full">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-sm text-red-700 font-medium">Enregistrement</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Colonne principale - Visio */}
        <div className="lg:col-span-3 space-y-6">
          {/* Visioconférence */}
          <div className="bg-white rounded-lg shadow">
            {!callObject ? (
              <div className="p-12">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-12 text-center">
                  <div className="text-8xl mb-6">🎥</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Prêt à démarrer
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Rejoignez la consultation avec tous les privilèges administrateur
                  </p>
                  <button
                    onClick={joinCall}
                    className="px-8 py-4 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors text-lg font-medium"
                  >
                    🎮 Rejoindre avec contrôles admin
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Conteneur vidéo */}
                <div ref={callFrameRef} className="bg-black rounded-t-lg overflow-hidden" />

                {/* Barre de contrôles */}
                <div className="bg-gray-900 p-4 rounded-b-lg">
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={toggleMute}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isMuted 
                          ? "bg-red-500 text-white hover:bg-red-600" 
                          : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                      title={isMuted ? "Réactiver le micro" : "Couper le micro"}
                    >
                      {isMuted ? "🔇" : "🔊"}
                    </button>

                    <button
                      onClick={toggleCamera}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isCameraOff 
                          ? "bg-red-500 text-white hover:bg-red-600" 
                          : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                      title={isCameraOff ? "Activer la caméra" : "Désactiver la caméra"}
                    >
                      {isCameraOff ? "📷" : "📹"}
                    </button>

                    <button
                      onClick={toggleScreenShare}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isScreenSharing 
                          ? "bg-blue-500 text-white hover:bg-blue-600" 
                          : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                      title={isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}
                    >
                      {isScreenSharing ? "⏹️ 🖥️" : "🖥️"}
                    </button>

                    {consultation!.enregistrement_autorise && (
                      <>
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Démarrer l'enregistrement local"
                          >
                            🔴 REC
                          </button>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors animate-pulse"
                            title="Arrêter l'enregistrement"
                          >
                            ⏹️ STOP
                          </button>
                        )}
                      </>
                    )}

                    <div className="flex-1"></div>

                    <button
                      onClick={leaveCall}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      📞 Quitter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Participants en temps réel */}
          {callObject && participants.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                👥 Participants ({participants.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {participants.map((p) => (
                  <div
                    key={p.session_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#4DB8A8] rounded-full flex items-center justify-center text-white font-bold">
                        {(p.user_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {p.user_name || "Invité"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.local ? "Vous" : "Participant"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {p.audio ? (
                        <span className="text-green-600" title="Micro actif">🔊</span>
                      ) : (
                        <span className="text-gray-400" title="Micro coupé">🔇</span>
                      )}
                      {p.video ? (
                        <span className="text-green-600" title="Caméra active">📹</span>
                      ) : (
                        <span className="text-gray-400" title="Caméra désactivée">📷</span>
                      )}
                      {p.screen && (
                        <span className="text-blue-600" title="Partage d'écran">🖥️</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale - Informations */}
        <div className="space-y-6">
          {/* Informations patient */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Patient</h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">
                {consultation!.patient.prenom} {consultation!.patient.nom}
              </p>
              <p className="text-gray-600">{consultation!.patient.email}</p>
              {consultation!.patient.telephone && (
                <p className="text-gray-600">{consultation!.patient.telephone}</p>
              )}
            </div>
          </div>

          {/* Informations médecin */}
          {consultation!.medecin && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Médecin</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">
                  Dr. {consultation!.medecin.prenom} {consultation!.medecin.nom}
                </p>
                <p className="text-gray-600">{consultation!.medecin.specialite}</p>
              </div>
            </div>
          )}

          {/* Détails consultation */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Détails</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Date:</span>
                <p className="font-medium">
                  {new Date(consultation!.date_debut).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Heure:</span>
                <p className="font-medium">
                  {new Date(consultation!.date_debut).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Durée:</span>
                <p className="font-medium">{consultation!.duree} min</p>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          {callObject && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => updateStatut("TERMINE")}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  ⏹️ Terminer la consultation
                </button>
              </div>
            </div>
          )}

          {/* Aide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">💡 Aide</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Micro: Couper/réactiver le son</li>
              <li>• Caméra: Activer/désactiver vidéo</li>
              <li>• Partage: Partager votre écran</li>
              {consultation!.enregistrement_autorise && (
                <li>• REC: Enregistrement local</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}