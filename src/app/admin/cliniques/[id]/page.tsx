"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Clinique = {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  pays: string;
  telephone: string;
  email: string | null;
  siteWeb: string | null;
  specialites: string | null;
  estActif: boolean;
  dateCreation: string;
  medecins: Array<{
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
  }>;
  rendez_vous: { count: number }[];
  sejours: { count: number }[];
};

export default function CliniqueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cliniqueId = params.id as string;

  const [clinique, setClinique] = useState<Clinique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    ville: "",
    pays: "",
    telephone: "",
    email: "",
    siteWeb: "",
    specialites: "",
  });

  useEffect(() => {
    if (cliniqueId) {
      loadClinique();
    }
  }, [cliniqueId]);

  const loadClinique = async () => {
    try {
      const response = await fetch(`/api/admin/cliniques/${cliniqueId}`);
      if (!response.ok) throw new Error("Clinique non trouvée");
      
      const data = await response.json();
      setClinique(data);
      
      // Préremplir le formulaire
      setFormData({
        nom: data.nom,
        adresse: data.adresse,
        ville: data.ville,
        pays: data.pays,
        telephone: data.telephone,
        email: data.email || "",
        siteWeb: data.siteWeb || "",
        specialites: data.specialites ? JSON.parse(data.specialites).join(", ") : "",
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const specialitesArray = formData.specialites
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const response = await fetch(`/api/admin/cliniques/${cliniqueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          specialites: specialitesArray.length > 0 ? JSON.stringify(specialitesArray) : null,
        }),
      });

      if (!response.ok) throw new Error("Erreur de mise à jour");

      setShowEditModal(false);
      loadClinique();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleToggleActive = async () => {
    if (!clinique) return;

    try {
      await fetch(`/api/admin/cliniques/${cliniqueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estActif: !clinique.estActif }),
      });

      loadClinique();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  if (error || !clinique) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Clinique non trouvée</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href="/admin/cliniques"
          className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391]"
        >
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const totalRendezVous = clinique.rendez_vous?.[0]?.count || 0;
  const totalSejours = clinique.sejours?.[0]?.count || 0;

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/cliniques"
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour à la liste
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{clinique.nom}</h1>
            <p className="text-gray-600">{clinique.ville}, {clinique.pays}</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
            >
              ✏️ Modifier
            </button>
            <button
              onClick={handleToggleActive}
              className={`px-4 py-2 rounded-lg ${
                clinique.estActif
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
            >
              {clinique.estActif ? "Désactiver" : "Activer"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-[#4DB8A8]">{clinique.medecins?.length || 0}</div>
          <div className="text-sm text-gray-600 mt-1">Médecins</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{totalRendezVous}</div>
          <div className="text-sm text-gray-600 mt-1">Rendez-vous</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-purple-600">{totalSejours}</div>
          <div className="text-sm text-gray-600 mt-1">Séjours</div>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Coordonnées */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Coordonnées</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Adresse</dt>
              <dd className="text-sm text-gray-900">{clinique.adresse}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ville</dt>
              <dd className="text-sm text-gray-900">{clinique.ville}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Pays</dt>
              <dd className="text-sm text-gray-900">{clinique.pays}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
              <dd className="text-sm text-gray-900">{clinique.telephone}</dd>
            </div>
            {clinique.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{clinique.email}</dd>
              </div>
            )}
            {clinique.siteWeb && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Site web</dt>
                <dd>
                  <a
                    href={clinique.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#4DB8A8] hover:text-[#3DA391]"
                  >
                    {clinique.siteWeb}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Statut</dt>
              <dd>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  clinique.estActif
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {clinique.estActif ? "Actif" : "Inactif"}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Spécialités */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Spécialités</h2>
          {clinique.specialites ? (
            <div className="flex flex-wrap gap-2">
              {JSON.parse(clinique.specialites).map((spec: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg"
                >
                  {spec}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune spécialité renseignée</p>
          )}
        </div>
      </div>

      {/* Médecins de la clinique */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Médecins ({clinique.medecins?.length || 0})
          </h2>
          <button
            onClick={() => router.push(`/admin/medecins?cliniqueId=${cliniqueId}&action=add`)}
            className="text-sm bg-[#4DB8A8] text-white px-4 py-2 rounded-lg hover:bg-[#3DA391]"
          >
            + Ajouter un médecin
          </button>
        </div>

        {clinique.medecins && clinique.medecins.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinique.medecins.map((medecin) => (
              <Link
                key={medecin.id}
                href={`/admin/medecins/${medecin.id}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-[#4DB8A8] hover:shadow transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {medecin.prenom[0]}{medecin.nom[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Dr. {medecin.prenom} {medecin.nom}
                    </p>
                    <p className="text-xs text-gray-600">{medecin.specialite}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Aucun médecin associé à cette clinique</p>
        )}
      </div>

      {/* Modal de modification */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Modifier la clinique</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.adresse}
                    onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.pays}
                    onChange={(e) => setFormData({...formData, pays: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.siteWeb}
                    onChange={(e) => setFormData({...formData, siteWeb: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialités (séparées par des virgules)
                  </label>
                  <input
                    type="text"
                    placeholder="Chirurgie esthétique, Dentaire, Ophtalmologie..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.specialites}
                    onChange={(e) => setFormData({...formData, specialites: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}