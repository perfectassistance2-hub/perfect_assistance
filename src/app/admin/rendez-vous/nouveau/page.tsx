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

type Medecin = {
  id: string;
  prenom: string;
  nom: string;
  specialite: string;
};

type Clinique = {
  id: string;
  nom: string;
  ville: string;
};

export default function NouveauRendezVousPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [cliniques, setCliniques] = useState<Clinique[]>([]);

  const [formData, setFormData] = useState({
    patientId: preselectedPatientId || "",
    medecinId: "",
    cliniqueId: "",
    type: "SUR_PLACE",
    datePrevue: "",
    heurePrevue: "",
    duree: "30",
    raison: "",
    notes: "",
  });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const patientsRes = await fetch("/api/admin/patients");
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
      }

      const medecinsRes = await fetch("/api/admin/medecins");
      if (medecinsRes.ok) {
        const medecinsData = await medecinsRes.json();
        setMedecins(medecinsData);
      }

      const cliniquesRes = await fetch("/api/admin/cliniques");
      if (cliniquesRes.ok) {
        const cliniquesData = await cliniquesRes.json();
        setCliniques(cliniquesData);
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
      const datePrevue = `${formData.datePrevue}T${formData.heurePrevue}:00`;

      const userStr = localStorage.getItem("admin_user");
      if (!userStr) {
        throw new Error("Session expirée");
      }
      const user = JSON.parse(userStr);

      const response = await fetch("/api/admin/rendez-vous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: formData.patientId,
          medecinId: formData.medecinId || null,
          cliniqueId: formData.cliniqueId || null,
          type: formData.type,
          datePrevue,
          duree: parseInt(formData.duree),
          raison: formData.raison || null,
          notes: formData.notes || null,
          creePar: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      setSuccess("Rendez-vous créé avec succès !");
      setTimeout(() => {
        router.push(`/admin/rendez-vous/${data.rendezVous.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/rendez-vous"
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour aux rendez-vous
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nouveau rendez-vous
        </h1>
        <p className="text-gray-600">
          Planifier un rendez-vous pour un patient
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Informations du rendez-vous
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
                    {p.prenom} {p.nom} - {p.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de rendez-vous <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="SUR_PLACE">Sur place</option>
                  <option value="EN_LIGNE">En ligne (visio)</option>
                  <option value="PRE_ARRIVEE">Consultation pré-arrivée</option>
                  <option value="SUIVI_POST_TRAITEMENT">Suivi post-traitement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (minutes)
                </label>
                <select
                  name="duree"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.duree}
                  onChange={handleChange}
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 heure</option>
                  <option value="90">1h30</option>
                  <option value="120">2 heures</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="datePrevue"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.datePrevue}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="heurePrevue"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.heurePrevue}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Lieu et intervenant
          </h2>

          <div className="space-y-4">
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
                <option value="">Aucun médecin spécifique</option>
                {medecins.map(m => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.prenom} {m.nom} - {m.specialite}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinique (optionnel)
              </label>
              <select
                name="cliniqueId"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.cliniqueId}
                onChange={handleChange}
              >
                <option value="">Aucune clinique</option>
                {cliniques.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} - {c.ville}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Détails
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du rendez-vous
              </label>
              <input
                type="text"
                name="raison"
                placeholder="Ex: Consultation initiale, contrôle post-opératoire..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.raison}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes internes
              </label>
              <textarea
                name="notes"
                rows={4}
                placeholder="Notes pour l'équipe..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link
            href="/admin/rendez-vous"
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer le rendez-vous"}
          </button>
        </div>
      </form>
    </div>
  );
}