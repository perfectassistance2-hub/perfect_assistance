// app/admin/comptabilite/cliniques/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Paiement = {
  id: string;
  montant: number;
  devise: string;
  statut: string;
  datePaiement: string | null;
  dateCreation: string;
  commissionClinique: number | null;
  commissionStatut: string;
  patient: { prenom: string; nom: string };
  sejour: { typeTraitement: string };
};

type CliniqueDetails = {
  clinique: {
    id: string;
    nom: string;
    adresse: string;
    ville: string;
    pays: string;
    telephone: string;
    email: string | null;
  };
  paiements: Paiement[];
  stats: {
    montantTotal: number;
    montantPaye: number;
    montantEnAttente: number;
    commissionTotal: number;
    commissionNonPayee: number;
  };
};

export default function DetailsCliniqueComptaPage() {
  const params = useParams();
  const [data, setData] = useState<CliniqueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      loadDetails();
    }
  }, [params.id]);

  const loadDetails = async () => {
    try {
      const response = await fetch(`/api/admin/comptabilite/cliniques/${params.id}`);
      if (!response.ok) throw new Error("Clinique non trouvée");
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
        ❌ {error || "Clinique non trouvée"}
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
          <Link href="/admin/comptabilite/cliniques" className="hover:text-[#4DB8A8]">
            Cliniques
          </Link>
          <span>/</span>
          <span className="text-gray-900">{data.clinique.nom}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">🏥 {data.clinique.nom}</h1>
        <p className="text-gray-600 mt-2">
          📍 {data.clinique.ville}, {data.clinique.pays}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Revenus total</p>
          <p className="text-3xl font-bold text-gray-900">
            {data.stats.montantTotal.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Payé</p>
          <p className="text-3xl font-bold text-green-600">
            {data.stats.montantPaye.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">En attente</p>
          <p className="text-3xl font-bold text-orange-600">
            {data.stats.montantEnAttente.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Commission</p>
          <p className="text-3xl font-bold text-purple-600">
            {data.stats.commissionTotal.toLocaleString("fr-FR")} <span className="text-lg text-gray-500">MAD</span>
          </p>
          {data.stats.commissionNonPayee > 0 && (
            <p className="text-xs text-red-600 mt-1">
              Non payée: {data.stats.commissionNonPayee.toLocaleString("fr-FR")} MAD
            </p>
          )}
        </div>
      </div>

      {/* Infos clinique */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">ℹ️ Informations</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Adresse</p>
            <p className="font-medium text-gray-900">{data.clinique.adresse}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Téléphone</p>
            <p className="font-medium text-gray-900">{data.clinique.telephone}</p>
          </div>
          {data.clinique.email && (
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{data.clinique.email}</p>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Link
            href={`/admin/cliniques/${data.clinique.id}`}
            className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
          >
            Voir la fiche complète →
          </Link>
        </div>
      </div>

      {/* Liste paiements */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            💳 Paiements ({data.paiements.length})
          </h2>
        </div>

        {data.paiements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Traitement</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.paiements.map((paiement) => (
                  <tr key={paiement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {paiement.patient.prenom} {paiement.patient.nom}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {paiement.sejour.typeTraitement}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {paiement.montant.toLocaleString("fr-FR")} {paiement.devise}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatutBadge(paiement.statut)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-purple-600">
                        {paiement.commissionClinique?.toLocaleString("fr-FR") || "—"} MAD
                      </div>
                      <div className="text-xs text-gray-500">{paiement.commissionStatut}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {paiement.datePaiement
                        ? new Date(paiement.datePaiement).toLocaleDateString("fr-FR")
                        : new Date(paiement.dateCreation).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/comptabilite/paiements/${paiement.id}`}
                        className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm"
                      >
                        Détails →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucun paiement enregistré</p>
        )}
      </div>
    </div>
  );
}