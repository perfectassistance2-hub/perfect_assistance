// app/admin/medecins-referents/[id]/page.tsx

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
  datecreation: string;
  datemiseajour: string;
  patients?: Array<{
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    statut: string;
    dateCreation: string;
  }>;
};

export default function DetailMedecinReferentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [medecin, setMedecin] = useState<MedecinReferent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadMedecin();
  }, [resolvedParams.id]);

  const loadMedecin = async () => {
    try {
      const response = await fetch(`/api/admin/medecins-referents/${resolvedParams.id}`);
      
      if (!response.ok) {
        throw new Error("Médecin référent non trouvé");
      }

      const data = await response.json();
      setMedecin(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActif = async () => {
    if (!medecin) return;

    try {
      const response = await fetch(`/api/admin/medecins-referents/${medecin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estactif: !medecin.estactif }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification");
      }

      setSuccess(`Médecin référent ${!medecin.estactif ? "activé" : "désactivé"} avec succès`);
      loadMedecin();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async () => {
    if (!medecin) return;

    const nbPatients = medecin.patients?.length || 0;
    const confirmMsg = nbPatients > 0
      ? `Attention : Ce médecin référent a ${nbPatients} patient(s) lié(s). Ces patients seront détachés. Continuer ?`
      : "Êtes-vous sûr de vouloir supprimer ce médecin référent ?";

    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch(`/api/admin/medecins-referents/${medecin.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      alert("Médecin référent supprimé avec succès");
      router.push("/admin/medecins-referents");
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  if (error && !medecin) {
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

  if (!medecin) return null;

  return (
    <div className="w-full h-full">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/admin/medecins-referents" className="hover:text-[#4DB8A8]">
            Médecins Référents
          </Link>
          <span>/</span>
          <span className="text-gray-900">
            Dr. {medecin.prenom} {medecin.nom}
          </span>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✅ {success}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] rounded-lg shadow-lg p-8 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
              {medecin.prenom[0]}{medecin.nom[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Dr. {medecin.prenom} {medecin.nom}
              </h1>
              {medecin.specialite && (
                <p className="text-white/80 text-lg">{medecin.specialite}</p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  medecin.estactif
                    ? "bg-green-500/20 text-white border border-white/30"
                    : "bg-gray-500/20 text-white border border-white/30"
                }`}>
                  {medecin.estactif ? "Actif" : "Inactif"}
                </span>
                <span className="text-white/60 text-sm">
                  Créé le {new Date(medecin.datecreation).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Link
              href={`/admin/medecins-referents/${medecin.id}/modifier`}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              ✏️ Modifier
            </Link>
            <button
              onClick={handleToggleActif}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              {medecin.estactif ? "⏸️ Désactiver" : "▶️ Activer"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📞 Informations de contact
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="w-24 text-sm text-gray-600">Email :</span>
                <a href={`mailto:${medecin.email}`} className="text-[#4DB8A8] hover:underline">
                  {medecin.email}
                </a>
              </div>
              <div className="flex items-center">
                <span className="w-24 text-sm text-gray-600">Téléphone :</span>
                <a href={`tel:${medecin.telephone}`} className="text-gray-900">
                  {medecin.telephone}
                </a>
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🏥 Informations professionnelles
            </h2>
            <div className="space-y-3">
              {medecin.etablissement && (
                <div className="flex">
                  <span className="w-32 text-sm text-gray-600">Établissement :</span>
                  <span className="text-gray-900">{medecin.etablissement}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Pays :</span>
                <span className="text-gray-900">{medecin.pays}</span>
              </div>
              {medecin.ville && (
                <div className="flex">
                  <span className="w-32 text-sm text-gray-600">Ville :</span>
                  <span className="text-gray-900">{medecin.ville}</span>
                </div>
              )}
              {medecin.adresse && (
                <div className="flex">
                  <span className="w-32 text-sm text-gray-600">Adresse :</span>
                  <span className="text-gray-900">{medecin.adresse}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {medecin.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📝 Notes
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{medecin.notes}</p>
            </div>
          )}

          {/* Patients liés */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              👥 Patients envoyés ({medecin.patients?.length || 0})
            </h2>
            {medecin.patients && medecin.patients.length > 0 ? (
              <div className="space-y-3">
                {medecin.patients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/admin/patients/${patient.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-[#4DB8A8] hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient.prenom} {patient.nom}
                        </p>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(patient.dateCreation).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aucun patient envoyé par ce médecin référent
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Statistiques</h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-[#4DB8A8]/10 rounded-lg">
                <div className="text-3xl font-bold text-[#4DB8A8]">
                  {medecin.patients?.length || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Patient{(medecin.patients?.length || 0) > 1 ? "s" : ""} envoyé{(medecin.patients?.length || 0) > 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Actions rapides</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${medecin.email}`}
                className="block w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-center"
              >
                ✉️ Envoyer un email
              </a>
              <a
                href={`tel:${medecin.telephone}`}
                className="block w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-center"
              >
                📞 Appeler
              </a>
            </div>
          </div>

          {/* Zone dangereuse */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">⚠️ Zone dangereuse</h3>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              🗑️ Supprimer ce médecin référent
            </button>
            {medecin.patients && medecin.patients.length > 0 && (
              <p className="text-xs text-red-600 mt-2">
                ⚠️ {medecin.patients.length} patient(s) seront détachés
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}