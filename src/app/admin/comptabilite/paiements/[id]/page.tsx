// app/admin/comptabilite/paiements/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Paiement = {
  id: string;
  montant: number;
  devise: string;
  statut: string;
  datePaiement: string | null;
  modePaiement: string | null;
  dateCreation: string;
  dateMiseAJour: string;
  commissionClinique: number | null;
  commissionMedecin: number | null;
  commissionMedecinReferent: number | null;
  commissionStatut: string;
  commissionAvance: number;
  commissionDatePaiement: string | null;
  commissionNotes: string | null;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    pays: string;
    ville: string | null;
  };
  clinique: {
    id: string;
    nom: string;
    adresse: string;
    ville: string;
    pays: string;
    telephone: string;
    email: string | null;
  } | null;
  medecin: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
    telephone: string;
    email: string;
  } | null;
  medecinReferent: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string | null;
    email: string;
    telephone: string;
    pays: string;
  } | null;
  sejour: {
    id: string;
    typeTraitement: string;
    descriptionTraitement: string | null;
    dateArrivee: string;
    dateDepart: string;
    dateTraitement: string | null;
    statut: string;
  };
};

export default function DetailsPaiementPage() {
  const params = useParams();
  const router = useRouter();
  const [paiement, setPaiement] = useState<Paiement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionForm, setCommissionForm] = useState({
    commissionStatut: "",
    commissionAvance: "",
    commissionDatePaiement: "",
    commissionNotes: "",
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
      setCommissionForm({
        commissionStatut: data.paiement.commissionStatut || "non_payee",
        commissionAvance: data.paiement.commissionAvance?.toString() || "0",
        commissionDatePaiement: data.paiement.commissionDatePaiement || "",
        commissionNotes: data.paiement.commissionNotes || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/comptabilite/paiements/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionStatut: commissionForm.commissionStatut,
          commissionAvance: Number(commissionForm.commissionAvance),
          commissionDatePaiement: commissionForm.commissionDatePaiement || null,
          commissionNotes: commissionForm.commissionNotes || null,
        }),
      });

      if (!response.ok) throw new Error("Erreur mise à jour");

      alert("Commission mise à jour avec succès ✅");
      setShowCommissionModal(false);
      loadPaiement();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/comptabilite/paiements/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur suppression");

      alert("Paiement supprimé avec succès");
      router.push("/admin/comptabilite/paiements");
    } catch (err: any) {
      alert(err.message);
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
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  const getCommissionBadge = (statut: string) => {
    const styles = {
      non_payee: "bg-red-100 text-red-800",
      avance: "bg-orange-100 text-orange-800",
      payee: "bg-green-100 text-green-800",
    };
    const labels = {
      non_payee: "Non payée",
      avance: "Avance versée",
      payee: "Payée intégralement",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[statut as keyof typeof styles]}`}>
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

  if (error || !paiement) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        ❌ {error || "Paiement non trouvé"}
      </div>
    );
  }

  const totalCommission =
    (paiement.commissionClinique || 0) +
    (paiement.commissionMedecin || 0) +
    (paiement.commissionMedecinReferent || 0);

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
          <span className="text-gray-900">Détails</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💳 Détails du paiement</h1>
            <p className="text-gray-600 mt-2">
              Référence: {paiement.id.substring(0, 8)}...
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/comptabilite/paiements/${paiement.id}/modifier`}
              className="bg-blue-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              ✏️ Modifier
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Infos principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Montant et Statut */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              💰 Informations de paiement
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Montant</p>
                <p className="text-3xl font-bold text-gray-900">
                  {paiement.montant.toLocaleString("fr-FR")} <span className="text-xl text-gray-500">{paiement.devise}</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Statut</p>
                <div className="mt-2">{getStatutBadge(paiement.statut)}</div>
              </div>
              {paiement.datePaiement && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date de paiement</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(paiement.datePaiement).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
              {paiement.modePaiement && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mode de paiement</p>
                  <p className="text-lg font-semibold text-gray-900">{paiement.modePaiement}</p>
                </div>
              )}
            </div>
          </div>

          {/* Patient */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              👤 Patient
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-[#4DB8A8] text-white flex items-center justify-center font-bold text-xl">
                {paiement.patient.prenom[0]}{paiement.patient.nom[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {paiement.patient.prenom} {paiement.patient.nom}
                </h3>
                <p className="text-gray-600">{paiement.patient.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium text-gray-900">{paiement.patient.telephone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Localisation</p>
                <p className="font-medium text-gray-900">
                  {paiement.patient.ville ? `${paiement.patient.ville}, ` : ""}{paiement.patient.pays}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href={`/admin/patients/${paiement.patient.id}`}
                className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
              >
                Voir le profil complet →
              </Link>
            </div>
          </div>

          {/* Séjour */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ✈️ Détails du séjour
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Type de traitement</p>
                <p className="text-lg font-semibold text-gray-900">{paiement.sejour.typeTraitement}</p>
              </div>
              {paiement.sejour.descriptionTraitement && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{paiement.sejour.descriptionTraitement}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date d'arrivée</p>
                  <p className="font-medium text-gray-900">
                    {new Date(paiement.sejour.dateArrivee).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de départ</p>
                  <p className="font-medium text-gray-900">
                    {new Date(paiement.sejour.dateDepart).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              {paiement.sejour.dateTraitement && (
                <div>
                  <p className="text-sm text-gray-600">Date du traitement</p>
                  <p className="font-medium text-gray-900">
                    {new Date(paiement.sejour.dateTraitement).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link
                href={`/admin/sejours/${paiement.sejour.id}`}
                className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
              >
                Voir le séjour complet →
              </Link>
            </div>
          </div>

          {/* Clinique */}
          {paiement.clinique && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🏥 Clinique
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nom</p>
                  <p className="text-xl font-bold text-gray-900">{paiement.clinique.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Adresse</p>
                  <p className="text-gray-900">
                    {paiement.clinique.adresse}<br />
                    {paiement.clinique.ville}, {paiement.clinique.pays}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-medium text-gray-900">{paiement.clinique.telephone}</p>
                  </div>
                  {paiement.clinique.email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{paiement.clinique.email}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/admin/cliniques/${paiement.clinique.id}`}
                  className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
                >
                  Voir la clinique →
                </Link>
              </div>
            </div>
          )}

          {/* Médecin */}
          {paiement.medecin && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                👨‍⚕️ Médecin traitant
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nom</p>
                  <p className="text-xl font-bold text-gray-900">
                    Dr. {paiement.medecin.prenom} {paiement.medecin.nom}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Spécialité</p>
                  <p className="font-medium text-gray-900">{paiement.medecin.specialite}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-medium text-gray-900">{paiement.medecin.telephone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{paiement.medecin.email}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/admin/medecins/${paiement.medecin.id}`}
                  className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
                >
                  Voir le médecin →
                </Link>
              </div>
            </div>
          )}

          {/* Médecin Référent */}
          {paiement.medecinReferent && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🤝 Médecin référent
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nom</p>
                  <p className="text-xl font-bold text-gray-900">
                    Dr. {paiement.medecinReferent.prenom} {paiement.medecinReferent.nom}
                  </p>
                </div>
                {paiement.medecinReferent.specialite && (
                  <div>
                    <p className="text-sm text-gray-600">Spécialité</p>
                    <p className="font-medium text-gray-900">{paiement.medecinReferent.specialite}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-medium text-gray-900">{paiement.medecinReferent.telephone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{paiement.medecinReferent.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pays</p>
                  <p className="font-medium text-gray-900">{paiement.medecinReferent.pays}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/admin/medecins-referents/${paiement.medecinReferent.id}`}
                  className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
                >
                  Voir le médecin référent →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite - Commissions */}
        <div className="space-y-6">
          {/* Récapitulatif Commission */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              💸 Commissions
            </h2>

            <div className="space-y-4">
              {/* Total */}
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total commissions</p>
                <p className="text-3xl font-bold text-purple-600">
                  {totalCommission.toLocaleString("fr-FR")} MAD
                </p>
              </div>

              {/* Détail */}
              <div className="space-y-3">
                {paiement.commissionClinique && paiement.commissionClinique > 0 && (
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Clinique</span>
                    <span className="font-semibold text-gray-900">
                      {paiement.commissionClinique.toLocaleString("fr-FR")} MAD
                    </span>
                  </div>
                )}
                {paiement.commissionMedecin && paiement.commissionMedecin > 0 && (
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Médecin</span>
                    <span className="font-semibold text-gray-900">
                      {paiement.commissionMedecin.toLocaleString("fr-FR")} MAD
                    </span>
                  </div>
                )}
                {paiement.commissionMedecinReferent && paiement.commissionMedecinReferent > 0 && (
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Médecin référent</span>
                    <span className="font-semibold text-gray-900">
                      {paiement.commissionMedecinReferent.toLocaleString("fr-FR")} MAD
                    </span>
                  </div>
                )}
              </div>

              {/* Statut */}
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Statut</p>
                {getCommissionBadge(paiement.commissionStatut)}
              </div>

              {/* Avance */}
              {paiement.commissionAvance > 0 && (
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Avance versée</p>
                  <p className="text-xl font-bold text-orange-600">
                    {paiement.commissionAvance.toLocaleString("fr-FR")} MAD
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Reste: {(totalCommission - paiement.commissionAvance).toLocaleString("fr-FR")} MAD
                  </p>
                </div>
              )}

              {/* Date paiement */}
              {paiement.commissionDatePaiement && (
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Date de paiement</p>
                  <p className="font-medium text-gray-900">
                    {new Date(paiement.commissionDatePaiement).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}

              {/* Notes */}
              {paiement.commissionNotes && (
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-sm text-gray-900">{paiement.commissionNotes}</p>
                </div>
              )}

              {/* Bouton validation */}
              <button
                onClick={() => setShowCommissionModal(true)}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                ✅ Valider le paiement
              </button>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-3">📅 Métadonnées</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Créé le:</span>
                <p className="font-medium text-gray-900">
                  {new Date(paiement.dateCreation).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Modifié le:</span>
                <p className="font-medium text-gray-900">
                  {new Date(paiement.dateMiseAJour).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Validation Commission */}
      {showCommissionModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCommissionModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                💸 Valider la commission
              </h3>
              <form onSubmit={handleUpdateCommission}>
                <div className="space-y-4">
                  {/* Statut */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={commissionForm.commissionStatut}
                      onChange={(e) =>
                        setCommissionForm({ ...commissionForm, commissionStatut: e.target.value })
                      }
                    >
                      <option value="non_payee">Non payée</option>
                      <option value="avance">Avance versée</option>
                      <option value="payee">Payée intégralement</option>
                    </select>
                  </div>

                  {/* Avance */}
                  {commissionForm.commissionStatut === "avance" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Montant de l'avance (MAD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={totalCommission}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={commissionForm.commissionAvance}
                        onChange={(e) =>
                          setCommissionForm({ ...commissionForm, commissionAvance: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max: {totalCommission.toLocaleString("fr-FR")} MAD
                      </p>
                    </div>
                  )}

                  {/* Date */}
                  {commissionForm.commissionStatut !== "non_payee" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de paiement
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={commissionForm.commissionDatePaiement}
                        onChange={(e) =>
                          setCommissionForm({
                            ...commissionForm,
                            commissionDatePaiement: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optionnel)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Informations complémentaires..."
                      value={commissionForm.commissionNotes}
                      onChange={(e) =>
                        setCommissionForm({ ...commissionForm, commissionNotes: e.target.value })
                      }
                    />
                  </div>

                  {/* Récapitulatif */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Récapitulatif</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total commission:</span>
                        <span className="font-bold text-gray-900">
                          {totalCommission.toLocaleString("fr-FR")} MAD
                        </span>
                      </div>
                      {commissionForm.commissionStatut === "avance" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avance:</span>
                            <span className="font-semibold text-orange-600">
                              {Number(commissionForm.commissionAvance).toLocaleString("fr-FR")} MAD
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-purple-200">
                            <span className="text-gray-600">Reste à payer:</span>
                            <span className="font-bold text-purple-600">
                              {(totalCommission - Number(commissionForm.commissionAvance)).toLocaleString("fr-FR")} MAD
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCommissionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}