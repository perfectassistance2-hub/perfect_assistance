"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Patient = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  sexe: string;
  telephone: string;
  whatsapp: string | null;
  pays: string;
  ville: string | null;
  nationalite: string;
  statut: "EN_ATTENTE" | "ACTIF" | "TERMINE" | "ANNULE";
  estActif: boolean;
  dateCreation: string;
  _count?: {
    rendezVous: number;
    sejours: number;
    devis: number;
    messagesRecus: number;
  };
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("TOUS");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 12;

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await fetch("/api/admin/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error("Erreur chargement patients:", error);
      setError("Erreur lors du chargement des patients");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patientId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/patients/${patientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setSuccess("Patient supprimé avec succès");
      loadPatients();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Filtrage des patients
  const filteredPatients = patients.filter((patient) => {
    const matchSearch =
      patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.telephone.includes(searchTerm);

    const matchStatut =
      filterStatut === "TOUS" || patient.statut === filterStatut;

    return matchSearch && matchStatut;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  // Réinitialiser à la page 1 si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatut, searchTerm]);

  const getStatutBadge = (statut: string) => {
    const styles = {
      EN_ATTENTE: "bg-yellow-100 text-yellow-800",
      ACTIF: "bg-green-100 text-green-800",
      TERMINE: "bg-gray-100 text-gray-800",
      ANNULE: "bg-red-100 text-red-800",
    };
    const labels = {
      EN_ATTENTE: "En attente",
      ACTIF: "Actif",
      TERMINE: "Terminé",
      ANNULE: "Annulé",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des patients</h1>
          <p className="text-gray-600 mt-2">
            {filteredPatients.length} patient{filteredPatients.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/admin/patients/nouveau"
          className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors inline-flex items-center justify-center"
        >
          + Nouveau patient
        </Link>
      </div>

      {/* Messages */}
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

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Nom, email, téléphone..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtre statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="ACTIF">Actif</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des patients */}
      {currentPatients.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {currentPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                {/* Header de la carte */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-[#4DB8A8] text-white flex items-center justify-center font-bold text-lg">
                      {patient.prenom[0]}
                      {patient.nom[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {patient.prenom} {patient.nom}
                      </h3>
                      <p className="text-sm text-gray-500">{patient.email}</p>
                    </div>
                  </div>
                  {getStatutBadge(patient.statut)}
                </div>

                {/* Infos patient */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📞</span>
                    <span>{patient.telephone}</span>
                  </div>
                  {patient.whatsapp && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">💬</span>
                      <span>{patient.whatsapp}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🌍</span>
                    <span>{patient.pays} {patient.ville ? `- ${patient.ville}` : ""}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🎂</span>
                    <span>
                      {new Date(patient.dateNaissance).toLocaleDateString("fr-FR")} 
                      ({new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear()} ans)
                    </span>
                  </div>
                </div>

                {/* Statistiques */}
                {patient._count && (
                  <div className="grid grid-cols-4 gap-2 mb-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {patient._count.rendezVous}
                      </div>
                      <div className="text-xs text-gray-500">RDV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {patient._count.sejours}
                      </div>
                      <div className="text-xs text-gray-500">Séjours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {patient._count.devis}
                      </div>
                      <div className="text-xs text-gray-500">Devis</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {patient._count.messagesRecus}
                      </div>
                      <div className="text-xs text-gray-500">Messages</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    href={`/admin/patients/${patient.id}`}
                    className="flex-1 bg-[#4DB8A8] text-white text-center py-2 rounded-lg hover:bg-[#3DA391] transition-colors text-sm font-medium"
                  >
                    Voir détails
                  </Link>
                  <button
                    onClick={() => handleDelete(patient.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    🗑️
                  </button>
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
            Affichage de {indexOfFirstPatient + 1} à {Math.min(indexOfLastPatient, filteredPatients.length)} sur {filteredPatients.length} patients
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun patient trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatut !== "TOUS"
              ? "Essayez de modifier vos filtres"
              : "Commencez par ajouter un nouveau patient"}
          </p>
          {!searchTerm && filterStatut === "TOUS" && (
            <Link
              href="/admin/patients/nouveau"
              className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors"
            >
              + Ajouter un patient
            </Link>
          )}
        </div>
      )}
    </div>
  );
}