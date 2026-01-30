// app/admin/consultations-video/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Consultation = {
  id: string;
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  duree: number;
  statut: "PLANIFIE" | "EN_COURS" | "TERMINE" | "ANNULE";
  daily_room_name: string;
  daily_room_url: string;
  lien_patient: string;
  lien_medecin: string;
  enregistrement_autorise: boolean;
  enregistrement_demarre: boolean;
  date_creation: string;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
  };
  medecin?: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
    email: string;
  };
  rendez_vous?: {
    id: string;
    datePrevue: string;
    raison: string;
    type: string;
  };
  createur: {
    id: string;
    prenom: string;
    nom: string;
  };
};

export default function DetailConsultationVideoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      loadConsultation();
    }
  }, [id]);

  const loadConsultation = async () => {
    try {
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

  const handleCopyLink = async (link: string, type: string) => {
    try {
      await navigator.clipboard.writeText(link);
      alert(`✅ Lien ${type} copié dans le presse-papier !`);
    } catch (err) {
      alert("❌ Erreur lors de la copie du lien");
    }
  };

  const handleShareByEmail = (email: string, link: string, nom: string) => {
    const subject = encodeURIComponent(`Invitation - ${consultation?.titre}`);
    const body = encodeURIComponent(
      `Bonjour ${nom},\n\nVous êtes invité(e) à rejoindre la visioconférence :\n\n📅 ${consultation?.titre}\n🕐 ${formatDate(consultation?.date_debut || "")}\n\nRejoindre la consultation :\n${link}\n\nÀ bientôt !`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleShareByWhatsApp = (telephone: string, link: string) => {
    const message = encodeURIComponent(
      `🎥 Invitation Visioconférence\n\n${consultation?.titre}\n${formatDate(consultation?.date_debut || "")}\n\nRejoindre : ${link}`
    );
    window.open(`https://wa.me/${telephone.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  const handleDelete = async () => {
    if (!consultation) return;

    try {
      const response = await fetch(`/api/admin/consultations-video/${consultation.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      alert("✅ Consultation supprimée avec succès");
      router.push("/admin/consultations-video");
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!consultation) return;

    try {
      const response = await fetch(`/api/admin/consultations-video/${consultation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      const data = await response.json();
      setConsultation(data.consultation);
      alert("✅ Statut mis à jour");
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(date);
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      PLANIFIE: "bg-blue-100 text-blue-800",
      EN_COURS: "bg-green-100 text-green-800",
      TERMINE: "bg-gray-100 text-gray-800",
      ANNULE: "bg-red-100 text-red-800",
    };

    const labels = {
      PLANIFIE: "Planifié",
      EN_COURS: "En cours",
      TERMINE: "Terminé",
      ANNULE: "Annulé",
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">❌ {error || "Consultation non trouvée"}</p>
        <Link
          href="/admin/consultations-video"
          className="text-[#4DB8A8] hover:text-[#3DA391]"
        >
          ← Retour aux visioconférences
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/consultations-video"
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour aux visioconférences
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {consultation.titre}
            </h1>
            <div className="flex items-center space-x-4">
              {getStatutBadge(consultation.statut)}
              {consultation.enregistrement_autorise && (
                <span className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded-full">
                  🔴 Enregistrement autorisé
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* Bouton principal pour démarrer/rejoindre la visio */}
            {(consultation.statut === "PLANIFIE" || consultation.statut === "EN_COURS") && (
              <Link
                href={`/admin/consultations-video/${consultation.id}/visio`}
                className="px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] font-medium flex items-center space-x-2"
              >
                <span>🎥</span>
                <span>{consultation.statut === "PLANIFIE" ? "Démarrer la visio" : "Rejoindre la visio"}</span>
              </Link>
            )}
            
            {consultation.statut === "EN_COURS" && (
              <button
                onClick={() => handleUpdateStatus("TERMINE")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                ⏹️ Terminer
              </button>
            )}
            {consultation.statut === "PLANIFIE" && (
              <button
                onClick={() => handleUpdateStatus("ANNULE")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                ❌ Annuler
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📋 Informations
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Date et heure :</span>
                <p className="font-medium">{formatDate(consultation.date_debut)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Durée :</span>
                <p className="font-medium">{consultation.duree} minutes</p>
              </div>
              {consultation.description && (
                <div>
                  <span className="text-sm text-gray-600">Description :</span>
                  <p className="font-medium">{consultation.description}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">Créé par :</span>
                <p className="font-medium">
                  {consultation.createur.prenom} {consultation.createur.nom}
                </p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              👥 Participants
            </h2>
            
            {/* Patient */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Patient</p>
                  <p className="font-semibold text-gray-900">
                    {consultation.patient.prenom} {consultation.patient.nom}
                  </p>
                  <p className="text-sm text-gray-600">{consultation.patient.email}</p>
                  {consultation.patient.telephone && (
                    <p className="text-sm text-gray-600">{consultation.patient.telephone}</p>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleCopyLink(consultation.lien_patient, "patient")}
                    className="px-3 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                  >
                    📋 Copier lien
                  </button>
                  <button
                    onClick={() => handleShareByEmail(
                      consultation.patient.email,
                      consultation.lien_patient,
                      consultation.patient.prenom
                    )}
                    className="px-3 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                  >
                    ✉️ Email
                  </button>
                  {consultation.patient.telephone && (
                    <button
                      onClick={() => handleShareByWhatsApp(
                        consultation.patient.telephone,
                        consultation.lien_patient
                      )}
                      className="px-3 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                    >
                      💬 WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Médecin */}
            {consultation.medecin && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium mb-1">Médecin</p>
                    <p className="font-semibold text-gray-900">
                      Dr. {consultation.medecin.prenom} {consultation.medecin.nom}
                    </p>
                    <p className="text-sm text-gray-600">{consultation.medecin.specialite}</p>
                    <p className="text-sm text-gray-600">{consultation.medecin.email}</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleCopyLink(consultation.lien_medecin, "médecin")}
                      className="px-3 py-1 text-xs bg-white border border-green-300 text-green-700 rounded hover:bg-green-50"
                    >
                      📋 Copier lien
                    </button>
                    <button
                      onClick={() => handleShareByEmail(
                        consultation.medecin!.email,
                        consultation.lien_medecin,
                        `Dr. ${consultation.medecin!.prenom}`
                      )}
                      className="px-3 py-1 text-xs bg-white border border-green-300 text-green-700 rounded hover:bg-green-50"
                    >
                      ✉️ Email
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rendez-vous associé */}
          {consultation.rendez_vous && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📅 Rendez-vous associé
              </h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {formatDate(consultation.rendez_vous.datePrevue)}
                </p>
                <p className="font-medium mt-1">
                  {consultation.rendez_vous.raison || "Sans objet"}
                </p>
                <Link
                  href={`/admin/rendez-vous/${consultation.rendez_vous.id}`}
                  className="text-sm text-[#4DB8A8] hover:text-[#3DA391] mt-2 inline-block"
                >
                  Voir le rendez-vous →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Accès rapide */}
          <div className="bg-gradient-to-br from-[#4DB8A8] to-[#3DA391] rounded-lg shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">🎥 Accès rapide</h3>
            
            {/* Bouton pour la page de visio avec contrôles admin */}
            {(consultation.statut === "PLANIFIE" || consultation.statut === "EN_COURS") && (
              <Link
                href={`/admin/consultations-video/${consultation.id}/visio`}
                className="block w-full px-4 py-3 bg-white text-[#4DB8A8] rounded-lg text-center font-medium hover:bg-gray-50 transition-colors mb-3"
              >
                🎮 Console de contrôle
              </Link>
            )}
            
            {/* Lien direct vers la room */}
            <a
              href={consultation.daily_room_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 bg-white/20 text-white border-2 border-white rounded-lg text-center font-medium hover:bg-white/30 transition-colors"
            >
              Rejoindre (lien direct)
            </a>
            <p className="text-xs text-white/80 mt-3 text-center">
              Console = Contrôles admin complets<br/>
              Lien direct = Accès simple
            </p>
          </div>

          {/* Informations techniques */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔧 Détails techniques
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Room ID :</span>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                  {consultation.daily_room_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">URL Room :</span>
                <a
                  href={consultation.daily_room_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs block mt-1 break-all"
                >
                  {consultation.daily_room_url}
                </a>
              </div>
            </div>
          </div>

          {/* Actions dangereuses */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚠️ Zone dangereuse
            </h3>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={consultation.statut === "EN_COURS"}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Supprimer la consultation
            </button>
            {consultation.statut === "EN_COURS" && (
              <p className="text-xs text-gray-500 mt-2">
                Impossible de supprimer une consultation en cours
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette consultation ? Cette
              action est irréversible et supprimera également la room Daily.co.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}