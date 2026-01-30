"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalPatients: number;
  totalRendezVous: number;
  totalSejours: number;
  totalCliniques: number;
};

export default function DashboardPage() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalRendezVous: 0,
    totalSejours: 0,
    totalCliniques: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("admin_user");
    if (userStr) {
      setUtilisateur(JSON.parse(userStr));
      loadStats();
    }
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!utilisateur) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tableau de bord
        </h2>
        <p className="text-gray-600">
          Bienvenue <strong>{utilisateur.prenom} {utilisateur.nom}</strong>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Patients</h3>
            <span className="text-2xl">👥</span>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Rendez-vous</h3>
            <span className="text-2xl">📅</span>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats.totalRendezVous}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Séjours</h3>
            <span className="text-2xl">✈️</span>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats.totalSejours}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Cliniques</h3>
            <span className="text-2xl">🏥</span>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats.totalCliniques}</p>
          )}
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-800 mb-2">
          ✅ Système opérationnel !
        </h3>
        <p className="text-green-700">
          Connecté en tant que <strong>{utilisateur.email}</strong> - Rôle: <strong>{utilisateur.role}</strong>
        </p>
        <p className="text-green-600 mt-2 text-sm">
          L'application fonctionne avec Supabase et est accessible depuis n'importe quel réseau.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <a
          href="/admin/patients"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gérer les patients
          </h3>
          <p className="text-sm text-gray-600">
            Voir, ajouter et modifier les dossiers patients
          </p>
        </a>

        <a
          href="/admin/rendez-vous"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-3">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Planifier un RDV
          </h3>
          <p className="text-sm text-gray-600">
            Créer et gérer les rendez-vous médicaux
          </p>
        </a>

        <a
          href="/admin/sejours"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-3">✈️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Organiser un séjour
          </h3>
          <p className="text-sm text-gray-600">
            Planifier les séjours médicaux complets
          </p>
        </a>
      </div>
    </div>
  );
}