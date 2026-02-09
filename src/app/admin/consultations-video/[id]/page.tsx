// app/admin/consultations-video/[id]/page.tsx

"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Consultation = {
  id: string;
  titre: string;
  description: string | null;
  date_debut: string;
  date_fin: string;
  duree: number;
  statut: string;
  plateforme: "DAILY" | "ZEGOCLOUD"; // ✅ NOUVEAU
  daily_room_url?: string;
  daily_room_name?: string;
  zego_room_id?: string; // ✅ NOUVEAU
  zego_app_id?: string; // ✅ NOUVEAU
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

export default function DetailConsultationVideoPage({
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

  const handleDelete = async () => {
    if (!consultation) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette consultation vidéo ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/consultations-video/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      alert("Consultation supprimée avec succès");
      router.push("/admin/consultations-video");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copié !`);
    setTimeout(() => setSuccess(""), 2000);
  };

  const getStatutBadge = (statut: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PLANIFIE: { bg: "bg-blue-100", text: "text-blue-800", label: "Planifiée" },
      EN_COURS: { bg: "bg-green-100", text: "text-green-800", label: "En cours" },
      TERMINE: { bg: "bg-gray-100", text: "text-gray-800", label: "Terminée" },
      ANNULE: { bg: "bg-red-100", text: "text-red-800", label: "Annulée" },
    };
    const badge = badges[statut] || badges.PLANIFIE;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // ✅ NOUVEAU - Badge plateforme
  const getPlateformeBadge = (plateforme: string) => {
    if (plateforme === "DAILY") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
          📹 Daily.co
        </span>
      );
    } else if (plateforme === "ZEGOCLOUD") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
          🎥 ZegoCloud
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  if (error && !consultation) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl mb-4">❌ {error}</div>
        <Link href="/admin/consultations-video" className="text-[#4DB8A8] hover:text-[#3DA391]">
          ← Retour aux consultations
        </Link>
      </div>
    );
  }

  if (!consultation) return null;

  const dateDebut = new Date(consultation.date_debut);
  const dateFin = new Date(consultation.date_fin);
  const isUpcoming = dateDebut > new Date();
  const isOngoing = dateDebut <= new Date() && dateFin >= new Date();

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/admin/consultations-video" className="hover:text-[#4DB8A8]">
            Visioconférences
          </Link>
          <span>/</span>
          <span className="text-gray-900">{consultation.titre}</span>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✅ {success}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] rounded-lg shadow-lg p-8 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{consultation.titre}</h1>
            {consultation.description && (
              <p className="text-white/80 mb-4">{consultation.description}</p>
            )}
            <div className="flex items-center space-x-3">
              {getStatutBadge(consultation.statut)}
              {getPlateformeBadge(consultation.plateforme)}
              {consultation.enregistrement_autorise && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-500/20 text-white border border-white/30">
                  🔴 Enregistrement
                </span>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            {consultation.statut === "PLANIFIE" && isUpcoming && (
              <Link
                href={`/admin/consultations-video/${id}/visio`}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                🎮 Console admin
              </Link>
            )}
            {consultation.statut === "EN_COURS" && (
              <Link
                href={`/admin/consultations-video/${id}/visio`}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors animate-pulse"
              >
                🎮 Rejoindre (en cours)
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de la consultation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📅 Informations de la consultation
            </h2>
            <div className="space-y-3">
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Date :</span>
                <span className="text-gray-900 font-medium">
                  {dateDebut.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Heure :</span>
                <span className="text-gray-900 font-medium">
                  {dateDebut.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {dateFin.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Durée :</span>
                <span className="text-gray-900 font-medium">{consultation.duree} minutes</span>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Plateforme :</span>
                <span className="text-gray-900 font-medium">
                  {consultation.plateforme === "DAILY" ? "Daily.co" : "ZegoCloud"}
                </span>
              </div>
              {consultation.plateforme === "DAILY" && consultation.daily_room_name && (
                <div className="flex">
                  <span className="w-32 text-sm text-gray-600">Room ID :</span>
                  <span className="text-gray-900 font-mono text-sm">
                    {consultation.daily_room_name}
                  </span>
                </div>
              )}
              {consultation.plateforme === "ZEGOCLOUD" && consultation.zego_room_id && (
                <div className="flex">
                  <span className="w-32 text-sm text-gray-600">Room ID :</span>
                  <span className="text-gray-900 font-mono text-sm">
                    {consultation.zego_room_id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Liens d'accès */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🔗 Liens d'accès
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lien pour le patient
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={consultation.lien_patient}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(consultation.lien_patient, "Lien patient")}
                    className="px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors"
                  >
                    📋 Copier
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lien pour le médecin
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={consultation.lien_medecin}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(consultation.lien_medecin, "Lien médecin")}
                    className="px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors"
                  >
                    📋 Copier
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Astuce :</strong> Envoyez ces liens aux participants par email ou SMS. Ils pourront
                rejoindre la consultation directement en cliquant dessus.
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              👥 Participants
            </h2>
            <div className="space-y-4">
              {/* Patient */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {consultation.patient.prenom[0]}
                    {consultation.patient.nom[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {consultation.patient.prenom} {consultation.patient.nom}
                    </p>
                    <p className="text-sm text-gray-600">{consultation.patient.email}</p>
                    {consultation.patient.telephone && (
                      <p className="text-sm text-gray-600">{consultation.patient.telephone}</p>
                    )}
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded">
                      Patient
                    </span>
                  </div>
                </div>
                <Link
                  href={`/admin/patients/${consultation.patient.id}`}
                  className="text-[#4DB8A8] hover:text-[#3DA391]"
                >
                  Voir →
                </Link>
              </div>

              {/* Médecin */}
              {consultation.medecin ? (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-lg">
                      {consultation.medecin.prenom[0]}
                      {consultation.medecin.nom[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Dr. {consultation.medecin.prenom} {consultation.medecin.nom}
                      </p>
                      <p className="text-sm text-gray-600">{consultation.medecin.specialite}</p>
                      {consultation.medecin.email && (
                        <p className="text-sm text-gray-600">{consultation.medecin.email}</p>
                      )}
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded">
                        Médecin
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/medecins/${consultation.medecin.id}`}
                    className="text-[#4DB8A8] hover:text-[#3DA391]"
                  >
                    Voir →
                  </Link>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                  Aucun médecin assigné
                </div>
              )}
            </div>
          </div>

          {/* Rendez-vous associé */}
          {consultation.rendez_vous && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📅 Rendez-vous associé
              </h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{consultation.rendez_vous.raison}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(consultation.rendez_vous.datePrevue).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(consultation.rendez_vous.datePrevue).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                      {consultation.rendez_vous.type}
                    </span>
                  </div>
                  <Link
                    href={`/admin/rendez-vous/${consultation.rendez_vous.id}`}
                    className="text-[#4DB8A8] hover:text-[#3DA391]"
                  >
                    Voir →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut actuel */}
          {isOngoing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-semibold text-green-800">Consultation en cours</span>
              </div>
              <Link
                href={`/admin/consultations-video/${id}/visio`}
                className="block w-full px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
              >
                🎮 Rejoindre maintenant
              </Link>
            </div>
          )}

          {isUpcoming && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">⏰</span>
                <span className="font-semibold text-blue-800">Consultation à venir</span>
              </div>
              <p className="text-sm text-blue-700">
                Commence dans{" "}
                {Math.round((dateDebut.getTime() - new Date().getTime()) / (1000 * 60))} minutes
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Actions</h3>
            <div className="space-y-3">
              {consultation.statut === "PLANIFIE" && (
                <>
                  <button
                    onClick={() => updateStatut("EN_COURS")}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    ▶️ Démarrer
                  </button>
                  <button
                    onClick={() => updateStatut("ANNULE")}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    ❌ Annuler
                  </button>
                </>
              )}
              {consultation.statut === "EN_COURS" && (
                <button
                  onClick={() => updateStatut("TERMINE")}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  ⏹️ Terminer
                </button>
              )}
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Informations</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Créé par :</span>
                <p className="font-medium text-gray-900">
                  {consultation.createur.prenom} {consultation.createur.nom}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Plateforme :</span>
                <p className="font-medium text-gray-900">
                  {consultation.plateforme === "DAILY" ? "Daily.co" : "ZegoCloud"}
                </p>
              </div>
            </div>
          </div>

          {/* Zone dangereuse */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">⚠️ Zone dangereuse</h3>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              🗑️ Supprimer la consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}