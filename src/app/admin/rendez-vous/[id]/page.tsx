"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type RendezVous = {
  id: string;
  type: string;
  statut: string;
  datePrevue: string;
  duree: number;
  raison: string | null;
  notes: string | null;
  dateCreation: string;
  dateMiseAJour: string | null;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string | null;
    whatsapp: string | null;
  };
  medecin: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
    telephone: string | null;
    email: string | null;
  } | null;
  clinique: {
    id: string;
    nom: string;
    adresse: string | null;
    ville: string;
    telephone: string | null;
  } | null;
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

export default function DetailRendezVousPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [rendezVous, setRendezVous] = useState<RendezVous | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [cliniques, setCliniques] = useState<Clinique[]>([]);

  const [formData, setFormData] = useState({
    type: "",
    statut: "",
    datePrevue: "",
    heurePrevue: "",
    duree: "30",
    raison: "",
    notes: "",
    medecinId: "",
    cliniqueId: "",
  });

  useEffect(() => {
    loadRendezVous();
    loadOptions();
  }, [id]);

  const loadRendezVous = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/rendez-vous/${id}`);
      
      if (!response.ok) {
        throw new Error("Rendez-vous non trouvé");
      }

      const data = await response.json();
      setRendezVous(data);

      const dateObj = new Date(data.datePrevue);
      const date = dateObj.toISOString().split('T')[0];
      const time = dateObj.toTimeString().slice(0, 5);

      setFormData({
        type: data.type,
        statut: data.statut,
        datePrevue: date,
        heurePrevue: time,
        duree: data.duree.toString(),
        raison: data.raison || "",
        notes: data.notes || "",
        medecinId: data.medecin?.id || "",
        cliniqueId: data.clinique?.id || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const datePrevue = `${formData.datePrevue}T${formData.heurePrevue}:00`;

      const response = await fetch(`/api/admin/rendez-vous/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          statut: formData.statut,
          datePrevue,
          duree: parseInt(formData.duree),
          raison: formData.raison || null,
          notes: formData.notes || null,
          medecinId: formData.medecinId || null,
          cliniqueId: formData.cliniqueId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      setSuccess("Rendez-vous mis à jour avec succès !");
      setIsEditing(false);
      await loadRendezVous();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rendez-vous/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      router.push("/admin/rendez-vous");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getStatutBadge = (statut: string) => {
    const badges: Record<string, string> = {
      PLANIFIE: "bg-blue-100 text-blue-800",
      CONFIRME: "bg-green-100 text-green-800",
      EN_COURS: "bg-yellow-100 text-yellow-800",
      TERMINE: "bg-gray-100 text-gray-800",
      ANNULE: "bg-red-100 text-red-800",
      REPORTE: "bg-orange-100 text-orange-800",
    };
    return badges[statut] || "bg-gray-100 text-gray-800";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SUR_PLACE: "Sur place",
      EN_LIGNE: "En ligne (visio)",
      PRE_ARRIVEE: "Consultation pré-arrivée",
      SUIVI_POST_TRAITEMENT: "Suivi post-traitement",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error && !rendezVous) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link
          href="/admin/rendez-vous"
          className="mt-4 inline-block text-[#4DB8A8] hover:text-[#3DA391]"
        >
          ← Retour aux rendez-vous
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/rendez-vous"
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour aux rendez-vous
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Détails du rendez-vous
            </h1>
            <p className="text-gray-600">
              Rendez-vous du {new Date(rendezVous!.datePrevue).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatutBadge(rendezVous!.statut)}`}>
            {rendezVous!.statut}
          </span>
        </div>
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

      {!isEditing ? (
        <div className="space-y-6">
          {/* Informations patient */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nom complet:</span>
                <Link
                  href={`/admin/patients/${rendezVous!.patient.id}`}
                  className="text-[#4DB8A8] hover:text-[#3DA391] font-medium"
                >
                  {rendezVous!.patient.prenom} {rendezVous!.patient.nom}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{rendezVous!.patient.email}</span>
              </div>
              {rendezVous!.patient.telephone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Téléphone:</span>
                  <span className="font-medium">{rendezVous!.patient.telephone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informations rendez-vous */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{getTypeLabel(rendezVous!.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date et heure:</span>
                <span className="font-medium">
                  {new Date(rendezVous!.datePrevue).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} à {new Date(rendezVous!.datePrevue).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durée:</span>
                <span className="font-medium">{rendezVous!.duree} minutes</span>
              </div>
              {rendezVous!.raison && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Raison:</span>
                  <span className="font-medium">{rendezVous!.raison}</span>
                </div>
              )}
            </div>
          </div>

          {/* Médecin et clinique */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lieu et intervenant</h2>
            <div className="space-y-3">
              {rendezVous!.medecin ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Médecin:</span>
                  <span className="font-medium">
                    Dr. {rendezVous!.medecin.prenom} {rendezVous!.medecin.nom} - {rendezVous!.medecin.specialite}
                  </span>
                </div>
              ) : (
                <div className="text-gray-500">Aucun médecin assigné</div>
              )}
              {rendezVous!.clinique ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Clinique:</span>
                  <span className="font-medium">
                    {rendezVous!.clinique.nom} - {rendezVous!.clinique.ville}
                  </span>
                </div>
              ) : (
                <div className="text-gray-500">Aucune clinique assignée</div>
              )}
            </div>
          </div>

          {/* Notes */}
          {rendezVous!.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes internes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{rendezVous!.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Formulaire de modification */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Modifier le rendez-vous
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
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
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="statut"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.statut}
                    onChange={handleChange}
                  >
                    <option value="PLANIFIE">Planifié</option>
                    <option value="CONFIRME">Confirmé</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="ANNULE">Annulé</option>
                    <option value="REPORTE">Reporté</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médecin
                </label>
                <select
                  name="medecinId"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.medecinId}
                  onChange={handleChange}
                >
                  <option value="">Aucun médecin</option>
                  {medecins.map(m => (
                    <option key={m.id} value={m.id}>
                      Dr. {m.prenom} {m.nom} - {m.specialite}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinique
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison
                </label>
                <input
                  type="text"
                  name="raison"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}