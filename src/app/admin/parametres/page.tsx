// app/admin/parametres/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Parametres = {
  id?: string;
  utilisateurId: string;
  notificationsEmail: boolean;
  notificationsSms: boolean;
  notificationsPush: boolean;
  langue: string;
  fuseauHoraire: string;
  formatDate: string;
  theme: string;
};

export default function ParametresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [parametres, setParametres] = useState<Parametres>({
    utilisateurId: "",
    notificationsEmail: true,
    notificationsSms: false,
    notificationsPush: true,
    langue: "fr",
    fuseauHoraire: "Africa/Casablanca",
    formatDate: "DD/MM/YYYY",
    theme: "light",
  });

  useEffect(() => {
    loadParametres();
  }, []);

  const loadParametres = async () => {
    try {
      const userStr = localStorage.getItem("admin_user");
      if (!userStr) {
        router.push("/admin/login");
        return;
      }

      const user = JSON.parse(userStr);

      const response = await fetch(`/api/admin/parametres?utilisateurId=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setParametres({ ...data, utilisateurId: user.id });
      } else {
        // Pas de paramètres existants, garder les valeurs par défaut
        setParametres(prev => ({ ...prev, utilisateurId: user.id }));
      }
    } catch (err: any) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/parametres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parametres),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      setSuccess("Paramètres enregistrés avec succès !");
      
      // Recharger la page si le thème a changé
      if (parametres.theme !== data.parametres.theme) {
        setTimeout(() => window.location.reload(), 1000);
      }
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Paramètres</h1>
        <p className="text-gray-600">
          Gérez vos préférences et notifications
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔔 Notifications
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-500">
                  Recevoir les notifications par email
                </p>
              </div>
              <input
                type="checkbox"
                checked={parametres.notificationsEmail}
                onChange={(e) =>
                  setParametres({ ...parametres, notificationsEmail: e.target.checked })
                }
                className="w-5 h-5 text-[#4DB8A8] rounded focus:ring-[#4DB8A8]"
              />
            </label>

            <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">SMS</p>
                <p className="text-sm text-gray-500">
                  Recevoir les notifications par SMS
                </p>
              </div>
              <input
                type="checkbox"
                checked={parametres.notificationsSms}
                onChange={(e) =>
                  setParametres({ ...parametres, notificationsSms: e.target.checked })
                }
                className="w-5 h-5 text-[#4DB8A8] rounded focus:ring-[#4DB8A8]"
              />
            </label>

            <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Push</p>
                <p className="text-sm text-gray-500">
                  Recevoir les notifications push dans le navigateur
                </p>
              </div>
              <input
                type="checkbox"
                checked={parametres.notificationsPush}
                onChange={(e) =>
                  setParametres({ ...parametres, notificationsPush: e.target.checked })
                }
                className="w-5 h-5 text-[#4DB8A8] rounded focus:ring-[#4DB8A8]"
              />
            </label>
          </div>
        </div>

        {/* Préférences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🎨 Préférences d'affichage
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={parametres.langue}
                onChange={(e) =>
                  setParametres({ ...parametres, langue: e.target.value })
                }
              >
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
                <option value="ar">🇲🇦 العربية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuseau horaire
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={parametres.fuseauHoraire}
                onChange={(e) =>
                  setParametres({ ...parametres, fuseauHoraire: e.target.value })
                }
              >
                <option value="Africa/Casablanca">Casablanca (GMT+1)</option>
                <option value="Europe/Paris">Paris (GMT+1)</option>
                <option value="Europe/London">Londres (GMT+0)</option>
                <option value="America/New_York">New York (GMT-5)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format de date
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={parametres.formatDate}
                onChange={(e) =>
                  setParametres({ ...parametres, formatDate: e.target.value })
                }
              >
                <option value="DD/MM/YYYY">17/01/2026</option>
                <option value="MM/DD/YYYY">01/17/2026</option>
                <option value="YYYY-MM-DD">2026-01-17</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thème
              </label>
              <div className="grid grid-cols-3 gap-4">
                <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  parametres.theme === "light"
                    ? "border-[#4DB8A8] bg-[#4DB8A8]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={parametres.theme === "light"}
                    onChange={(e) =>
                      setParametres({ ...parametres, theme: e.target.value })
                    }
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">☀️</div>
                    <div className="font-medium">Clair</div>
                  </div>
                </label>

                <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  parametres.theme === "dark"
                    ? "border-[#4DB8A8] bg-[#4DB8A8]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={parametres.theme === "dark"}
                    onChange={(e) =>
                      setParametres({ ...parametres, theme: e.target.value })
                    }
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">🌙</div>
                    <div className="font-medium">Sombre</div>
                  </div>
                </label>

                <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  parametres.theme === "auto"
                    ? "border-[#4DB8A8] bg-[#4DB8A8]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="theme"
                    value="auto"
                    checked={parametres.theme === "auto"}
                    onChange={(e) =>
                      setParametres({ ...parametres, theme: e.target.value })
                    }
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔄</div>
                    <div className="font-medium">Auto</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton Enregistrer */}
        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? "Enregistrement..." : "💾 Enregistrer les paramètres"}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          💡 <strong>Astuce :</strong> Les paramètres sont sauvegardés automatiquement
          et s'appliquent à toutes vos sessions.
        </p>
      </div>
    </div>
  );
}