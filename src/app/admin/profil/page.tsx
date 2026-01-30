// app/admin/profil/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Utilisateur = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: "SUPER_ADMIN" | "ADMIN" | "COORDINATEUR";
  telephone?: string;
  photoUrl?: string;
  dateCreation: string;
};

export default function ProfilPage() {
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Onglets
  const [activeTab, setActiveTab] = useState<"infos" | "securite">("infos");

  // Formulaire infos personnelles
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    telephone: "",
  });

  // Formulaire changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const userStr = localStorage.getItem("admin_user");
    if (!userStr) {
      router.push("/admin/login");
      return;
    }

    const user = JSON.parse(userStr);
    setUtilisateur(user);
    setFormData({
      prenom: user.prenom || "",
      nom: user.nom || "",
      telephone: user.telephone || "",
    });
    setLoading(false);
  };

  // === GESTION PHOTO ===

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image");
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    setPhotoFile(file);

    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !utilisateur) return;

    try {
      setUploadingPhoto(true);
      setError("");

      // Créer FormData
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("utilisateurId", utilisateur.id);

      const response = await fetch("/api/admin/profil/photo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      // Mettre à jour l'utilisateur
      const updatedUser = { ...utilisateur, photoUrl: data.photoUrl };
      setUtilisateur(updatedUser);
      localStorage.setItem("admin_user", JSON.stringify(updatedUser));

      setSuccess("Photo mise à jour avec succès");
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!utilisateur?.photoUrl) return;
    if (!confirm("Supprimer votre photo de profil ?")) return;

    try {
      setUploadingPhoto(true);
      setError("");

      const response = await fetch("/api/admin/profil/photo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utilisateurId: utilisateur.id }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      // Mettre à jour l'utilisateur
      const updatedUser = { ...utilisateur, photoUrl: undefined };
      setUtilisateur(updatedUser);
      localStorage.setItem("admin_user", JSON.stringify(updatedUser));

      setSuccess("Photo supprimée avec succès");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // === GESTION INFOS PERSONNELLES ===

  const handleUpdateInfos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utilisateur) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/admin/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilisateurId: utilisateur.id,
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      // Mettre à jour l'utilisateur
      const updatedUser = {
        ...utilisateur,
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
      };
      setUtilisateur(updatedUser);
      localStorage.setItem("admin_user", JSON.stringify(updatedUser));

      setSuccess("Informations mises à jour avec succès");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // === GESTION MOT DE PASSE ===

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utilisateur) return;

    // Validation
    if (passwordData.newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/admin/profil/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilisateurId: utilisateur.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du changement de mot de passe");
      }

      setSuccess("Mot de passe modifié avec succès");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  if (!utilisateur) {
    return <div>Utilisateur non trouvé</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon profil</h1>
        <p className="text-gray-600">
          Gérez vos informations personnelles et vos paramètres de sécurité
        </p>
      </div>

      {/* Alertes */}
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

      {/* Carte utilisateur */}
      <div className="bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center space-x-6">
          {/* Photo */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
              {photoPreview || utilisateur.photoUrl ? (
                <Image
                  src={photoPreview || utilisateur.photoUrl || ""}
                  alt="Photo de profil"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-4xl font-bold">
                  {utilisateur.prenom[0]}
                  {utilisateur.nom[0]}
                </span>
              )}
            </div>
          </div>

          {/* Infos */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">
              {utilisateur.prenom} {utilisateur.nom}
            </h2>
            <p className="text-white/80 mb-2">{utilisateur.email}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="px-3 py-1 bg-white/20 rounded-full">
                {utilisateur.role === "SUPER_ADMIN"
                  ? "Super Administrateur"
                  : utilisateur.role === "ADMIN"
                  ? "Administrateur"
                  : "Coordinateur"}
              </span>
              <span className="text-white/60">
                Membre depuis{" "}
                {new Date(utilisateur.dateCreation).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("infos")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "infos"
                ? "text-[#4DB8A8] border-b-2 border-[#4DB8A8]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            👤 Informations personnelles
          </button>
          <button
            onClick={() => setActiveTab("securite")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "securite"
                ? "text-[#4DB8A8] border-b-2 border-[#4DB8A8]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🔒 Sécurité
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "infos" && (
        <div className="space-y-6">
          {/* Photo de profil */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Photo de profil
            </h3>

            <div className="flex items-start space-x-6">
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {photoPreview || utilisateur.photoUrl ? (
                  <Image
                    src={photoPreview || utilisateur.photoUrl || ""}
                    alt="Photo de profil"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-5xl font-bold text-gray-400">
                    {utilisateur.prenom[0]}
                    {utilisateur.nom[0]}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 mb-3"
                >
                  📷 Choisir une photo
                </label>

                {photoPreview && (
                  <button
                    onClick={handleUploadPhoto}
                    disabled={uploadingPhoto}
                    className="ml-2 px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] disabled:opacity-50"
                  >
                    {uploadingPhoto ? "Upload..." : "✓ Enregistrer"}
                  </button>
                )}

                {utilisateur.photoUrl && !photoPreview && (
                  <button
                    onClick={handleDeletePhoto}
                    disabled={uploadingPhoto}
                    className="ml-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    🗑️ Supprimer
                  </button>
                )}

                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG ou GIF. Max 5MB. Recommandé : 400x400px
                </p>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informations personnelles
            </h3>

            <form onSubmit={handleUpdateInfos} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (non modifiable)
                </label>
                <input
                  type="email"
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  value={utilisateur.email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  placeholder="+212 6XX XXX XXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={formData.telephone}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Enregistrement..." : "💾 Enregistrer les modifications"}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "securite" && (
        <div className="space-y-6">
          {/* Changement de mot de passe */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Changer le mot de passe
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? "Changement..."
                  : "🔒 Changer le mot de passe"}
              </button>
            </form>
          </div>

          {/* Informations de sécurité */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-2">
              💡 Conseils de sécurité
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Utilisez un mot de passe unique et complexe</li>
              <li>• Ne partagez jamais votre mot de passe</li>
              <li>• Changez votre mot de passe régulièrement</li>
              <li>• Déconnectez-vous après chaque session</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}