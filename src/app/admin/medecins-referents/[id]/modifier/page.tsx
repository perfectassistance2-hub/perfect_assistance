// app/admin/medecins-referents/[id]/modifier/page.tsx

"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  adresse: string | null;
  notes: string | null;
  estactif: boolean;
};

export default function ModifierMedecinReferentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    specialite: "",
    etablissement: "",
    ville: "",
    pays: "France",
    adresse: "",
    notes: "",
    estactif: true,
  });

  useEffect(() => {
    loadMedecin();
  }, [resolvedParams.id]);

  const loadMedecin = async () => {
    try {
      const response = await fetch(`/api/admin/medecins-referents/${resolvedParams.id}`);
      
      if (!response.ok) {
        throw new Error("Médecin référent non trouvé");
      }

      const data: MedecinReferent = await response.json();
      
      setFormData({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        specialite: data.specialite || "",
        etablissement: data.etablissement || "",
        ville: data.ville || "",
        pays: data.pays,
        adresse: data.adresse || "",
        notes: data.notes || "",
        estactif: data.estactif,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/medecins-referents/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          specialite: formData.specialite || null,
          etablissement: formData.etablissement || null,
          ville: formData.ville || null,
          adresse: formData.adresse || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la modification");
      }

      router.push(`/admin/medecins-referents/${resolvedParams.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  if (error && !formData.nom) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl mb-4">❌ {error}</div>
        <Link
          href="/admin/medecins-referents"
          className="text-[#4DB8A8] hover:text-[#3DA391]"
        >
          ← Retour aux médecins référents
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/admin/medecins-referents" className="hover:text-[#4DB8A8]">
            Médecins Référents
          </Link>
          <span>/</span>
          <Link
            href={`/admin/medecins-referents/${resolvedParams.id}`}
            className="hover:text-[#4DB8A8]"
          >
            Dr. {formData.prenom} {formData.nom}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Modifier</span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          ✏️ Modifier le médecin référent
        </h1>
        <p className="text-gray-600 mt-2">
          Modifiez les informations du Dr. {formData.prenom} {formData.nom}
        </p>
      </div>

      {/* Alerte d'erreur */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Informations personnelles */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              👤 Informations personnelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📞 Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🏥 Informations professionnelles
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialité
                </label>
                <input
                  type="text"
                  name="specialite"
                  value={formData.specialite}
                  onChange={handleChange}
                  placeholder="Ex: Cardiologie, Médecine générale..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Établissement
                </label>
                <input
                  type="text"
                  name="etablissement"
                  value={formData.etablissement}
                  onChange={handleChange}
                  placeholder="Nom de l'hôpital, clinique, cabinet..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="pays"
                    value={formData.pays}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  >
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Canada">Canada</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse complète
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  placeholder="Numéro, rue, code postal..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📝 Notes
            </h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Notes internes, particularités, préférences..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
            />
          </div>

          {/* Statut */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ⚙️ Statut
            </h2>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="estactif"
                checked={formData.estactif}
                onChange={handleChange}
                className="w-5 h-5 text-[#4DB8A8] border-gray-300 rounded focus:ring-[#4DB8A8]"
              />
              <span className="text-sm text-gray-700">
                Médecin référent actif (peut recevoir de nouveaux patients)
              </span>
            </label>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Link
              href={`/admin/medecins-referents/${resolvedParams.id}`}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Enregistrement..." : "💾 Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}