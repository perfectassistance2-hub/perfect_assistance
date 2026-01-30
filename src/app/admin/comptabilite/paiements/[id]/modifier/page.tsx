// app/admin/comptabilite/paiements/[id]/modifier/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Paiement = {
  id: string;
  sejourId: string;
  patientId: string;
  cliniqueId: string | null;
  medecinId: string | null;
  medecinReferentId: string | null;
  montant: number;
  devise: string;
  statut: string;
  datePaiement: string | null;
  modePaiement: string | null;
  commissionClinique: number | null;
  commissionMedecin: number | null;
  commissionMedecinReferent: number | null;
  patient: { prenom: string; nom: string };
  sejour: { typeTraitement: string };
};

export default function ModifierPaiementPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [paiement, setPaiement] = useState<Paiement | null>(null);

  const [formData, setFormData] = useState({
    montant: "",
    devise: "MAD",
    statut: "en_attente",
    datePaiement: "",
    modePaiement: "",
    commissionClinique: "",
    commissionMedecin: "",
    commissionMedecinReferent: "",
  });

  useEffect(() => {
    if (params.id) {
      loadPaiement();
    }
  }, [params.id]);

  const loadPaiement = async () => {
    try {
      const response = await fetch(`/api/admin/comptabilite/paiements/${params.id}`);
      if (!response.ok) throw new Error("Paiement non trouvé");
      const data = await response.json();
      setPaiement(data.paiement);

      // Pré-remplir le formulaire
      setFormData({
        montant: data.paiement.montant.toString(),
        devise: data.paiement.devise,
        statut: data.paiement.statut,
        datePaiement: data.paiement.datePaiement || "",
        modePaiement: data.paiement.modePaiement || "",
        commissionClinique: data.paiement.commissionClinique?.toString() || "",
        commissionMedecin: data.paiement.commissionMedecin?.toString() || "",
        commissionMedecinReferent: data.paiement.commissionMedecinReferent?.toString() || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/comptabilite/paiements/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: Number(formData.montant),
          devise: formData.devise,
          statut: formData.statut,
          datePaiement: formData.datePaiement || null,
          modePaiement: formData.modePaiement || null,
          commissionClinique: formData.commissionClinique
            ? Number(formData.commissionClinique)
            : null,
          commissionMedecin: formData.commissionMedecin
            ? Number(formData.commissionMedecin)
            : null,
          commissionMedecinReferent: formData.commissionMedecinReferent
            ? Number(formData.commissionMedecinReferent)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la modification");
      }

      router.push(`/admin/comptabilite/paiements/${params.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  if (error && !paiement) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        ❌ {error}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/admin/comptabilite" className="hover:text-[#4DB8A8]">
            Comptabilité
          </Link>
          <span>/</span>
          <Link href="/admin/comptabilite/paiements" className="hover:text-[#4DB8A8]">
            Paiements
          </Link>
          <span>/</span>
          <Link
            href={`/admin/comptabilite/paiements/${params.id}`}
            className="hover:text-[#4DB8A8]"
          >
            {paiement?.id.substring(0, 8)}...
          </Link>
          <span>/</span>
          <span className="text-gray-900">Modifier</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">✏️ Modifier le paiement</h1>
        {paiement && (
          <p className="text-gray-600 mt-2">
            Patient: {paiement.patient.prenom} {paiement.patient.nom} - {paiement.sejour.typeTraitement}
          </p>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Info importante */}
      <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
        ℹ️ <strong>Note :</strong> Vous ne pouvez pas modifier le séjour ou le patient associé. 
        Pour cela, créez un nouveau paiement.
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ===== MONTANT ===== */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              💰 Montant du paiement
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="montant"
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.montant}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Devise
            </label>
            <select
              name="devise"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.devise}
              onChange={handleChange}
            >
              <option value="MAD">MAD (Dirham marocain)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar américain)</option>
            </select>
          </div>

          {/* ===== STATUT PAIEMENT ===== */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              📊 Statut du paiement
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut <span className="text-red-500">*</span>
            </label>
            <select
              name="statut"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.statut}
              onChange={handleChange}
            >
              <option value="en_attente">En attente</option>
              <option value="payé">Payé</option>
              <option value="annulé">Annulé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de paiement
            </label>
            <input
              type="date"
              name="datePaiement"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.datePaiement}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.statut === "payé"
                ? "Obligatoire si le statut est 'Payé'"
                : "Laissez vide si le paiement est en attente"}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de paiement
            </label>
            <select
              name="modePaiement"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.modePaiement}
              onChange={handleChange}
            >
              <option value="">Sélectionner</option>
              <option value="Carte bancaire">Carte bancaire</option>
              <option value="Virement">Virement bancaire</option>
              <option value="Espèces">Espèces</option>
              <option value="Chèque">Chèque</option>
              <option value="PayPal">PayPal</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* ===== COMMISSIONS ===== */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              💸 Commissions
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Modifier les montants de commission si nécessaire
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission clinique (MAD)
            </label>
            <input
              type="number"
              name="commissionClinique"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.commissionClinique}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission médecin (MAD)
            </label>
            <input
              type="number"
              name="commissionMedecin"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.commissionMedecin}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission médecin référent (MAD)
            </label>
            <input
              type="number"
              name="commissionMedecinReferent"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.commissionMedecinReferent}
              onChange={handleChange}
            />
          </div>

          {/* Total commissions */}
          {(formData.commissionClinique || formData.commissionMedecin || formData.commissionMedecinReferent) && (
            <div className="md:col-span-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total commissions:</span>
                <span className="text-2xl font-bold text-purple-600">
                  {(
                    Number(formData.commissionClinique || 0) +
                    Number(formData.commissionMedecin || 0) +
                    Number(formData.commissionMedecinReferent || 0)
                  ).toLocaleString("fr-FR")}{" "}
                  MAD
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ===== BOUTONS ===== */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
          <Link
            href={`/admin/comptabilite/paiements/${params.id}`}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#4DB8A8] text-white px-8 py-2 rounded-lg hover:bg-[#3DA391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>

      {/* Note validation commission */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>Astuce :</strong> Pour valider le paiement de la commission (avance ou total), 
          rendez-vous sur la{" "}
          <Link
            href={`/admin/comptabilite/paiements/${params.id}`}
            className="font-semibold underline hover:text-yellow-900"
          >
            page de détails
          </Link>{" "}
          et cliquez sur "Valider le paiement".
        </p>
      </div>
    </div>
  );
}