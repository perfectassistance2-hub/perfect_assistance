// app/admin/patients/nouveau/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MedecinReferent = {
  id: string;
  prenom: string;
  nom: string;
  specialite: string | null;
  pays: string;
};

export default function NouveauPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [medecinsReferents, setMedecinsReferents] = useState<MedecinReferent[]>([]);

  const [formData, setFormData] = useState({
    // Informations de base
    email: "",
    prenom: "",
    nom: "",
    dateNaissance: "",
    sexe: "",
    telephone: "",
    whatsapp: "",
    
    // Localisation
    pays: "",
    ville: "",
    adresse: "",
    codePostal: "",
    
    // Passeport
    numeroPasseport: "",
    dateExpirationPasseport: "",
    nationalite: "",
    
    // Langue
    langue: "fr",
    
    // ✅ MÉDECIN RÉFÉRENT
    medecinreferentid: "",
  });

  useEffect(() => {
    loadMedecinsReferents();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      // Afficher le mot de passe temporaire si généré
      if (data.motDePasseTemporaire) {
        alert(`Patient créé avec succès!\n\nMot de passe temporaire: ${data.motDePasseTemporaire}\n\nNotez-le bien, il ne sera plus affiché.`);
      }

      router.push(`/admin/patients/${data.patient.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="w-full h-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/admin/patients" className="hover:text-[#4DB8A8]">
            Patients
          </Link>
          <span>/</span>
          <span className="text-gray-900">Nouveau</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Nouveau patient</h1>
        <p className="text-gray-600 mt-2">
          Ajoutez un nouveau patient au système
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ===== INFORMATIONS PERSONNELLES ===== */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Informations personnelles
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="prenom"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.prenom}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nom"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.nom}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de naissance <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dateNaissance"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.dateNaissance}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sexe <span className="text-red-500">*</span>
            </label>
            <select
              name="sexe"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.sexe}
              onChange={handleChange}
            >
              <option value="">Sélectionner</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nationalité <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nationalite"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.nationalite}
              onChange={handleChange}
            />
          </div>

          {/* ===== CONTACT ===== */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Coordonnées
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="telephone"
              required
              placeholder="+212 6XX XXX XXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.telephone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp (optionnel)
            </label>
            <input
              type="tel"
              name="whatsapp"
              placeholder="+212 6XX XXX XXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.whatsapp}
              onChange={handleChange}
            />
          </div>

          {/* ===== LOCALISATION ===== */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Localisation
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pays <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pays"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.pays}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville
            </label>
            <input
              type="text"
              name="ville"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.ville}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse complète
            </label>
            <textarea
              name="adresse"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.adresse}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code postal
            </label>
            <input
              type="text"
              name="codePostal"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.codePostal}
              onChange={handleChange}
            />
          </div>

          {/* ===== PASSEPORT ===== */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Informations de voyage
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de passeport
            </label>
            <input
              type="text"
              name="numeroPasseport"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.numeroPasseport}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date d'expiration du passeport
            </label>
            <input
              type="date"
              name="dateExpirationPasseport"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.dateExpirationPasseport}
              onChange={handleChange}
            />
          </div>

          {/* ===== ✅ MÉDECIN RÉFÉRENT ===== */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              👨‍⚕️ Médecin Référent (optionnel)
            </h2>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Médecin qui a recommandé ce patient
            </label>
            <select
              name="medecinreferentid"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.medecinreferentid}
              onChange={handleChange}
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
              💡 Sélectionnez le médecin qui a envoyé ce patient (si applicable).
              Laissez vide si le patient est venu directement.
            </p>
          </div>

          {/* ===== LANGUE ===== */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Préférences
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langue préférée
            </label>
            <select
              name="langue"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
              value={formData.langue}
              onChange={handleChange}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        {/* ===== BOUTONS ===== */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
          <Link
            href="/admin/patients"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#4DB8A8] text-white px-8 py-2 rounded-lg hover:bg-[#3DA391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "Créer le patient"}
          </button>
        </div>
      </form>

      {/* Note importante */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          💡 <strong>Note :</strong> Un mot de passe temporaire sera généré automatiquement 
          et affiché après la création. Le patient pourra le changer lors de sa première connexion.
        </p>
      </div>
    </div>
  );
}