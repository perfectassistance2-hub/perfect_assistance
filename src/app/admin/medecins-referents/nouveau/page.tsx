// app/admin/medecins-referents/nouveau/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NouveauMedecinReferentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    specialite: "",
    etablissement: "",
    ville: "",
    pays: "",
    adresse: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/medecins-referents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      router.push(`/admin/medecins-referents/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="w-full h-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/admin/medecins-referents" className="hover:text-[#4DB8A8]">
            Médecins Référents
          </Link>
          <span>/</span>
          <span className="text-gray-900">Nouveau</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Nouveau médecin référent
        </h1>
        <p className="text-gray-600 mt-2">
          Ajoutez un nouveau médecin référent au système
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations personnelles */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Informations personnelles
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nom"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.nom}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="prenom"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.prenom}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="telephone"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.telephone}
              onChange={handleChange}
            />
          </div>

          {/* Informations professionnelles */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Informations professionnelles
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spécialité
            </label>
            <input
              type="text"
              name="specialite"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.specialite}
              onChange={handleChange}
              placeholder="Ex: Cardiologie, Orthopédie..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Établissement
            </label>
            <input
              type="text"
              name="etablissement"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.etablissement}
              onChange={handleChange}
              placeholder="Ex: Hôpital Central, Clinique..."
            />
          </div>

          {/* Localisation */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Localisation
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pays <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pays"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.pays}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville
            </label>
            <input
              type="text"
              name="ville"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.ville}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse complète
            </label>
            <textarea
              name="adresse"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.adresse}
              onChange={handleChange}
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes / Informations complémentaires
            </label>
            <textarea
              name="notes"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ajoutez des notes ou informations complémentaires..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
          <Link
            href="/admin/medecins-referents"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#4DB8A8] text-white px-8 py-2 rounded-lg hover:bg-[#3DA391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "Créer le médecin référent"}
          </button>
        </div>
      </form>
    </div>
  );
}