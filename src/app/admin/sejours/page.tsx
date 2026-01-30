"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Sejour = {
  id: string;
  statut: string;
  dateArrivee: string;
  dateDepart: string;
  dateTraitement: string | null;
  typeTraitement: string;
  hebergementNecessaire: boolean;
  transportNecessaire: boolean;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    pays: string;
  };
  coordinateur: {
    id: string;
    prenom: string;
    nom: string;
  };
  clinique: {
    id: string;
    nom: string;
    ville: string;
  };
  medecin: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
  } | null;
};

export default function SejoursPage() {
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("TOUS");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const sejoursPerPage = 12;

  useEffect(() => {
    loadSejours();
  }, []);

  const loadSejours = async () => {
    try {
      const response = await fetch("/api/admin/sejours");
      if (response.ok) {
        const data = await response.json();
        setSejours(data);
      }
    } catch (error) {
      console.error("Erreur chargement séjours:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce séjour ?")) return;

    try {
      const response = await fetch(`/api/admin/sejours/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadSejours();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // Filtrage
  const filteredSejours = sejours.filter((sejour) => {
    const matchStatut = filterStatut === "TOUS" || sejour.statut === filterStatut;
    const matchSearch =
      sejour.patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sejour.patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sejour.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sejour.typeTraitement.toLowerCase().includes(searchTerm.toLowerCase());

    return matchStatut && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSejours.length / sejoursPerPage);
  const indexOfLastSejour = currentPage * sejoursPerPage;
  const indexOfFirstSejour = indexOfLastSejour - sejoursPerPage;
  const currentSejours = filteredSejours.slice(indexOfFirstSejour, indexOfLastSejour);

  // Réinitialiser à la page 1 si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatut, searchTerm]);

  const getStatutBadge = (statut: string) => {
    const styles = {
      PLANIFIE: "bg-yellow-100 text-yellow-800",
      EN_COURS: "bg-blue-100 text-blue-800",
      TERMINE: "bg-green-100 text-green-800",
      ANNULE: "bg-red-100 text-red-800",
    };
    const labels = {
      PLANIFIE: "Planifié",
      EN_COURS: "En cours",
      TERMINE: "Terminé",
      ANNULE: "Annulé",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  const calculateDuration = (dateArrivee: string, dateDepart: string) => {
    const start = new Date(dateArrivee);
    const end = new Date(dateDepart);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} jour${days > 1 ? 's' : ''}`;
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
          <h1 className="text-3xl font-bold text-gray-900">Séjours médicaux</h1>
          <p className="text-gray-600 mt-2">
            {filteredSejours.length} séjour{filteredSejours.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/sejours/nouveau"
          className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors inline-flex items-center justify-center"
        >
          + Nouveau séjour
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Patient, traitement..."
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
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des séjours */}
      {currentSejours.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentSejours.map((sejour) => (
              <div
                key={sejour.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatutBadge(sejour.statut)}
                        <span className="text-xs text-gray-500">
                          {calculateDuration(sejour.dateArrivee, sejour.dateDepart)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                        {sejour.typeTraitement}
                      </h3>
                    </div>
                  </div>

                  {/* Patient */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Patient</p>
                    <Link
                      href={`/admin/patients/${sejour.patient.id}`}
                      className="text-sm font-medium text-[#4DB8A8] hover:text-[#3DA391] line-clamp-1"
                    >
                      {sejour.patient.prenom} {sejour.patient.nom}
                    </Link>
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {sejour.patient.pays} • {sejour.patient.telephone}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Arrivée</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(sejour.dateArrivee).toLocaleDateString("fr-FR", { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Départ</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(sejour.dateDepart).toLocaleDateString("fr-FR", { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Clinique et médecin */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center text-xs text-gray-600 line-clamp-1">
                      <span className="mr-1.5">🏥</span>
                      <span className="truncate">{sejour.clinique.nom} - {sejour.clinique.ville}</span>
                    </div>
                    {sejour.medecin && (
                      <div className="flex items-center text-xs text-gray-600 line-clamp-1">
                        <span className="mr-1.5">👨‍⚕️</span>
                        <span className="truncate">
                          Dr. {sejour.medecin.prenom} {sejour.medecin.nom}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-600 line-clamp-1">
                      <span className="mr-1.5">👨‍💼</span>
                      <span className="truncate">
                        {sejour.coordinateur.prenom} {sejour.coordinateur.nom}
                      </span>
                    </div>
                  </div>

                  {/* Services */}
                  {(sejour.hebergementNecessaire || sejour.transportNecessaire) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {sejour.hebergementNecessaire && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                          🏨 Hébergement
                        </span>
                      )}
                      {sejour.transportNecessaire && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
                          🚗 Transport
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/admin/sejours/${sejour.id}`}
                      className="flex-1 bg-[#4DB8A8] text-white text-center py-2 rounded-lg hover:bg-[#3DA391] transition-colors text-xs font-medium"
                    >
                      Détails
                    </Link>
                    <Link
                      href={`/admin/sejours/${sejour.id}/modifier`}
                      className="flex-1 bg-blue-50 text-blue-600 text-center py-2 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(sejour.id)}
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
            Affichage de {indexOfFirstSejour + 1} à {Math.min(indexOfLastSejour, filteredSejours.length)} sur {filteredSejours.length} séjours
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun séjour trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatut !== "TOUS"
              ? "Essayez de modifier vos filtres"
              : "Commencez par organiser un séjour médical"}
          </p>
          {!searchTerm && filterStatut === "TOUS" && (
            <Link
              href="/admin/sejours/nouveau"
              className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors"
            >
              + Organiser un séjour
            </Link>
          )}
        </div>
      )}
    </div>
  );
}