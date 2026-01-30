"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Clinique = {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  pays: string;
  telephone: string;
  email: string | null;
  siteWeb: string | null;
  specialites: string | null;
  estActif: boolean;
  dateCreation: string;
};

export default function CliniquesPage() {
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const cliniquesPerPage = 12;

  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    ville: "",
    pays: "Maroc",
    telephone: "",
    email: "",
    siteWeb: "",
    specialites: "",
  });

  useEffect(() => {
    loadCliniques();
  }, []);

  const loadCliniques = async () => {
    try {
      const response = await fetch("/api/admin/cliniques?includeInactive=true");
      if (response.ok) {
        const data = await response.json();
        setCliniques(data);
      }
    } catch (error) {
      console.error("Erreur chargement cliniques:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const specialitesArray = formData.specialites
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const response = await fetch("/api/admin/cliniques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          specialites: specialitesArray.length > 0 ? specialitesArray : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      setSuccess("Clinique créée avec succès !");
      setShowModal(false);
      setFormData({
        nom: "",
        adresse: "",
        ville: "",
        pays: "Maroc",
        telephone: "",
        email: "",
        siteWeb: "",
        specialites: "",
      });
      loadCliniques();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/cliniques/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estActif: !currentStatus }),
      });

      if (response.ok) {
        loadCliniques();
      }
    } catch (error) {
      console.error("Erreur toggle actif:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette clinique ?")) return;

    try {
      const response = await fetch(`/api/admin/cliniques/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Clinique supprimée");
        loadCliniques();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const filteredCliniques = cliniques.filter(c =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telephone.includes(searchTerm)
  );

  // Pagination
  const totalPages = Math.ceil(filteredCliniques.length / cliniquesPerPage);
  const indexOfLastClinique = currentPage * cliniquesPerPage;
  const indexOfFirstClinique = indexOfLastClinique - cliniquesPerPage;
  const currentCliniques = filteredCliniques.slice(indexOfFirstClinique, indexOfLastClinique);

  // Réinitialiser à la page 1 si le filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
          <h1 className="text-3xl font-bold text-gray-900">Cliniques partenaires</h1>
          <p className="text-gray-600 mt-2">{filteredCliniques.length} clinique{filteredCliniques.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors"
        >
          + Nouvelle clinique
        </button>
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

      {/* Recherche */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          placeholder="Rechercher une clinique..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Liste */}
      {currentCliniques.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentCliniques.map((clinique) => (
              <div key={clinique.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{clinique.nom}</h3>
                    <p className="text-sm text-gray-600">{clinique.ville}, {clinique.pays}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    clinique.estActif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {clinique.estActif ? "Actif" : "Inactif"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">📍 {clinique.adresse}</p>
                  <p className="text-sm text-gray-600">📞 {clinique.telephone}</p>
                  {clinique.email && (
                    <p className="text-sm text-gray-600">📧 {clinique.email}</p>
                  )}
                  {clinique.siteWeb && (
                    <a href={clinique.siteWeb} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4DB8A8] hover:text-[#3DA391]">
                      🌐 Site web
                    </a>
                  )}
                </div>

                {clinique.specialites && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Spécialités:</p>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(clinique.specialites).map((spec: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4 border-t">
                  <Link
                    href={`/admin/cliniques/${clinique.id}`}
                    className="flex-1 bg-[#4DB8A8] text-white text-center py-2 rounded-lg hover:bg-[#3DA391] text-sm"
                  >
                    Voir
                  </Link>
                  <button
                    onClick={() => handleToggleActive(clinique.id, clinique.estActif)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    {clinique.estActif ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleDelete(clinique.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
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
            Affichage de {indexOfFirstClinique + 1} à {Math.min(indexOfLastClinique, filteredCliniques.length)} sur {filteredCliniques.length} cliniques
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune clinique trouvée</h3>
          <p className="text-gray-600 mb-6">Commencez par ajouter une clinique partenaire</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391]"
          >
            + Ajouter une clinique
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nouvelle clinique</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.adresse}
                    onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.pays}
                    onChange={(e) => setFormData({...formData, pays: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.siteWeb}
                    onChange={(e) => setFormData({...formData, siteWeb: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialités (séparées par des virgules)
                  </label>
                  <input
                    type="text"
                    placeholder="Chirurgie esthétique, Dentaire, Ophtalmologie..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.specialites}
                    onChange={(e) => setFormData({...formData, specialites: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}