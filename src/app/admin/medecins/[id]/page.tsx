"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Medecin = {
  id: string;
  prenom: string;
  nom: string;
  specialite: string;
  telephone: string;
  email: string;
  numeroLicence: string | null;
  anneesExperience: number | null;
  estActif: boolean;
  doitChangerMotDePasse?: boolean;
  derniereConnexion?: string | null;
  dateCreation: string;
  clinique: {
    id: string;
    nom: string;
    ville: string;
    telephone: string;
  } | null;
  rendez_vous?: { count: number }[];
  sejours?: { count: number }[];
};

type Clinique = {
  id: string;
  nom: string;
  ville: string;
};

export default function MedecinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const medecinId = params.id as string;

  const [medecin, setMedecin] = useState<Medecin | null>(null);
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  // États pour la réinitialisation du mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

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
    loadMedecin();
    loadCliniques();
  }, [medecinId]);

  const loadMedecin = async () => {
    try {
      const response = await fetch(`/api/admin/medecins/${medecinId}`);
      if (response.ok) {
        const data = await response.json();
        setMedecin(data);
        setFormData({
          prenom: data.prenom,
          nom: data.nom,
          specialite: data.specialite,
          telephone: data.telephone,
          email: data.email,
          cliniqueId: data.clinique?.id || "",
          numeroLicence: data.numeroLicence || "",
          anneesExperience: data.anneesExperience?.toString() || "",
        });
      } else {
        setError("Médecin non trouvé");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadCliniques = async () => {
    try {
      const response = await fetch("/api/admin/cliniques");
      if (response.ok) {
        setCliniques(await response.json());
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/medecins/${medecinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cliniqueId: formData.cliniqueId || null,
          numeroLicence: formData.numeroLicence || null,
          anneesExperience: formData.anneesExperience ? parseInt(formData.anneesExperience) : null,
        }),
      });

      if (response.ok) {
        setSuccess("✅ Modifications enregistrées avec succès");
        setEditing(false);
        loadMedecin();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erreur de mise à jour");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!medecin) return;
    
    try {
      await fetch(`/api/admin/medecins/${medecinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estActif: !medecin.estActif }),
      });
      loadMedecin();
      setSuccess(medecin.estActif ? "Médecin désactivé" : "Médecin activé");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Erreur lors de la modification");
    }
  };

  // Nouvelle fonction pour réinitialiser le mot de passe
  const handleResetPassword = async () => {
    if (!confirm("Voulez-vous vraiment réinitialiser le mot de passe de ce médecin ? Un nouveau mot de passe temporaire sera généré.")) {
      return;
    }

    setResettingPassword(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/medecins/${medecinId}/reset-password`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la réinitialisation");
      }

      // Afficher le modal avec le nouveau mot de passe
      setNewPassword(data.motDePasseTemporaire);
      setShowPasswordModal(true);
      setSuccess("✅ Mot de passe réinitialisé avec succès");
      loadMedecin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  // Fonction pour copier le mot de passe
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setSuccess("📋 Mot de passe copié dans le presse-papiers !");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("⚠️ Attention : Supprimer ce médecin supprimera aussi son compte utilisateur et toutes les données associées. Cette action est irréversible. Continuer ?")) return;

    try {
      const response = await fetch(`/api/admin/medecins/${medecinId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/medecins?message=deleted");
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      setError("Erreur lors de la suppression");
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError("");
    // Restaurer les données originales
    if (medecin) {
      setFormData({
        prenom: medecin.prenom,
        nom: medecin.nom,
        specialite: medecin.specialite,
        telephone: medecin.telephone,
        email: medecin.email,
        cliniqueId: medecin.clinique?.id || "",
        numeroLicence: medecin.numeroLicence || "",
        anneesExperience: medecin.anneesExperience?.toString() || "",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  if (error && !medecin) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">Erreur</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Link
            href="/admin/medecins"
            className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg hover:bg-[#3DA391]"
          >
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  if (!medecin) return null;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <Link
          href="/admin/medecins"
          className="inline-flex items-center text-[#4DB8A8] hover:text-[#3DA391] mb-4"
        >
          ← Retour à la liste
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl">
              {medecin.prenom[0]}{medecin.nom[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dr. {medecin.prenom} {medecin.nom}
              </h1>
              <p className="text-gray-600 text-lg mt-1">{medecin.specialite}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                medecin.estActif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}>
                {medecin.estActif ? "✓ Actif" : "⏸ Inactif"}
              </span>
            </div>
          </div>

          {!editing && (
            <div className="flex space-x-3">
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 font-medium"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="bg-purple-50 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100 font-medium disabled:opacity-50"
                title="Réinitialiser le mot de passe"
              >
                {resettingPassword ? "⏳" : "🔑"} MDP
              </button>
              <button
                onClick={handleToggleActive}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium"
              >
                {medecin.estActif ? "⏸️ Désactiver" : "▶️ Activer"}
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium"
              >
                🗑️ Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Avertissement si doit changer le mot de passe */}
      {medecin.doitChangerMotDePasse && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center space-x-2">
          <span>⚠️</span>
          <span>Ce médecin doit changer son mot de passe à la prochaine connexion</span>
        </div>
      )}

      {/* Formulaire d'édition ou affichage */}
      {editing ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Modifier les informations</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Spécialité *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                    value={formData.specialite}
                    onChange={(e) => setFormData({...formData, specialite: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Informations professionnelles */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations professionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Clinique</label>
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
                  />
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                disabled={saving}
              >
                Annuler
              </button>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations personnelles */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Prénom</p>
                  <p className="text-lg font-medium">{medecin.prenom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nom</p>
                  <p className="text-lg font-medium">{medecin.nom}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Spécialité</p>
                  <p className="text-lg font-medium">{medecin.specialite}</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Contact</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="text-lg font-medium">{medecin.telephone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-lg font-medium">{medecin.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations professionnelles */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Informations professionnelles</h2>
              <div className="space-y-4">
                {medecin.clinique && (
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">🏥</span>
                    <div>
                      <p className="text-sm text-gray-600">Clinique</p>
                      <p className="text-lg font-medium">{medecin.clinique.nom}</p>
                      <p className="text-sm text-gray-500">{medecin.clinique.ville}</p>
                      {medecin.clinique.telephone && (
                        <p className="text-sm text-gray-500">📞 {medecin.clinique.telephone}</p>
                      )}
                    </div>
                  </div>
                )}

                {medecin.numeroLicence && (
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <p className="text-sm text-gray-600">Numéro de licence</p>
                      <p className="text-lg font-medium">{medecin.numeroLicence}</p>
                    </div>
                  </div>
                )}

                {medecin.anneesExperience && (
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="text-sm text-gray-600">Années d'expérience</p>
                      <p className="text-lg font-medium">{medecin.anneesExperience} ans</p>
                    </div>
                  </div>
                )}

                {!medecin.clinique && !medecin.numeroLicence && !medecin.anneesExperience && (
                  <p className="text-gray-500 text-sm italic">Aucune information professionnelle supplémentaire</p>
                )}
              </div>
            </div>
          </div>

          {/* Statistiques et infos */}
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Rendez-vous</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {medecin.rendez_vous?.[0]?.count || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Séjours</p>
                  <p className="text-3xl font-bold text-green-900">
                    {medecin.sejours?.[0]?.count || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations système */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Informations système</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="text-sm font-medium">
                    {new Date(medecin.dateCreation).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {medecin.derniereConnexion && (
                  <div>
                    <p className="text-sm text-gray-600">Dernière connexion</p>
                    <p className="text-sm font-medium">
                      {new Date(medecin.derniereConnexion).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">ID</p>
                  <p className="text-xs font-mono text-gray-500">{medecin.id}</p>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
              <div className="space-y-2">
                <button
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                  className="w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-medium text-sm disabled:opacity-50"
                >
                  {resettingPassword ? "⏳ Réinitialisation..." : "🔑 Réinitialiser le mot de passe"}
                </button>
                <button
                  onClick={handleToggleActive}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                >
                  {medecin.estActif ? "⏸️ Désactiver le médecin" : "▶️ Activer le médecin"}
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm"
                >
                  🗑️ Supprimer le médecin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de mot de passe temporaire */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Mot de passe temporaire</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Voici le nouveau mot de passe temporaire pour <strong>Dr. {medecin.prenom} {medecin.nom}</strong> :
              </p>
              
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                <p className="text-center font-mono text-lg font-bold text-gray-900 break-all">
                  {newPassword}
                </p>
              </div>

              <button
                onClick={handleCopyPassword}
                className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium mb-4"
              >
                📋 Copier le mot de passe
              </button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Important :</strong> Le médecin devra changer ce mot de passe lors de sa prochaine connexion. Assurez-vous de lui communiquer ce mot de passe de manière sécurisée.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPasswordModal(false)}
              className="w-full px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}