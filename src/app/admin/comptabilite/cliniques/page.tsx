// app/admin/comptabilite/cliniques/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Clinique = {
  id: string;
  nom: string;
  ville: string;
  pays: string;
  stats: {
    nbPaiements: number;
    nbPatients: number;
    montantTotal: number;
    montantPaye: number;
    montantEnAttente: number;
    commissionTotal: number;
    commissionNonPayee: number;
  };
};

export default function ComptabilitecliniquesPage() {
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState("mois"); // mois, trimestre, annee, tout

  useEffect(() => {
    loadCliniques();
  }, [periode]);

  const loadCliniques = async () => {
    try {
      const response = await fetch(`/api/admin/comptabilite/cliniques?periode=${periode}`);
      if (!response.ok) throw new Error("Erreur chargement");
      const data = await response.json();
      setCliniques(data.cliniques);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  const totaux = cliniques.reduce(
    (acc, c) => ({
      montantTotal: acc.montantTotal + c.stats.montantTotal,
      montantPaye: acc.montantPaye + c.stats.montantPaye,
      commissionTotal: acc.commissionTotal + c.stats.commissionTotal,
    }),
    { montantTotal: 0, montantPaye: 0, commissionTotal: 0 }
  );

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/admin/comptabilite" className="hover:text-[#4DB8A8]">
            Comptabilité
          </Link>
          <span>/</span>
          <span className="text-gray-900">Cliniques</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏥 Statistiques par clinique</h1>
            <p className="text-gray-600 mt-2">
              Revenus et commissions générés par chaque clinique
            </p>
          </div>

          {/* Filtre période */}
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            >
              <option value="mois">Ce mois</option>
              <option value="trimestre">Ce trimestre</option>
              <option value="annee">Cette année</option>
              <option value="tout">Depuis le début</option>
            </select>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* KPI Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Revenus total</p>
          <p className="text-3xl font-bold text-gray-900">
            {totaux.montantTotal.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Montant payé</p>
          <p className="text-3xl font-bold text-green-600">
            {totaux.montantPaye.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Commissions totales</p>
          <p className="text-3xl font-bold text-purple-600">
            {totaux.commissionTotal.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
        </div>
      </div>

      {/* Liste cliniques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cliniques.map((clinique) => (
          <div key={clinique.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            {/* Header carte */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{clinique.nom}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    📍 {clinique.ville}, {clinique.pays}
                  </p>
                </div>
                <Link
                  href={`/admin/comptabilite/cliniques/${clinique.id}`}
                  className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
                >
                  Détails →
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{clinique.stats.nbPatients}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Paiements</p>
                  <p className="text-2xl font-bold text-gray-900">{clinique.stats.nbPaiements}</p>
                </div>
              </div>

              {/* Revenus */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Revenus total</span>
                  <span className="text-lg font-bold text-blue-600">
                    {clinique.stats.montantTotal.toLocaleString("fr-FR")} MAD
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Payé</span>
                  <span className="text-lg font-bold text-green-600">
                    {clinique.stats.montantPaye.toLocaleString("fr-FR")} MAD
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">En attente</span>
                  <span className="text-lg font-bold text-orange-600">
                    {clinique.stats.montantEnAttente.toLocaleString("fr-FR")} MAD
                  </span>
                </div>
              </div>

              {/* Commission */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Commission totale</span>
                  <span className="text-xl font-bold text-purple-600">
                    {clinique.stats.commissionTotal.toLocaleString("fr-FR")} MAD
                  </span>
                </div>
                {clinique.stats.commissionNonPayee > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">Non payée</span>
                    <span className="text-sm font-semibold text-red-600">
                      {clinique.stats.commissionNonPayee.toLocaleString("fr-FR")} MAD
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {cliniques.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune clinique</h3>
          <p className="text-gray-600">
            Aucun paiement enregistré pour la période sélectionnée
          </p>
        </div>
      )}
    </div>
  );
}