"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RendezVous = {
  id: string;
  type: string;
  statut: string;
  datePrevue: string;
  duree: number;
  raison: string | null;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
  };
  medecin: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
  } | null;
  clinique: {
    id: string;
    nom: string;
    ville: string;
  } | null;
};

export default function RendezVousPage() {
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("TOUS");
  const [filterType, setFilterType] = useState("TOUS");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rdvPerPage = 12;

  useEffect(() => {
    loadRendezVous();
  }, []);

  const loadRendezVous = async () => {
    try {
      const response = await fetch("/api/admin/rendez-vous");
      if (response.ok) {
        const data = await response.json();
        setRendezVous(data);
      }
    } catch (error) {
      console.error("Erreur chargement rendez-vous:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce rendez-vous ?")) return;

    try {
      const response = await fetch(`/api/admin/rendez-vous/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadRendezVous();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // Filtrage
  const filteredRendezVous = rendezVous.filter((rdv) => {
    const matchStatut = filterStatut === "TOUS" || rdv.statut === filterStatut;
    const matchType = filterType === "TOUS" || rdv.type === filterType;
    const matchSearch =
      rdv.patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rdv.patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rdv.patient.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchStatut && matchType && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRendezVous.length / rdvPerPage);
  const indexOfLastRdv = currentPage * rdvPerPage;
  const indexOfFirstRdv = indexOfLastRdv - rdvPerPage;
  const currentRendezVous = filteredRendezVous.slice(indexOfFirstRdv, indexOfLastRdv);

  // Réinitialiser à la page 1 si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatut, filterType, searchTerm]);

  const getStatutBadge = (statut: string) => {
    const styles = {
      PLANIFIE: "bg-blue-100 text-blue-800",
      CONFIRME: "bg-green-100 text-green-800",
      TERMINE: "bg-gray-100 text-gray-800",
      ANNULE: "bg-red-100 text-red-800",
      ABSENT: "bg-orange-100 text-orange-800",
    };
    const labels = {
      PLANIFIE: "Planifié",
      CONFIRME: "Confirmé",
      TERMINE: "Terminé",
      ANNULE: "Annulé",
      ABSENT: "Absent",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[statut as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
        {labels[statut as keyof typeof labels] || statut}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels = {
      EN_LIGNE: "🎥 En ligne",
      SUR_PLACE: "🏥 Sur place",
      PRE_ARRIVEE: "📋 Pré-arrivée",
      SUIVI_POST_TRAITEMENT: "🔄 Suivi",
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-600 mt-2">
            {filteredRendezVous.length} rendez-vous
          </p>
        </div>
        <Link
          href="/admin/rendez-vous/nouveau"
          className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors inline-flex items-center justify-center"
        >
          + Nouveau rendez-vous
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un patient
            </label>
            <input
              type="text"
              placeholder="Nom, email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
            >
              <option value="TOUS">Tous</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="CONFIRME">Confirmé</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="TOUS">Tous</option>
              <option value="EN_LIGNE">En ligne</option>
              <option value="SUR_PLACE">Sur place</option>
              <option value="PRE_ARRIVEE">Pré-arrivée</option>
              <option value="SUIVI_POST_TRAITEMENT">Suivi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des rendez-vous */}
      {currentRendezVous.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentRendezVous.map((rdv) => (
              <div
                key={rdv.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                        {getStatutBadge(rdv.statut)}
                        <span className="text-xs text-gray-600">
                          {getTypeBadge(rdv.type)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-900">
                        <span>📅 {new Date(rdv.datePrevue).toLocaleDateString("fr-FR", { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}</span>
                        <span className="text-gray-400">•</span>
                        <span>
                          {new Date(rdv.datePrevue).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        Durée: {rdv.duree} min
                      </span>
                    </div>
                  </div>

                  {/* Patient */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Patient</p>
                    <Link
                      href={`/admin/patients/${rdv.patient.id}`}
                      className="text-sm font-medium text-[#4DB8A8] hover:text-[#3DA391] line-clamp-1"
                    >
                      {rdv.patient.prenom} {rdv.patient.nom}
                    </Link>
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {rdv.patient.telephone}
                    </p>
                  </div>

                  {/* Médecin et Clinique */}
                  <div className="space-y-1.5 mb-3">
                    {rdv.medecin && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Médecin</p>
                        <p className="text-xs font-medium text-gray-900 line-clamp-1">
                          Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">{rdv.medecin.specialite}</p>
                      </div>
                    )}

                    {rdv.clinique && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Clinique</p>
                        <p className="text-xs font-medium text-gray-900 line-clamp-1">
                          {rdv.clinique.nom}
                        </p>
                        <p className="text-xs text-gray-500">{rdv.clinique.ville}</p>
                      </div>
                    )}
                  </div>

                  {/* Raison */}
                  {rdv.raison && (
                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600 line-clamp-2">
                      💬 {rdv.raison}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/admin/rendez-vous/${rdv.id}`}
                      className="flex-1 bg-[#4DB8A8] text-white text-center py-2 rounded-lg hover:bg-[#3DA391] transition-colors text-xs font-medium"
                    >
                      Détails
                    </Link>
                    <Link
                      href={`/admin/rendez-vous/${rdv.id}/modifier`}
                      className="flex-1 bg-blue-50 text-blue-600 text-center py-2 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(rdv.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Afficher seulement certaines pages pour éviter trop de boutons
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-[#4DB8A8] text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <span key={page} className="px-2 py-2">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          )}

          {/* Informations de pagination */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Affichage de {indexOfFirstRdv + 1} à {Math.min(indexOfLastRdv, filteredRendezVous.length)} sur {filteredRendezVous.length} rendez-vous
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun rendez-vous trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatut !== "TOUS" || filterType !== "TOUS"
              ? "Essayez de modifier vos filtres"
              : "Commencez par créer un rendez-vous"}
          </p>
          {!searchTerm && filterStatut === "TOUS" && filterType === "TOUS" && (
            <Link
              href="/admin/rendez-vous/nouveau"
              className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors"
            >
              + Créer un rendez-vous
            </Link>
          )}
        </div>
      )}
    </div>
  );
}