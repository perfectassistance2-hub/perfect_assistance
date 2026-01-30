"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Patient = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  pays: string;
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

export default function NouveauSejourPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [coordinateurs, setCoordinateurs] = useState<Coordinateur[]>([]);

  const [formData, setFormData] = useState({
    patientId: preselectedPatientId || "",
    coordinateurId: "",
    cliniqueId: "",
    medecinId: "",
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
    loadOptions();
    
    // Auto-sélectionner l'utilisateur connecté comme coordinateur
    const userStr = localStorage.getItem("admin_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setFormData(prev => ({ ...prev, coordinateurId: user.id }));
    }
  }, []);

  const loadOptions = async () => {
    try {
      // Charger les patients
      const patientsRes = await fetch("/api/admin/patients");
      if (patientsRes.ok) {
        setPatients(await patientsRes.json());
      }

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
    setLoading(true);

    try {
      const response = await fetch("/api/admin/sejours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          medecinId: formData.medecinId || null,
          dateTraitement: formData.dateTraitement || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      setSuccess("Séjour créé avec succès !");
      setTimeout(() => {
        router.push('/admin/sejours');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/sejours"
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour aux séjours
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nouveau séjour médical
        </h1>
        <p className="text-gray-600">
          Organiser un séjour médical complet pour un patient
        </p>
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
        {/* Patient et coordinateur */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Patient et coordination
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient <span className="text-red-500">*</span>
              </label>
              <select
                name="patientId"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.patientId}
                onChange={handleChange}
              >
                <option value="">Sélectionner un patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom} - {p.pays}
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

        {/* Dates du séjour */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dates du séjour
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'arrivée <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateArrivee"
                required
                min={new Date().toISOString().split('T')[0]}
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
                min={formData.dateArrivee || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.dateDepart}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date du traitement (optionnel)
              </label>
              <input
                type="date"
                name="dateTraitement"
                min={formData.dateArrivee}
                max={formData.dateDepart}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.dateTraitement}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Traitement médical */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Traitement médical
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
                placeholder="Ex: Chirurgie esthétique, Traitement dentaire..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.typeTraitement}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description du traitement
              </label>
              <textarea
                name="descriptionTraitement"
                rows={4}
                placeholder="Détails du traitement prévu..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.descriptionTraitement}
                onChange={handleChange}
              />
            </div>

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
                Médecin responsable (optionnel)
              </label>
              <select
                name="medecinId"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.medecinId}
                onChange={handleChange}
              >
                <option value="">Aucun médecin spécifique</option>
                {medecins.map(m => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.prenom} {m.nom} - {m.specialite}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Services additionnels */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Services additionnels
          </h2>

          <div className="space-y-6">
            {/* Hébergement */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="hebergementNecessaire"
                  checked={formData.hebergementNecessaire}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#4DB8A8] rounded focus:ring-[#4DB8A8]"
                />
                <span className="text-sm font-medium text-gray-700">
                  🏨 Hébergement nécessaire
                </span>
              </label>

              {formData.hebergementNecessaire && (
                <div className="mt-3 ml-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Détails de l'hébergement
                  </label>
                  <textarea
                    name="detailsHebergement"
                    rows={3}
                    placeholder="Hôtel, appartement, nombre de nuits..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.detailsHebergement}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            {/* Transport */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="transportNecessaire"
                  checked={formData.transportNecessaire}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#4DB8A8] rounded focus:ring-[#4DB8A8]"
                />
                <span className="text-sm font-medium text-gray-700">
                  🚗 Transport nécessaire
                </span>
              </label>

              {formData.transportNecessaire && (
                <div className="mt-3 ml-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Détails du transport
                  </label>
                  <textarea
                    name="detailsTransport"
                    rows={3}
                    placeholder="Aéroport, clinique, hôtel..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.detailsTransport}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Notes internes
          </h2>

          <textarea
            name="notes"
            rows={4}
            placeholder="Informations supplémentaires, instructions spéciales..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        {/* Boutons */}
        <div className="flex space-x-4">
          <Link
            href="/admin/sejours"
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer le séjour"}
          </button>
        </div>
      </form>
    </div>
  );
}