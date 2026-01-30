// app/admin/patients/[id]/modifier/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Patient = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  sexe: string;
  telephone: string;
  whatsapp: string | null;
  pays: string;
  ville: string | null;
  adresse: string | null;
  codePostal: string | null;
  numeroPasseport: string | null;
  dateExpirationPasseport: string | null;
  nationalite: string;
  statut: string;
  langue: string;
  medecinreferentid: string | null; // ✅ AJOUTÉ
};

type MedecinReferent = {
  id: string;
  prenom: string;
  nom: string;
  specialite: string | null;
  pays: string;
};

export default function ModifierPatientPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [medecinsReferents, setMedecinsReferents] = useState<MedecinReferent[]>([]); // ✅ AJOUTÉ
  
  const [formData, setFormData] = useState({
    email: "",
    prenom: "",
    nom: "",
    dateNaissance: "",
    sexe: "HOMME",
    telephone: "",
    whatsapp: "",
    pays: "",
    ville: "",
    adresse: "",
    codePostal: "",
    numeroPasseport: "",
    dateExpirationPasseport: "",
    nationalite: "",
    statut: "EN_ATTENTE",
    langue: "fr",
    medecinreferentid: "", // ✅ AJOUTÉ
  });

  useEffect(() => {
    loadPatient();
    loadMedecinsReferents(); // ✅ AJOUTÉ
  }, [patientId]);

  // ✅ NOUVELLE FONCTION
  const loadMedecinsReferents = async () => {
    try {
      const response = await fetch("/api/admin/medecins-referents?actif=true");
      if (response.ok) {
        const data = await response.json();
        setMedecinsReferents(data);
      }
    } catch (error) {
      console.error("Erreur chargement médecins référents:", error);
    }
  };

  const loadPatient = async () => {
    try {
      const response = await fetch(`/api/admin/patients/${patientId}`);
      if (!response.ok) throw new Error("Patient non trouvé");

      const data = await response.json();
      const patient = data.patient;

      setFormData({
        email: patient.email,
        prenom: patient.prenom,
        nom: patient.nom,
        dateNaissance: patient.dateNaissance.split('T')[0],
        sexe: patient.sexe,
        telephone: patient.telephone,
        whatsapp: patient.whatsapp || "",
        pays: patient.pays,
        ville: patient.ville || "",
        adresse: patient.adresse || "",
        codePostal: patient.codePostal || "",
        numeroPasseport: patient.numeroPasseport || "",
        dateExpirationPasseport: patient.dateExpirationPasseport ? patient.dateExpirationPasseport.split('T')[0] : "",
        nationalite: patient.nationalite,
        statut: patient.statut,
        langue: patient.langue,
        medecinreferentid: patient.medecinreferentid || "", // ✅ AJOUTÉ
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      router.push(`/admin/patients/${patientId}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/admin/patients/${patientId}`}
          className="inline-flex items-center text-[#4DB8A8] hover:text-[#3DA391] mb-4"
        >
          ← Retour au profil
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Modifier le patient</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prénom *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date de naissance *</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.dateNaissance}
                  onChange={(e) => setFormData({...formData, dateNaissance: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sexe *</label>
                <select
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.sexe}
                  onChange={(e) => setFormData({...formData, sexe: e.target.value})}
                >
                  <option value="HOMME">Homme</option>
                  <option value="FEMME">Femme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Téléphone *</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nationalité *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.nationalite}
                  onChange={(e) => setFormData({...formData, nationalite: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Adresse</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pays *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.pays}
                  onChange={(e) => setFormData({...formData, pays: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ville</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.ville}
                  onChange={(e) => setFormData({...formData, ville: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Adresse complète</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Code postal</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.codePostal}
                  onChange={(e) => setFormData({...formData, codePostal: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents de voyage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Numéro de passeport</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.numeroPasseport}
                  onChange={(e) => setFormData({...formData, numeroPasseport: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date d'expiration du passeport</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.dateExpirationPasseport}
                  onChange={(e) => setFormData({...formData, dateExpirationPasseport: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* ✅ MÉDECIN RÉFÉRENT - NOUVELLE SECTION */}
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">👨‍⚕️ Médecin Référent</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Médecin qui a recommandé ce patient
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.medecinreferentid}
                  onChange={(e) => setFormData({...formData, medecinreferentid: e.target.value})}
                >
                  <option value="">Aucun médecin référent</option>
                  {medecinsReferents.map((medecin) => (
                    <option key={medecin.id} value={medecin.id}>
                      Dr. {medecin.prenom} {medecin.nom}
                      {medecin.specialite && ` - ${medecin.specialite}`}
                      {" "}({medecin.pays})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Vous pouvez modifier ou retirer le médecin référent.
                  Laissez vide pour retirer l'association.
                </p>
              </div>
            </div>
          </div>

          {/* Préférences */}
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Préférences et statut</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.statut}
                  onChange={(e) => setFormData({...formData, statut: e.target.value})}
                >
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="ACTIF">Actif</option>
                  
                  <option value="TERMINE">Terminé</option>
                  
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Langue préférée</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.langue}
                  onChange={(e) => setFormData({...formData, langue: e.target.value})}
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                  <option value="ar">Arabe</option>
                </select>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex space-x-4 pt-6 border-t">
            <Link
              href={`/admin/patients/${patientId}`}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center font-medium"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] font-medium disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                "Enregistrer les modifications"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}