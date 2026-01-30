// app/admin/consultations-video/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Consultation = {
  id: string;
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  duree: number;
  statut: "PLANIFIE" | "EN_COURS" | "TERMINE" | "ANNULE";
  daily_room_url: string;
  lien_patient: string;
  lien_medecin: string;
  enregistrement_autorise: boolean;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
  };
  medecin?: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
  };
  rendez_vous?: {
    id: string;
    date_prevue: string;
    raison: string;
  };
};

export default function ConsultationsVideoPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtres
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreRecherche, setFiltreRecherche] = useState("");

  useEffect(() => {
    loadConsultations();
  }, [filtreStatut]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      let url = "/api/admin/consultations-video";
      
      const params = new URLSearchParams();
      if (filtreStatut) params.append("statut", filtreStatut);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Erreur chargement");

      const data = await response.json();
      setConsultations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const handleCopyLink = async (link: string, type: string) => {
    try {
      await navigator.clipboard.writeText(link);
      alert(`Lien ${type} copié dans le presse-papier !`);
    } catch (err) {
      alert("Erreur lors de la copie du lien");
    }
  };

  const consultationsFiltrees = consultations.filter((c) => {
    if (!filtreRecherche) return true;
    const recherche = filtreRecherche.toLowerCase();
    return (
      c.titre.toLowerCase().includes(recherche) ||
      c.patient.nom.toLowerCase().includes(recherche) ||
      c.patient.prenom.toLowerCase().includes(recherche) ||
      (c.medecin && (c.medecin.nom.toLowerCase().includes(recherche) || c.medecin.prenom.toLowerCase().includes(recherche)))
    );
  });

  // Statistiques
  const stats = {
    total: consultations.length,
    planifie: consultations.filter((c) => c.statut === "PLANIFIE").length,
    enCours: consultations.filter((c) => c.statut === "EN_COURS").length,
    termine: consultations.filter((c) => c.statut === "TERMINE").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎥 Visioconférences
          </h1>
          <p className="text-gray-600">
            Gérer les consultations en ligne avec Daily.co
          </p>
        </div>
        <Link
          href="/admin/consultations-video/nouveau"
          className="mt-4 md:mt-0 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors inline-block text-center"
        >
          + Nouvelle visioconférence
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm mb-1">Total</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="text-blue-600 text-sm mb-1">Planifiées</div>
          <div className="text-3xl font-bold text-blue-900">{stats.planifie}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <div className="text-green-600 text-sm mb-1">En cours</div>
          <div className="text-3xl font-bold text-green-900">{stats.enCours}</div>
        </div>
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm mb-1">Terminées</div>
          <div className="text-3xl font-bold text-gray-900">{stats.termine}</div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Nom du patient, médecin, titre..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={filtreRecherche}
              onChange={(e) => setFiltreRecherche(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {consultationsFiltrees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg mb-2">Aucune visioconférence trouvée</p>
            <p className="text-sm">
              Créez votre première consultation en ligne
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Consultation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Médecin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultationsFiltrees.map((consultation) => (
                  <tr
                    key={consultation.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/consultations-video/${consultation.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {consultation.titre}
                      </div>
                      {consultation.rendez_vous && (
                        <div className="text-xs text-gray-500 mt-1">
                          📅 Lié au RDV
                        </div>
                      )}
                      {consultation.enregistrement_autorise && (
                        <div className="text-xs text-blue-600 mt-1">
                          🔴 Enregistrement autorisé
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {consultation.patient.prenom} {consultation.patient.nom}
                      </div>
                      <div className="text-xs text-gray-500">
                        {consultation.patient.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {consultation.medecin ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            Dr. {consultation.medecin.prenom} {consultation.medecin.nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {consultation.medecin.specialite}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Non assigné
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(consultation.date_debut)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {consultation.duree} min
                    </td>
                    <td className="px-6 py-4">
                      {getStatutBadge(consultation.statut)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(consultation.lien_patient, "patient");
                        }}
                        className="text-[#4DB8A8] hover:text-[#3DA391]"
                        title="Copier lien patient"
                      >
                        📋
                      </button>
                      <Link
                        href={`/admin/consultations-video/${consultation.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}