// app/admin/consultations-video/nouveau/page.tsx

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

type RendezVous = {
  id: string;
  datePrevue: string;
  raison: string;
  medecinId: string | null;
  patient: { prenom: string; nom: string };
  medecin?: { id: string; prenom: string; nom: string };
};

export default function NouvelleConsultationVideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");
  const preselectedRdvId = searchParams.get("rendezVousId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    dateDebut: "",
    heureDebut: "",
    duree: "30",
    patientId: preselectedPatientId || "",
    medecinId: "",
    rendezVousId: preselectedRdvId || "",
    enregistrementAutorise: false,
  });

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (formData.patientId) {
      loadRendezVousPatient(formData.patientId);
    } else {
      setRendezVous([]);
    }
  }, [formData.patientId]);

  // Auto-remplir depuis le rendez-vous sélectionné
  useEffect(() => {
    if (formData.rendezVousId && rendezVous.length > 0) {
      const rdv = rendezVous.find(r => r.id === formData.rendezVousId);
      if (rdv) {
        const dateObj = new Date(rdv.datePrevue);
        const date = dateObj.toISOString().split('T')[0];
        const time = dateObj.toTimeString().slice(0, 5);

        setFormData(prev => ({
          ...prev,
          dateDebut: date,
          heureDebut: time,
          medecinId: rdv.medecinId || prev.medecinId,
          titre: rdv.raison || prev.titre || "Consultation vidéo",
        }));
      }
    } else if (formData.rendezVousId === "" && formData.patientId) {
      // Si on désélectionne le RDV, garder le patient mais réinitialiser les autres champs
      // Ne rien faire ici pour permettre la saisie manuelle
    }
  }, [formData.rendezVousId, rendezVous]);

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
    } catch (error) {
      console.error("Erreur chargement options:", error);
    }
  };

  const loadRendezVousPatient = async (patientId: string) => {
    try {
      const response = await fetch(`/api/admin/rendez-vous?patientId=${patientId}&statut=PLANIFIE`);
      if (response.ok) {
        const data = await response.json();
        setRendezVous(data);
      }
    } catch (error) {
      console.error("Erreur chargement RDV:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!formData.titre || !formData.dateDebut || !formData.heureDebut || !formData.patientId) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      const dateDebut = `${formData.dateDebut}T${formData.heureDebut}:00`;

      if (new Date(dateDebut) < new Date()) {
        throw new Error("La date de début doit être dans le futur");
      }

      const userStr = localStorage.getItem("admin_user");
      if (!userStr) {
        throw new Error("Session expirée");
      }
      const user = JSON.parse(userStr);

      const response = await fetch("/api/admin/consultations-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: formData.titre,
          description: formData.description || null,
          dateDebut,
          duree: parseInt(formData.duree),
          patientId: formData.patientId,
          medecinId: formData.medecinId || null,
          rendezVousId: formData.rendezVousId || null,
          enregistrementAutorise: formData.enregistrementAutorise,
          creePar: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      setSuccess("Visioconférence créée avec succès !");
      setTimeout(() => {
        router.push(`/admin/consultations-video/${data.consultation.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/consultations-video"
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour aux visioconférences
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎥 Nouvelle visioconférence
        </h1>
        <p className="text-gray-600">
          Créer une consultation en ligne avec Daily.co
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Informations de la consultation
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="titre"
                required
                placeholder="Ex: Consultation pré-opératoire, Suivi post-traitement..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.titre}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Détails supplémentaires sur la consultation..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateDebut"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.dateDebut}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="heureDebut"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.heureDebut}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-1">
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Participants
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
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom} - {p.email}
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
                <option value="">Aucun médecin spécifique</option>
                {medecins.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.prenom} {m.nom} - {m.specialite}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📅 Association avec un rendez-vous (optionnel)
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rendez-vous existant
            </label>
            <select
              name="rendezVousId"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.rendezVousId}
              onChange={handleChange}
              disabled={!formData.patientId}
            >
              <option value="">Aucun rendez-vous (saisie manuelle)</option>
              {rendezVous.map((rdv) => (
                <option key={rdv.id} value={rdv.id}>
                  {new Date(rdv.datePrevue).toLocaleDateString("fr-FR")} à{" "}
                  {new Date(rdv.datePrevue).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })} -{" "}
                  {rdv.raison || "Sans objet"}
                  {rdv.medecin &&
                    ` (Dr. ${rdv.medecin.prenom} ${rdv.medecin.nom})`}
                </option>
              ))}
            </select>
            {!formData.patientId && (
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez d'abord un patient
              </p>
            )}
            {formData.rendezVousId && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Les informations du rendez-vous ont été automatiquement remplies
              </p>
            )}
            {!formData.rendezVousId && formData.patientId && (
              <p className="text-xs text-blue-600 mt-1">
                💡 Aucun RDV sélectionné - Remplissez manuellement les champs ci-dessus
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Options
          </h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                name="enregistrementAutorise"
                id="enregistrementAutorise"
                className="mt-1 h-4 w-4 text-[#4DB8A8] border-gray-300 rounded focus:ring-[#4DB8A8]"
                checked={formData.enregistrementAutorise}
                onChange={handleChange}
              />
              <label
                htmlFor="enregistrementAutorise"
                className="ml-3 block text-sm text-gray-700"
              >
                <span className="font-medium">
                  Autoriser l'enregistrement local
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  🔴 L'admin pourra démarrer un enregistrement qui sera
                  sauvegardé localement sur sa machine (pas sur le serveur)
                </p>
              </label>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link
            href="/admin/consultations-video"
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création en cours..." : "🎥 Créer la visioconférence"}
          </button>
        </div>
      </form>
    </div>
  );
}