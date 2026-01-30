"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Devis = {
  id: string;
  numeroDevis: string;
  sousTotal: number;
  taxe: number;
  total: number;
  devise: string;
  statutPaiement: string;
  montantPaye: number;
  valideJusquau: string;
  dateCreation: string;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
  };
  sejour: {
    id: string;
    typeTraitement: string;
    dateArrivee: string;
  } | null;
};

const ITEMS_PER_PAGE = 12;

export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("TOUS");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [changingStatut, setChangingStatut] = useState<string | null>(null);

  useEffect(() => {
    loadDevis();
  }, []);

  // Réinitialiser la page lors de la recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatut]);

  const loadDevis = async () => {
    try {
      const response = await fetch("/api/admin/devis");
      if (response.ok) {
        setDevis(await response.json());
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatut = async (devisId: string, newStatut: string) => {
    setChangingStatut(devisId);
    try {
      const response = await fetch(`/api/admin/devis/${devisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statutPaiement: newStatut })
      });

      if (response.ok) {
        await loadDevis();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du changement de statut');
    } finally {
      setChangingStatut(null);
    }
  };

  const handleDelete = async (devisId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce devis ? Cette action est irréversible.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/devis/${devisId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadDevis();
      } else {
        alert('Erreur lors de la suppression du devis');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredDevis = devis.filter(d => {
    const matchStatut = filterStatut === "TOUS" || d.statutPaiement === filterStatut;
    const matchSearch =
      d.numeroDevis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.patient.nom.toLowerCase().includes(searchTerm.toLowerCase());

    return matchStatut && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDevis.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDevis = filteredDevis.slice(startIndex, endIndex);

  const getStatutBadge = (statut: string) => {
    const styles = {
      EN_ATTENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
      PARTIEL: "bg-orange-100 text-orange-800 border-orange-200",
      PAYE: "bg-green-100 text-green-800 border-green-200",
      ANNULE: "bg-red-100 text-red-800 border-red-200",
    };
    return styles[statut as keyof typeof styles] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatutLabel = (statut: string) => {
    const labels = {
      EN_ATTENTE: "En attente",
      PARTIEL: "Partiel",
      PAYE: "Payé",
      ANNULE: "Annulé",
    };
    return labels[statut as keyof typeof labels] || statut;
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Devis</h1>
          <p className="text-gray-600 mt-2">
            {filteredDevis.length} devis
          </p>
        </div>
        <Link
          href="/admin/devis/nouveau"
          className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-all"
        >
          + Nouveau devis
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Rechercher par numéro ou nom du patient..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="PARTIEL">Partiel</option>
            <option value="PAYE">Payé</option>
            <option value="ANNULE">Annulé</option>
          </select>
        </div>
      </div>

      {/* Liste - Grille à 3 colonnes */}
      {currentDevis.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {currentDevis.map((d) => (
              <div key={d.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                      #{d.numeroDevis}
                    </h3>
                    <Link
                      href={`/admin/patients/${d.patient.id}`}
                      className="text-sm text-[#4DB8A8] hover:text-[#3DA391] truncate block"
                    >
                      {d.patient.prenom} {d.patient.nom}
                    </Link>
                  </div>
                </div>

                {/* Statut badge et select */}
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatutBadge(d.statutPaiement)} mb-2`}>
                    {getStatutLabel(d.statutPaiement)}
                  </span>
                  <select
                    value={d.statutPaiement}
                    onChange={(e) => handleChangeStatut(d.id, e.target.value)}
                    disabled={changingStatut === d.id}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent disabled:opacity-50 cursor-pointer"
                  >
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="PARTIEL">Partiel</option>
                    <option value="PAYE">Payé</option>
                    <option value="ANNULE">Annulé</option>
                  </select>
                </div>

                {d.sejour && (
                  <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-100">
                    <p className="text-xs text-gray-700 font-medium truncate">
                      {d.sejour.typeTraitement}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(d.sejour.dateArrivee).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total:</span>
                    <span className="font-medium">{d.sousTotal.toLocaleString()} {d.devise}</span>
                  </div>
                  {d.taxe > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxe:</span>
                      <span className="font-medium">{d.taxe.toLocaleString()} {d.devise}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-[#4DB8A8]">{d.total.toLocaleString()} {d.devise}</span>
                  </div>
                </div>

                {d.statutPaiement === "PARTIEL" && (
                  <div className="mb-3 p-2 bg-orange-50 rounded border border-orange-100">
                    <p className="text-xs text-orange-800 mb-1.5">
                      Payé: {d.montantPaye.toLocaleString()} / {d.total.toLocaleString()} {d.devise}
                    </p>
                    <div className="w-full bg-orange-200 rounded-full h-1.5">
                      <div
                        className="bg-orange-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${(d.montantPaye / d.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pt-2 border-t border-gray-100">
                  <span title={`Créé le ${new Date(d.dateCreation).toLocaleDateString("fr-FR")}`}>
                    {new Date(d.dateCreation).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })}
                  </span>
                  <span title={`Valide jusqu'au ${new Date(d.valideJusquau).toLocaleDateString("fr-FR")}`}>
                    ⏰ {new Date(d.valideJusquau).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/devis/${d.id}`}
                    className="flex-1 bg-[#4DB8A8] text-white text-center py-2 rounded-lg hover:bg-[#3DA391] text-xs font-medium transition-all"
                  >
                    Détails
                  </Link>
                  <Link
                    href={`/admin/devis/${d.id}/modifier`}
                    className="flex-1 bg-blue-50 text-blue-600 text-center py-2 rounded-lg hover:bg-blue-100 text-xs font-medium transition-all"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-medium transition-all"
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
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredDevis.length)} sur {filteredDevis.length} devis
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun devis trouvé</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatut !== "TOUS" 
              ? "Essayez de modifier vos filtres"
              : "Commencez par créer votre premier devis"}
          </p>
          <Link
            href="/admin/devis/nouveau"
            className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-all"
          >
            + Créer un devis
          </Link>
        </div>
      )}
    </div>
  );
}