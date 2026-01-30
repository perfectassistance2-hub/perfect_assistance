// app/admin/comptabilite/paiements/nouveau/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Sejour = {
  id: string;
  typeTraitement: string;
  dateArrivee: string;
  patientId: string;
  cliniqueId: string | null;
  medecinId: string | null;
  patient: { prenom: string; nom: string };
  clinique: { nom: string } | null;
  medecin: { prenom: string; nom: string } | null;
};

export default function NouveauPaiementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSejours, setLoadingSejours] = useState(true);
  const [error, setError] = useState("");
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [sejourSelectionne, setSejourSelectionne] = useState<Sejour | null>(null);

  const [formData, setFormData] = useState({
    sejourId: "",
    patientId: "",
    cliniqueId: "",
    medecinId: "",
    medecinReferentId: "",
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
    loadSejoursSansPaiement();
  }, []);

  const loadSejoursSansPaiement = async () => {
    try {
      // Charger tous les séjours
      const responseSejours = await fetch("/api/admin/sejours");
      if (!responseSejours.ok) throw new Error("Erreur chargement séjours");
      const dataSejours = await responseSejours.json();

      // Charger tous les paiements
      const responsePaiements = await fetch("/api/admin/comptabilite/paiements");
      if (!responsePaiements.ok) throw new Error("Erreur chargement paiements");
      const dataPaiements = await responsePaiements.json();

      // IDs des séjours déjà payés
      const sejoursPayes = new Set(dataPaiements.paiements.map((p: any) => p.sejourId));

      // Filtrer les séjours sans paiement
      const sejoursSansPaiement = dataSejours.filter(
        (s: Sejour) => !sejoursPayes.has(s.id)
      );

      setSejours(sejoursSansPaiement);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSejours(false);
    }
  };

  const handleSejourChange = (sejourId: string) => {
    const sejour = sejours.find((s) => s.id === sejourId);
    if (sejour) {
      setSejourSelectionne(sejour);
      setFormData({
        ...formData,
        sejourId: sejour.id,
        patientId: sejour.patientId,
        cliniqueId: sejour.cliniqueId || "",
        medecinId: sejour.medecinId || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/comptabilite/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          montant: Number(formData.montant),
          commissionClinique: formData.commissionClinique
            ? Number(formData.commissionClinique)
            : null,
          commissionMedecin: formData.commissionMedecin
            ? Number(formData.commissionMedecin)
            : null,
          commissionMedecinReferent: formData.commissionMedecinReferent
            ? Number(formData.commissionMedecinReferent)
            : null,
          datePaiement: formData.datePaiement || null,
          modePaiement: formData.modePaiement || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      router.push(`/admin/comptabilite/paiements/${data.paiement.id}`);
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

  if (loadingSejours) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
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
          <span className="text-gray-900">Nouveau</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">💳 Nouveau paiement</h1>
        <p className="text-gray-600 mt-2">
          Enregistrer un paiement pour un séjour patient
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {sejours.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-8 rounded-lg text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Aucun séjour disponible</h3>
          <p className="mb-4">
            Tous les séjours ont déjà un paiement enregistré ou il n'y a aucun séjour créé.
          </p>
          <Link
            href="/admin/sejours/nouveau"
            className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors"
          >
            + Créer un séjour
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ===== SÉJOUR ===== */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
                🏥 Sélection du séjour
              </h2>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Séjour <span className="text-red-500">*</span>
              </label>
              <select
                name="sejourId"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.sejourId}
                onChange={(e) => handleSejourChange(e.target.value)}
              >
                <option value="">Sélectionner un séjour</option>
                {sejours.map((sejour) => (
                  <option key={sejour.id} value={sejour.id}>
                    {sejour.patient.prenom} {sejour.patient.nom} - {sejour.typeTraitement} 
                    {sejour.clinique && ` (${sejour.clinique.nom})`}
                    {" "}(Arrivée: {new Date(sejour.dateArrivee).toLocaleDateString("fr-FR")})
                  </option>
                ))}
              </select>
            </div>

            {/* Infos séjour sélectionné */}
            {sejourSelectionne && (
              <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Informations du séjour</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Patient:</span>{" "}
                    <span className="font-medium">
                      {sejourSelectionne.patient.prenom} {sejourSelectionne.patient.nom}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Traitement:</span>{" "}
                    <span className="font-medium">{sejourSelectionne.typeTraitement}</span>
                  </div>
                  {sejourSelectionne.clinique && (
                    <div>
                      <span className="text-gray-600">Clinique:</span>{" "}
                      <span className="font-medium">{sejourSelectionne.clinique.nom}</span>
                    </div>
                  )}
                  {sejourSelectionne.medecin && (
                    <div>
                      <span className="text-gray-600">Médecin:</span>{" "}
                      <span className="font-medium">
                        Dr. {sejourSelectionne.medecin.prenom} {sejourSelectionne.medecin.nom}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== MONTANT ===== */}
            <div className="md:col-span-2 mt-4">
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
                placeholder="0.00"
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
                Statut
              </label>
              <select
                name="statut"
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
                Laissez vide si le paiement est en attente
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

            {/* ===== COMMISSIONS (OPTIONNEL) ===== */}
            <div className="md:col-span-2 mt-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
                💸 Commissions (optionnel)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Ces montants peuvent être calculés plus tard. Vous pouvez les laisser vides pour l'instant.
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
          </div>

          {/* ===== BOUTONS ===== */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Link
              href="/admin/comptabilite/paiements"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.sejourId}
              className="bg-[#4DB8A8] text-white px-8 py-2 rounded-lg hover:bg-[#3DA391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Création..." : "Créer le paiement"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}