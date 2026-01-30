// app/admin/medecins-referents/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MedecinReferent = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string | null;
  etablissement: string | null;
  ville: string | null;
  pays: string;
  estActif: boolean;
  dateCreation: string;
  _count?: {
    patients: number;
  };
};

export default function MedecinsReferentsPage() {
  const [medecins, setMedecins] = useState<MedecinReferent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActif, setFilterActif] = useState<string>("TOUS");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadMedecins();
  }, []);

  const loadMedecins = async () => {
    try {
      const response = await fetch("/api/admin/medecins-referents");
      if (response.ok) {
        const data = await response.json();
        setMedecins(data);
      }
    } catch (error) {
      console.error("Erreur chargement médecins référents:", error);
      setError("Erreur lors du chargement des médecins référents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (medecinId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce médecin référent ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/medecins-referents/${medecinId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      setSuccess("Médecin référent supprimé avec succès");
      loadMedecins();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const toggleActif = async (medecinId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/medecins-referents/${medecinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estActif: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification");
      }

      setSuccess(`Médecin référent ${!currentStatus ? "activé" : "désactivé"} avec succès`);
      loadMedecins();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const filteredMedecins = medecins.filter((medecin) => {
    const matchSearch =
      medecin.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medecin.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medecin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medecin.telephone.includes(searchTerm) ||
      (medecin.etablissement &&
        medecin.etablissement.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchActif =
      filterActif === "TOUS" ||
      (filterActif === "ACTIF" && medecin.estActif) ||
      (filterActif === "INACTIF" && !medecin.estActif);

    return matchSearch && matchActif;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Médecins Référents</h1>
          <p className="text-gray-600 mt-2">
            {filteredMedecins.length} médecin{filteredMedecins.length > 1 ? "s" : ""} au
            total
          </p>
        </div>
        <Link
          href="/admin/medecins-referents/nouveau"
          className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors inline-flex items-center justify-center"
        >
          + Nouveau médecin référent
        </Link>
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

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Nom, email, téléphone, établissement..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={filterActif}
              onChange={(e) => setFilterActif(e.target.value)}
            >
              <option value="TOUS">Tous</option>
              <option value="ACTIF">Actifs</option>
              <option value="INACTIF">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredMedecins.map((medecin) => (
          <div
            key={medecin.id}
            className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 ${
              !medecin.estActif ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#4DB8A8] text-white flex items-center justify-center font-bold text-lg">
                  {medecin.prenom[0]}
                  {medecin.nom[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Dr. {medecin.prenom} {medecin.nom}
                  </h3>
                  {medecin.specialite && (
                    <p className="text-sm text-gray-500">{medecin.specialite}</p>
                  )}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  medecin.estActif
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {medecin.estActif ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">📧</span>
                <span className="truncate">{medecin.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">📞</span>
                <span>{medecin.telephone}</span>
              </div>
              {medecin.etablissement && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🏥</span>
                  <span className="truncate">{medecin.etablissement}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">🌍</span>
                <span>
                  {medecin.pays}
                  {medecin.ville ? ` - ${medecin.ville}` : ""}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#4DB8A8]/10 to-[#4DB8A8]/5 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#4DB8A8]">
                    {medecin._count?.patients || 0}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Patient{(medecin._count?.patients || 0) > 1 ? "s" : ""} envoyé
                    {(medecin._count?.patients || 0) > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Link
                href={`/admin/medecins-referents/${medecin.id}`}
                className="flex-1 bg-[#4DB8A8] text-white text-center py-2 rounded-lg hover:bg-[#3DA391] transition-colors text-sm font-medium"
              >
                Voir détails
              </Link>
              <button
                onClick={() => toggleActif(medecin.id, medecin.estActif)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  medecin.estActif
                    ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {medecin.estActif ? "⏸️" : "▶️"}
              </button>
              <button
                onClick={() => handleDelete(medecin.id)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMedecins.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun médecin référent trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterActif !== "TOUS"
              ? "Essayez de modifier vos filtres"
              : "Commencez par ajouter un nouveau médecin référent"}
          </p>
          {!searchTerm && filterActif === "TOUS" && (
            <Link
              href="/admin/medecins-referents/nouveau"
              className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors"
            >
              + Ajouter un médecin référent
            </Link>
          )}
        </div>
      )}
    </div>
  );
}