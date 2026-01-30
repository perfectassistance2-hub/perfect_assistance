// app/admin/comptabilite/medecins-referents/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MedecinReferent = {
  id: string;
  prenom: string;
  nom: string;
  specialite: string | null;
  pays: string;
  stats: {
    nbPatientsEnvoyes: number;
    nbPaiements: number;
    montantTotalGenere: number;
    commissionTotal: number;
    commissionNonPayee: number;
  };
};

export default function ComptabiliteMedecinsReferentsPage() {
  const [medecins, setMedecins] = useState<MedecinReferent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState("mois");

  useEffect(() => {
    loadMedecinsReferents();
  }, [periode]);

  const loadMedecinsReferents = async () => {
    try {
      const response = await fetch(`/api/admin/comptabilite/medecins-referents?periode=${periode}`);
      if (!response.ok) throw new Error("Erreur chargement");
      const data = await response.json();
      setMedecins(data.medecinsReferents);
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

  const totaux = medecins.reduce(
    (acc, m) => ({
      nbPatients: acc.nbPatients + m.stats.nbPatientsEnvoyes,
      montantTotal: acc.montantTotal + m.stats.montantTotalGenere,
      commissionTotal: acc.commissionTotal + m.stats.commissionTotal,
    }),
    { nbPatients: 0, montantTotal: 0, commissionTotal: 0 }
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
          <span className="text-gray-900">Médecins Référents</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🤝 Médecins Référents</h1>
            <p className="text-gray-600 mt-2">
              Suivi des revenus générés par les patients référés
            </p>
          </div>

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

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* KPI Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Patients référés</p>
          <p className="text-3xl font-bold text-gray-900">{totaux.nbPatients}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Revenus générés</p>
          <p className="text-3xl font-bold text-green-600">
            {totaux.montantTotal.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Commissions totales</p>
          <p className="text-3xl font-bold text-purple-600">
            {totaux.commissionTotal.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
        </div>
      </div>

      {/* Liste médecins référents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {medecins.map((medecin) => (
          <div key={medecin.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-lg">
                    {medecin.prenom[0]}{medecin.nom[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Dr. {medecin.prenom} {medecin.nom}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {medecin.specialite || "Médecin"} • {medecin.pays}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/medecins-referents/${medecin.id}`}
                  className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
                >
                  Voir profil →
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Patients envoyés</p>
                  <p className="text-2xl font-bold text-gray-900">{medecin.stats.nbPatientsEnvoyes}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Paiements</p>
                  <p className="text-2xl font-bold text-gray-900">{medecin.stats.nbPaiements}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Revenus générés</span>
                  <span className="text-lg font-bold text-green-600">
                    {medecin.stats.montantTotalGenere.toLocaleString("fr-FR")} MAD
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Commission totale</span>
                  <span className="text-lg font-bold text-purple-600">
                    {medecin.stats.commissionTotal.toLocaleString("fr-FR")} MAD
                  </span>
                </div>

                {medecin.stats.commissionNonPayee > 0 && (
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Commission non payée</span>
                    <span className="text-lg font-bold text-red-600">
                      {medecin.stats.commissionNonPayee.toLocaleString("fr-FR")} MAD
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {medecins.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun médecin référent</h3>
          <p className="text-gray-600">
            Aucun revenu généré par des médecins référents sur la période sélectionnée
          </p>
        </div>
      )}
    </div>
  );
}