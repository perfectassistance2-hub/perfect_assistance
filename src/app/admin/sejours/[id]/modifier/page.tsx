"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Patient = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
};

type Clinique = {
  id: string;
  nom: string;
  ville: string;
};

type Medecin = {
  id: string;
  prenom: string;
  nom: string;
  specialite: string;
};

type Coordinateur = {
  id: string;
  prenom: string;
  nom: string;
};

type Sejour = {
  id: string;
  patientId: string;
  coordinateurId: string;
  cliniqueId: string;
  medecinId: string | null;
  statut: string;
  dateArrivee: string;
  dateDepart: string;
  dateTraitement: string | null;
  typeTraitement: string;
  descriptionTraitement: string;
  hebergementNecessaire: boolean;
  detailsHebergement: string;
  transportNecessaire: boolean;
  detailsTransport: string;
  notes: string;
};

export default function ModifierSejourPage() {
  const router = useRouter();
  const params = useParams();
  const sejourId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [coordinateurs, setCoordinateurs] = useState<Coordinateur[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState({
    coordinateurId: "",
    cliniqueId: "",
    medecinId: "",
    statut: "PLANIFIE",
    dateArrivee: "",
    dateDepart: "",
    dateTraitement: "",
    typeTraitement: "",
    descriptionTraitement: "",
    hebergementNecessaire: false,
    detailsHebergement: "",
    transportNecessaire: false,
    detailsTransport: "",
    notes: "",
  });

  useEffect(() => {
    loadSejourData();
    loadOptions();
  }, [sejourId]);

  const loadSejourData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sejours/${sejourId}`);
      
      if (!response.ok) {
        throw new Error('Séjour non trouvé');
      }

      const result = await response.json();
      const sejour = result.sejour;

      // Pré-remplir le formulaire
      setFormData({
        coordinateurId: sejour.coordinateurId,
        cliniqueId: sejour.cliniqueId,
        medecinId: sejour.medecinId || "",
        statut: sejour.statut,
        dateArrivee: sejour.dateArrivee.split('T')[0],
        dateDepart: sejour.dateDepart.split('T')[0],
        dateTraitement: sejour.dateTraitement ? sejour.dateTraitement.split('T')[0] : "",
        typeTraitement: sejour.typeTraitement,
        descriptionTraitement: sejour.descriptionTraitement || "",
        hebergementNecessaire: sejour.hebergementNecessaire,
        detailsHebergement: sejour.detailsHebergement || "",
        transportNecessaire: sejour.transportNecessaire,
        detailsTransport: sejour.detailsTransport || "",
        notes: sejour.notes || "",
      });

      setPatient(sejour.patient);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      // Charger les cliniques
      const cliniquesRes = await fetch("/api/admin/cliniques");
      if (cliniquesRes.ok) {
        setCliniques(await cliniquesRes.json());
      }

      // Charger les médecins
      const medecinsRes = await fetch("/api/admin/medecins");
      if (medecinsRes.ok) {
        setMedecins(await medecinsRes.json());
      }

      // Charger les coordinateurs
      const coordRes = await fetch("/api/admin/utilisateurs");
      if (coordRes.ok) {
        setCoordinateurs(await coordRes.json());
      }
    } catch (error) {
      console.error("Erreur chargement options:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/sejours/${sejourId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          medecinId: formData.medecinId || null,
          dateTraitement: formData.dateTraitement || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      setSuccess("Séjour mis à jour avec succès !");
      
      setTimeout(() => {
        router.push(`/admin/sejours/${sejourId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#4DB8A8] border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <Link
          href={`/admin/sejours/${sejourId}`}
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour au séjour
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Modifier le séjour
        </h1>
        {patient && (
          <p className="text-gray-600">
            Patient : {patient.prenom} {patient.nom}
          </p>
        )}
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
        {/* Statut */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Statut du séjour
          </h2>
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
              <option value="PLANIFIE">📅 Planifié</option>
              <option value="EN_COURS">🏥 En cours</option>
              <option value="TERMINE">✅ Terminé</option>
              <option value="ANNULE">❌ Annulé</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Changez le statut selon l'avancement du séjour
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dates du séjour
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'arrivée <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateArrivee"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.dateArrivee}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de départ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateDepart"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.dateDepart}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date du traitement (optionnel)
              </label>
              <input
                type="date"
                name="dateTraitement"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.dateTraitement}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Traitement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Traitement
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de traitement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="typeTraitement"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.typeTraitement}
                onChange={handleChange}
                placeholder="Ex: Chirurgie esthétique"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description du traitement
              </label>
              <textarea
                name="descriptionTraitement"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8] resize-none"
                value={formData.descriptionTraitement}
                onChange={handleChange}
                placeholder="Détails sur le traitement prévu..."
              />
            </div>
          </div>
        </div>

        {/* Clinique et médecin */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Clinique et médecin
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinique <span className="text-red-500">*</span>
              </label>
              <select
                name="cliniqueId"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.cliniqueId}
                onChange={handleChange}
              >
                <option value="">Sélectionner une clinique</option>
                {cliniques.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} - {c.ville}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médecin (optionnel)
              </label>
              <select
                name="medecinId"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.medecinId}
                onChange={handleChange}
              >
                <option value="">Aucun médecin assigné</option>
                {medecins.map(m => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.prenom} {m.nom} - {m.specialite}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coordinateur <span className="text-red-500">*</span>
              </label>
              <select
                name="coordinateurId"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.coordinateurId}
                onChange={handleChange}
              >
                <option value="">Sélectionner un coordinateur</option>
                {coordinateurs.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Services additionnels
          </h2>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="hebergementNecessaire"
                  className="w-5 h-5 text-[#4DB8A8] rounded focus:ring-2 focus:ring-[#4DB8A8]"
                  checked={formData.hebergementNecessaire}
                  onChange={handleChange}
                />
                <span className="text-sm font-medium text-gray-700">
                  Hébergement nécessaire
                </span>
              </label>
              {formData.hebergementNecessaire && (
                <textarea
                  name="detailsHebergement"
                  rows={3}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8] resize-none"
                  value={formData.detailsHebergement}
                  onChange={handleChange}
                  placeholder="Détails sur l'hébergement (type, durée, préférences...)"
                />
              )}
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="transportNecessaire"
                  className="w-5 h-5 text-[#4DB8A8] rounded focus:ring-2 focus:ring-[#4DB8A8]"
                  checked={formData.transportNecessaire}
                  onChange={handleChange}
                />
                <span className="text-sm font-medium text-gray-700">
                  Transport nécessaire
                </span>
              </label>
              {formData.transportNecessaire && (
                <textarea
                  name="detailsTransport"
                  rows={3}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8] resize-none"
                  value={formData.detailsTransport}
                  onChange={handleChange}
                  placeholder="Détails sur le transport (aéroport, clinique, hôtel...)"
                />
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Notes additionnelles
          </h2>
          <textarea
            name="notes"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8] resize-none"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Informations complémentaires, instructions spéciales..."
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push(`/admin/sejours/${sejourId}`)}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-[#4DB8A8] hover:bg-[#3DA391] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Enregistrement..." : "💾 Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}