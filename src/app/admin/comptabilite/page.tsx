// app/admin/comptabilite/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DashboardData = {
  kpi: {
    revenusMoisCourant: number;
    patientsActifsMois: number;
    paiementsEnAttente: number;
    totalCommissionsAPayer: number;
    evolutionPourcentage: string;
  };
  evolutionMensuelle: Array<{
    mois: string;
    cliniques: number;
    direct: number;
    total: number;
  }>;
  top5Cliniques: Array<{ nom: string; montant: number }>;
  top5Referents: Array<{ nom: string; montant: number }>;
  dernieresTransactions: Array<{
    id: string;
    montant: number;
    devise: string;
    statut: string;
    datePaiement: string;
    dateCreation: string;
    patient: { prenom: string; nom: string };
    clinique: { nom: string } | null;
    medecin: { prenom: string; nom: string } | null;
  }>;
};

export default function ComptabilitePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch("/api/admin/comptabilite/dashboard");
      if (!response.ok) throw new Error("Erreur chargement");
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        ❌ {error || "Erreur chargement données"}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Comptabilité</h1>
          <p className="text-gray-600 mt-2">
            Suivi financier et validation des commissions
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/comptabilite/rapports"
            className="bg-gray-100 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-flex items-center"
          >
            📊 Rapports
          </Link>
          <Link
            href="/admin/comptabilite/paiements/nouveau"
            className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors inline-flex items-center"
          >
            + Nouveau paiement
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenus mois courant */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Revenus ce mois</h3>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.kpi.revenusMoisCourant.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
          <p
            className={`text-sm mt-2 font-medium ${
              Number(data.kpi.evolutionPourcentage) >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {Number(data.kpi.evolutionPourcentage) >= 0 ? "↗" : "↘"}{" "}
            {Math.abs(Number(data.kpi.evolutionPourcentage))}% vs mois dernier
          </p>
        </div>

        {/* Patients actifs */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Patients actifs</h3>
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.kpi.patientsActifsMois}</p>
          <p className="text-sm text-gray-600 mt-2">Ce mois</p>
        </div>

        {/* Paiements en attente */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">En attente</h3>
            <span className="text-3xl">⏳</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{data.kpi.paiementsEnAttente}</p>
          <p className="text-sm text-gray-600 mt-2">Paiements à recevoir</p>
        </div>

        {/* Commissions à payer */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Commissions</h3>
            <span className="text-3xl">💸</span>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {data.kpi.totalCommissionsAPayer.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
          <p className="text-sm text-gray-600 mt-2">À valider/payer</p>
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/comptabilite/cliniques"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">🏥 Cliniques</h3>
              <p className="text-sm opacity-90">Suivi paiements par clinique</p>
            </div>
            <span className="text-3xl">→</span>
          </div>
        </Link>

        <Link
          href="/admin/comptabilite/medecins"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">👨‍⚕️ Médecins</h3>
              <p className="text-sm opacity-90">Médecins non-affiliés</p>
            </div>
            <span className="text-3xl">→</span>
          </div>
        </Link>

        <Link
          href="/admin/comptabilite/medecins-referents"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">🤝 Référents</h3>
              <p className="text-sm opacity-90">Stats médecins référents</p>
            </div>
            <span className="text-3xl">→</span>
          </div>
        </Link>
      </div>

      {/* Graphique Évolution */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          📈 Évolution des revenus (12 derniers mois)
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Graphique simple avec barres */}
            <div className="space-y-4">
              {data.evolutionMensuelle.map((month, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 w-24">{month.mois}</span>
                    <span className="text-sm text-gray-600">
                      {month.total.toLocaleString("fr-FR")} MAD
                    </span>
                  </div>
                  <div className="flex gap-1 h-8">
                    {/* Cliniques */}
                    <div
                      className="bg-[#4DB8A8] rounded-l transition-all hover:opacity-80"
                      style={{
                        width: `${(month.cliniques / Math.max(...data.evolutionMensuelle.map(m => m.total))) * 100}%`,
                      }}
                      title={`Cliniques: ${month.cliniques.toLocaleString("fr-FR")} MAD`}
                    />
                    {/* Direct */}
                    <div
                      className="bg-[#F59E0B] rounded-r transition-all hover:opacity-80"
                      style={{
                        width: `${(month.direct / Math.max(...data.evolutionMensuelle.map(m => m.total))) * 100}%`,
                      }}
                      title={`Direct: ${month.direct.toLocaleString("fr-FR")} MAD`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#4DB8A8] rounded"></div>
                <span className="text-sm text-gray-600">Cliniques</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#F59E0B] rounded"></div>
                <span className="text-sm text-gray-600">Direct</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top 5 Cliniques */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏥 Top 5 Cliniques (ce mois)
          </h3>
          {data.top5Cliniques.length > 0 ? (
            <div className="space-y-3">
              {data.top5Cliniques.map((clinique, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4DB8A8] text-white flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-gray-900">{clinique.nom}</span>
                  </div>
                  <span className="text-[#4DB8A8] font-bold">
                    {clinique.montant.toLocaleString("fr-FR")} MAD
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
          )}
        </div>

        {/* Top 5 Médecins Référents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🤝 Top 5 Médecins Référents (ce mois)
          </h3>
          {data.top5Referents.length > 0 ? (
            <div className="space-y-3">
              {data.top5Referents.map((referent, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-gray-900">{referent.nom}</span>
                  </div>
                  <span className="text-purple-600 font-bold">
                    {referent.montant.toLocaleString("fr-FR")} MAD
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Dernières transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            📋 Dernières transactions
          </h3>
          <Link
            href="/admin/comptabilite/paiements"
            className="text-[#4DB8A8] hover:text-[#3DA391] text-sm font-medium"
          >
            Voir tout →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clinique/Médecin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.dernieresTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {transaction.patient.prenom} {transaction.patient.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.clinique?.nom || 
                     (transaction.medecin 
                       ? `Dr. ${transaction.medecin.prenom} ${transaction.medecin.nom}` 
                       : "—")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      {transaction.montant.toLocaleString("fr-FR")} {transaction.devise}
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatutBadge(transaction.statut)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.datePaiement
                      ? new Date(transaction.datePaiement).toLocaleDateString("fr-FR")
                      : new Date(transaction.dateCreation).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/comptabilite/paiements/${transaction.id}`}
                      className="text-[#4DB8A8] hover:text-[#3DA391] text-sm font-medium"
                    >
                      Détails →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}