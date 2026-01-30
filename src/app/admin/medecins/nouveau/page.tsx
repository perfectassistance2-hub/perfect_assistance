"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Clinique = {
  id: string;
  nom: string;
  ville: string;
};

export default function NouveauMedecinPage() {
  const router = useRouter();
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    specialite: "",
    telephone: "",
    email: "",
    cliniqueId: "",
    numeroLicence: "",
    anneesExperience: "",
  });

  useEffect(() => {
    loadCliniques();
  }, []);

  const loadCliniques = async () => {
    try {
      const response = await fetch("/api/admin/cliniques");
      if (response.ok) {
        setCliniques(await response.json());
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/medecins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          anneesExperience: formData.anneesExperience ? parseInt(formData.anneesExperience) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      // Afficher les identifiants dans un modal
      if (data.credentials) {
        setCredentials({
          email: data.credentials.email,
          password: data.credentials.temporaryPassword
        });
        setShowCredentialsModal(true);
      } else {
        // Si pas de credentials, rediriger directement
        router.push("/admin/medecins");
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("✅ Copié dans le presse-papier !");
  };

  const handleCloseModal = () => {
    setShowCredentialsModal(false);
    router.push("/admin/medecins");
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
      {/* En-tête */}
      <div className="mb-8">
        <Link
          href="/admin/medecins"
          className="inline-flex items-center text-[#4DB8A8] hover:text-[#3DA391] mb-4"
        >
          ← Retour à la liste
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nouveau médecin</h1>
        <p className="text-gray-600 mt-2">
          Un compte utilisateur sera automatiquement créé pour permettre au médecin de se connecter
        </p>
      </div>

      {/* Formulaire */}
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
                  placeholder="Jean"
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
                  placeholder="Dupont"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Spécialité *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.specialite}
                  onChange={(e) => setFormData({...formData, specialite: e.target.value})}
                  placeholder="Ex: Chirurgie esthétique, Dentiste, Médecin généraliste..."
                />
              </div>
            </div>
          </div>

          {/* Contact et connexion */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact et connexion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone *</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  placeholder="+212 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email * 
                  <span className="text-xs text-gray-500 ml-2">(servira d'identifiant de connexion)</span>
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="dr.dupont@exemple.com"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Important :</strong> Un mot de passe temporaire sera généré automatiquement 
                et vous sera communiqué après la création du compte. Le médecin devra le changer lors 
                de sa première connexion.
              </p>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations professionnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Clinique associée</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.cliniqueId}
                  onChange={(e) => setFormData({...formData, cliniqueId: e.target.value})}
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
                <label className="block text-sm font-medium mb-1">Numéro de licence</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.numeroLicence}
                  onChange={(e) => setFormData({...formData, numeroLicence: e.target.value})}
                  placeholder="LIC-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Années d'expérience</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.anneesExperience}
                  onChange={(e) => setFormData({...formData, anneesExperience: e.target.value})}
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">❌ Erreur</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex space-x-4 pt-6 border-t">
            <Link
              href="/admin/medecins"
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center font-medium"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </span>
              ) : (
                "Créer le médecin"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Identifiants */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Médecin créé avec succès !</h2>
              <p className="text-gray-600 mt-2">Voici les identifiants de connexion</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Important :</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Communiquez ces identifiants au médecin de manière sécurisée</li>
                <li>• Le médecin devra changer son mot de passe lors de sa première connexion</li>
                <li>• Sauvegardez ces informations, elles ne seront plus affichées</li>
              </ul>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email de connexion</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={credentials.email}
                    className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(credentials.email)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    title="Copier l'email"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe temporaire</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={credentials.password}
                    className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(credentials.password)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    title="Copier le mot de passe"
                  >
                    📋
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  const text = `Identifiants de connexion:\n\nEmail: ${credentials.email}\nMot de passe: ${credentials.password}\n\nVeuillez changer votre mot de passe lors de votre première connexion.`;
                  copyToClipboard(text);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                📋 Copier tout (format texte)
              </button>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] font-medium"
            >
              Fermer et retourner à la liste
            </button>
          </div>
        </div>
      )}
    </div>
  );
}