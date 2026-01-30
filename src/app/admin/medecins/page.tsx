"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Medecin = {
  id: string;
  prenom: string;
  nom: string;
  specialite: string;
  telephone: string;
  email: string;
  numeroLicence: string | null;
  anneesExperience: number | null;
  estActif: boolean;
  clinique: {
    id: string;
    nom: string;
    ville: string;
  } | null;
};

export default function MedecinsPage() {
  const router = useRouter();
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialite, setFilterSpecialite] = useState("TOUS");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const medecinsPerPage = 12;

  useEffect(() => {
    loadMedecins();
  }, []);

  const loadMedecins = async () => {
    try {
      const response = await fetch("/api/admin/medecins?includeInactive=true");
      if (response.ok) {
        const data = await response.json();
        setMedecins(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/medecins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estActif: !currentStatus }),
      });
      loadMedecins();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("⚠️ Attention : Supprimer ce médecin supprimera aussi son compte utilisateur. Continuer ?")) return;

    try {
      const response = await fetch(`/api/admin/medecins/${id}`, { method: "DELETE" });
      if (response.ok) {
        setSuccess("Médecin et compte utilisateur supprimés");
        loadMedecins();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const specialites = Array.from(new Set(medecins.map(m => m.specialite)));

  const filteredMedecins = medecins.filter(m => {
    const matchSearch =
      m.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.specialite.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSpec = filterSpecialite === "TOUS" || m.specialite === filterSpecialite;

    return matchSearch && matchSpec;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMedecins.length / medecinsPerPage);
  const indexOfLastMedecin = currentPage * medecinsPerPage;
  const indexOfFirstMedecin = indexOfLastMedecin - medecinsPerPage;
  const currentMedecins = filteredMedecins.slice(indexOfFirstMedecin, indexOfLastMedecin);

  // Réinitialiser à la page 1 si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSpecialite, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Médecins</h1>
          <p className="text-gray-600 mt-2">{filteredMedecins.length} médecin{filteredMedecins.length > 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/medecins/nouveau"
          className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] text-center"
        >
          + Nouveau médecin
        </Link>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom, email, spécialité..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
            value={filterSpecialite}
            onChange={(e) => setFilterSpecialite(e.target.value)}
          >
            <option value="TOUS">Toutes les spécialités</option>
            {specialites.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      {currentMedecins.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentMedecins.map((medecin) => (
              <div key={medecin.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                      {medecin.prenom[0]}{medecin.nom[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Dr. {medecin.prenom} {medecin.nom}
                      </h3>
                      <p className="text-sm text-gray-600">{medecin.specialite}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    medecin.estActif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {medecin.estActif ? "Actif" : "Inactif"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">📞 {medecin.telephone}</p>
                  <p className="text-sm text-gray-600">📧 {medecin.email}</p>
                  {medecin.clinique && (
                    <p className="text-sm text-gray-600">
                      🏥 {medecin.clinique.nom} - {medecin.clinique.ville}
                    </p>
                  )}
                  {medecin.numeroLicence && (
                    <p className="text-sm text-gray-600">📋 Licence: {medecin.numeroLicence}</p>
                  )}
                  {medecin.anneesExperience && (
                    <p className="text-sm text-gray-600">⭐ {medecin.anneesExperience} ans d'expérience</p>
                  )}
                </div>

                <div className="flex space-x-2 pt-4 border-t">
                  <Link
                    href={`/admin/medecins/${medecin.id}`}
                    className="flex-1 bg-[#4DB8A8] text-white text-center py-2 rounded-lg hover:bg-[#3DA391] text-sm"
                  >
                    Voir détails
                  </Link>
                  <button
                    onClick={() => handleToggleActive(medecin.id, medecin.estActif)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                    title={medecin.estActif ? "Désactiver" : "Activer"}
                  >
                    {medecin.estActif ? "⏸️" : "▶️"}
                  </button>
                  <button
                    onClick={() => handleDelete(medecin.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                    title="Supprimer"
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
            Affichage de {indexOfFirstMedecin + 1} à {Math.min(indexOfLastMedecin, filteredMedecins.length)} sur {filteredMedecins.length} médecins
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">👨‍⚕️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun médecin trouvé</h3>
          <p className="text-gray-600 mb-4">Commencez par ajouter votre premier médecin</p>
          <Link
            href="/admin/medecins/nouveau"
            className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391]"
          >
            + Ajouter un médecin
          </Link>
        </div>
      )}
    </div>
  );
}