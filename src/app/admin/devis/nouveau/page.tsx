"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Patient = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
};

type Sejour = {
  id: string;
  typeTraitement: string;
  dateArrivee: string;
};

type Article = {
  id: string;
  designation: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
};

export default function NouveauDevisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  const [formData, setFormData] = useState({
    patientId: preselectedPatientId || "",
    sejourId: "",
    devise: "MAD",
    taxe: 0,
    valideJusquau: "",
  });

  useEffect(() => {
    loadPatients();
    if (preselectedPatientId) {
      loadSejoursByPatient(preselectedPatientId);
    }
  }, []);

  const loadPatients = async () => {
    try {
      const response = await fetch("/api/admin/patients");
      if (response.ok) {
        setPatients(await response.json());
      }
    } catch (error) {
      console.error("Erreur chargement patients:", error);
    }
  };

  const loadSejoursByPatient = async (patientId: string) => {
    try {
      const response = await fetch(`/api/admin/sejours?patientId=${patientId}`);
      if (response.ok) {
        setSejours(await response.json());
      }
    } catch (error) {
      console.error("Erreur chargement séjours:", error);
    }
  };

  const handlePatientChange = (patientId: string) => {
    setFormData({ ...formData, patientId, sejourId: "" });
    if (patientId) {
      loadSejoursByPatient(patientId);
    } else {
      setSejours([]);
    }
  };

  const addArticle = () => {
    setArticles([
      ...articles,
      {
        id: Date.now().toString(),
        designation: "",
        description: "",
        quantite: 1,
        prixUnitaire: 0,
        sousTotal: 0,
      },
    ]);
  };

  const updateArticle = (id: string, field: string, value: any) => {
    setArticles(
      articles.map((a) => {
        if (a.id === id) {
          const updated = { ...a, [field]: value };
          if (field === "quantite" || field === "prixUnitaire") {
            updated.sousTotal = updated.quantite * updated.prixUnitaire;
          }
          return updated;
        }
        return a;
      })
    );
  };

  const removeArticle = (id: string) => {
    setArticles(articles.filter((a) => a.id !== id));
  };

  const calculateTotals = () => {
    const sousTotal = articles.reduce((sum, a) => sum + a.sousTotal, 0);
    const taxe = formData.taxe;
    const total = sousTotal + taxe;
    return { sousTotal, taxe, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (articles.length === 0) {
      setError("Veuillez ajouter au moins un article");
      return;
    }

    if (articles.some((a) => !a.designation || a.prixUnitaire === 0)) {
      setError("Tous les articles doivent avoir une désignation et un prix");
      return;
    }

    setLoading(true);

    try {
      const { sousTotal, total } = calculateTotals();

      const response = await fetch("/api/admin/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          sejourId: formData.sejourId || null,
          articles: articles.map(({ id, ...rest }) => rest),
          sousTotal,
          total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      setSuccess("Devis créé avec succès !");
      setTimeout(() => {
        router.push(`/admin/devis/${data.devis.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { sousTotal, taxe, total } = calculateTotals();

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/devis"
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour aux devis
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau devis</h1>
        <p className="text-gray-600">Créer un devis pour un patient</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient et Séjour */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Patient et Séjour
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.patientId}
                onChange={(e) => handlePatientChange(e.target.value)}
              >
                <option value="">Sélectionner un patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Séjour associé (optionnel)
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.sejourId}
                onChange={(e) => setFormData({ ...formData, sejourId: e.target.value })}
                disabled={!formData.patientId}
              >
                <option value="">Aucun séjour</option>
                {sejours.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.typeTraitement} - {new Date(s.dateArrivee).toLocaleDateString("fr-FR")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Articles</h2>
            <button
              type="button"
              onClick={addArticle}
              className="px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
            >
              + Ajouter un article
            </button>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun article. Cliquez sur "Ajouter un article" pour commencer.
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article, index) => (
                <div key={article.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Article {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeArticle(article.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Désignation <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                        value={article.designation}
                        onChange={(e) => updateArticle(article.id, "designation", e.target.value)}
                        placeholder="Ex: Consultation initiale"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optionnel)
                      </label>
                      <textarea
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8] resize-none"
                        value={article.description}
                        onChange={(e) => updateArticle(article.id, "description", e.target.value)}
                        placeholder="Détails de l'article..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                        value={article.quantite}
                        onChange={(e) => updateArticle(article.id, "quantite", Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix unitaire ({formData.devise}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                        value={article.prixUnitaire}
                        onChange={(e) => updateArticle(article.id, "prixUnitaire", Number(e.target.value))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-700">
                          Sous-total: <span className="font-bold">{article.sousTotal.toLocaleString()} {formData.devise}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totaux et Paramètres */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Paramètres et Totaux
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devise <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.devise}
                onChange={(e) => setFormData({ ...formData, devise: e.target.value })}
              >
                <option value="MAD">MAD (Dirham marocain)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxe ({formData.devise})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.taxe}
                onChange={(e) => setFormData({ ...formData, taxe: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valide jusqu'au <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.valideJusquau}
                onChange={(e) => setFormData({ ...formData, valideJusquau: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sous-total:</span>
              <span className="font-medium">{sousTotal.toLocaleString()} {formData.devise}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxe:</span>
              <span className="font-medium">{taxe.toLocaleString()} {formData.devise}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold pt-2 border-t border-gray-300">
              <span>TOTAL:</span>
              <span className="text-[#4DB8A8]">{total.toLocaleString()} {formData.devise}</span>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/devis")}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || articles.length === 0}
            className="flex-1 px-6 py-3 bg-[#4DB8A8] hover:bg-[#3DA391] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "💾 Créer le devis"}
          </button>
        </div>
      </form>
    </div>
  );
}