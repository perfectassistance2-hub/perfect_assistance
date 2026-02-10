// app/admin/consultations-video/[id]/visio/page.tsx

"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VideoCallProvider from "@/components/VideoCall/VideoCallProvider";

type Consultation = {
  id: string;
  titre: string;
  description: string | null;
  date_debut: string;
  date_fin: string;
  duree: number;
  statut: string;
  daily_room_url?: string;
  daily_room_name?: string;
  zego_room_id?: string;
  lien_patient: string;
  lien_medecin: string;
  enregistrement_autorise: boolean;
  enregistrement_demarre: boolean;
  plateforme: "DAILY" | "ZEGOCLOUD";
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

export default function VisioControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPiPMode, setIsPiPMode] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    if (id) {
      loadConsultation();
    }
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

  const handleLeave = () => {
    setIsInCall(false);
    setParticipants([]);
    setIsPiPMode(false);
  };

  const handleParticipantsChange = (newParticipants: any[]) => {
    setParticipants(newParticipants);
    if (newParticipants.length > 0 && !isInCall) {
      setIsInCall(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  if (error && !consultation) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
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

  if (!consultation) return null;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/admin/consultations-video/${id}`}
              className="text-[#4DB8A8] hover:text-[#3DA391]"
            >
              ← Retour
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{consultation.titre}</h1>
              <p className="text-sm text-gray-600">
                {consultation.patient.prenom} {consultation.patient.nom}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isInCall && (
              <>
                <span className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm text-gray-600">En direct</span>
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                  {consultation.plateforme === "DAILY" ? "📹 Daily" : "🎥 ZegoCloud"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex-shrink-0">
          {error}
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex-shrink-0">
          {success}
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zone visioconférence */}
        <div
          className={`${
            isPiPMode ? "w-1/4" : "flex-1"
          } bg-black relative transition-all duration-300`}
        >
          <VideoCallProvider
            consultation={consultation}
            isPiPMode={isPiPMode}
            onTogglePiP={() => setIsPiPMode(!isPiPMode)}
            onLeave={handleLeave}
            onError={setError}
            onSuccess={setSuccess}
            onUpdateStatut={updateStatut}
            onParticipantsChange={handleParticipantsChange}
          />
        </div>

        {/* Panel latéral pour dossier patient */}
        {isInCall && (
          <div
            className={`${
              isPiPMode ? "flex-1" : "w-80"
            } bg-white border-l border-gray-200 overflow-y-auto transition-all duration-300`}
          >
            <div className="p-4 space-y-4">
              {/* Onglets navigation */}
              <div className="flex border-b border-gray-200">
                <button className="px-4 py-2 text-sm font-medium text-[#4DB8A8] border-b-2 border-[#4DB8A8]">
                  👥 Participants
                </button>
                <button
                  onClick={() =>
                    window.open(`/admin/patients/${consultation.patient.id}`, "_blank")
                  }
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  📋 Dossier
                </button>
              </div>

              {/* Participants */}
              {participants.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Participants ({participants.length})
                  </h3>
                  <div className="space-y-2">
                    {participants.map((p, index) => (
                      <div
                        key={p.session_id || p.userID || index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-[#4DB8A8] rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {(p.user_name || p.userName || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {p.user_name || p.userName || "Invité"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {p.local ? "Vous" : "Participant"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info patient */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Patient</h4>
                <p className="text-sm font-medium">
                  {consultation.patient.prenom} {consultation.patient.nom}
                </p>
                <p className="text-xs text-gray-600">{consultation.patient.email}</p>
                <button
                  onClick={() =>
                    window.open(`/admin/patients/${consultation.patient.id}`, "_blank")
                  }
                  className="mt-2 text-xs text-[#4DB8A8] hover:text-[#3DA391] font-medium"
                >
                  → Voir le dossier complet
                </button>
              </div>

              {/* Info médecin */}
              {consultation.medecin && (
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Médecin</h4>
                  <p className="text-sm font-medium">
                    Dr. {consultation.medecin.prenom} {consultation.medecin.nom}
                  </p>
                  <p className="text-xs text-gray-600">{consultation.medecin.specialite}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => updateStatut("TERMINE")}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                >
                  ⏹️ Terminer la consultation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}