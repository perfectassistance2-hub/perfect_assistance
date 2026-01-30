// app/admin/comptabilite/paiements/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Paiement = {
  id: string;
  montant: number;
  devise: string;
  statut: string;
  datePaiement: string | null;
  modePaiement: string | null;
  dateCreation: string;
  commissionStatut: string;
  patient: { id: string; prenom: string; nom: string; email: string };
  clinique: { id: string; nom: string } | null;
  medecin: { id: string; prenom: string; nom: string } | null;
  medecinReferent: { id: string; prenom: string; nom: string } | null;
  sejour: { typeTraitement: string };
};

type Totaux = {
  total: number;
  montantTotal: number;
  montantPaye: number;
  montantEnAttente: number;
  commissionsNonPayees: number;
};

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [totaux, setTotaux] = useState<Totaux | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtres
  const [filterStatut, setFilterStatut] = useState("tous");
  const [filterCommission, setFilterCommission] = useState("tous");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPaiements();
  }, []);

  const loadPaiements = async () => {
    try {
      const response = await fetch("/api/admin/comptabilite/paiements");
      if (!response.ok) throw new Error("Erreur chargement");
      const data = await response.json();
      setPaiements(data.paiements);
      setTotaux(data.totaux);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paiementId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) return;

    try {
      const response = await fetch(`/api/admin/comptabilite/paiements/${paiementId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur suppression");
      
      alert("Paiement supprimé avec succès");
      loadPaiements();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtrage
  const paiementsFiltres = paiements.filter((p) => {
    const matchStatut = filterStatut === "tous" || p.statut === filterStatut;
    const matchCommission = filterCommission === "tous" || p.commissionStatut === filterCommission;
    const matchSearch =
      p.patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.clinique?.nom || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchStatut && matchCommission && matchSearch;
  });

  const getStatutBadge = (statut: string) => {
    const styles = {
      en_attente: "bg-yellow-100 text-yellow-800",
      payé: "bg-green-100 text-green-800",
      annulé: "bg-red-100 text-red-800",
    };
    const labels = {
      en_attente: "En attente",
      payé: "Payé",
      annulé: "Annulé",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  const getCommissionBadge = (statut: string) => {
    const styles = {
      non_payee: "bg-red-100 text-red-800",
      avance: "bg-orange-100 text-orange-800",
      payee: "bg-green-100 text-green-800",
    };
    const labels = {
      non_payee: "Non payée",
      avance: "Avance",
      payee: "Payée",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[statut as keyof typeof styles]}`}>
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
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/admin/comptabilite" className="hover:text-[#4DB8A8]">
              Comptabilité
            </Link>
            <span>/</span>
            <span className="text-gray-900">Paiements</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Liste des paiements</h1>
          <p className="text-gray-600 mt-2">
            {paiementsFiltres.length} paiement{paiementsFiltres.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/admin/comptabilite/paiements/nouveau"
          className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors inline-flex items-center justify-center"
        >
          + Nouveau paiement
        </Link>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Statistiques rapides */}
      {totaux && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Montant total</p>
            <p className="text-2xl font-bold text-gray-900">
              {totaux.montantTotal.toLocaleString("fr-FR")} MAD
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Payé</p>
            <p className="text-2xl font-bold text-green-600">
              {totaux.montantPaye.toLocaleString("fr-FR")} MAD
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">En attente</p>
            <p className="text-2xl font-bold text-orange-600">
              {totaux.montantEnAttente.toLocaleString("fr-FR")} MAD
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Commissions dues</p>
            <p className="text-2xl font-bold text-red-600">
              {totaux.commissionsNonPayees.toLocaleString("fr-FR")} MAD
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Patient, email, clinique..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtre statut paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut paiement
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="payé">Payé</option>
              <option value="annulé">Annulé</option>
            </select>
          </div>

          {/* Filtre commission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut commission
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={filterCommission}
              onChange={(e) => setFilterCommission(e.target.value)}
            >
              <option value="tous">Tous</option>
              <option value="non_payee">Non payée</option>
              <option value="avance">Avance</option>
              <option value="payee">Payée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinique/Médecin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Traitement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paiementsFiltres.map((paiement) => (
                <tr key={paiement.id} className="hover:bg-gray-50 transition-colors">
                  {/* Patient */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#4DB8A8] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {paiement.patient.prenom[0]}{paiement.patient.nom[0]}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {paiement.patient.prenom} {paiement.patient.nom}
                        </div>
                        <div className="text-xs text-gray-500">{paiement.patient.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Clinique/Médecin */}
                  <td className="px-6 py-4">
                    {paiement.clinique ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          🏥 {paiement.clinique.nom}
                        </div>
                        {paiement.medecin && (
                          <div className="text-xs text-gray-500">
                            Dr. {paiement.medecin.prenom} {paiement.medecin.nom}
                          </div>
                        )}
                      </div>
                    ) : paiement.medecin ? (
                      <div className="text-sm text-gray-900">
                        👨‍⚕️ Dr. {paiement.medecin.prenom} {paiement.medecin.nom}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>

                  {/* Traitement */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {paiement.sejour.typeTraitement}
                    </div>
                  </td>

                  {/* Montant */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {paiement.montant.toLocaleString("fr-FR")} {paiement.devise}
                    </div>
                    {paiement.modePaiement && (
                      <div className="text-xs text-gray-500">
                        {paiement.modePaiement}
                      </div>
                    )}
                  </td>

                  {/* Statut paiement */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatutBadge(paiement.statut)}
                  </td>

                  {/* Statut commission */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCommissionBadge(paiement.commissionStatut)}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {paiement.datePaiement
                        ? new Date(paiement.datePaiement).toLocaleDateString("fr-FR")
                        : "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Créé le {new Date(paiement.dateCreation).toLocaleDateString("fr-FR")}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/comptabilite/paiements/${paiement.id}`}
                        className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
                      >
                        Détails
                      </Link>
                      <Link
                        href={`/admin/comptabilite/paiements/${paiement.id}/modifier`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => handleDelete(paiement.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {paiementsFiltres.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun paiement trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatut !== "tous" || filterCommission !== "tous"
              ? "Essayez de modifier vos filtres"
              : "Commencez par ajouter un paiement"}
          </p>
          {!searchTerm && filterStatut === "tous" && filterCommission === "tous" && (
            <Link
              href="/admin/comptabilite/paiements/nouveau"
              className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors"
            >
              + Ajouter un paiement
            </Link>
          )}
        </div>
      )}
    </div>
  );
}