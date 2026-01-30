"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    motDePasse: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur de connexion");
      }

      // Sauvegarder l'utilisateur dans le localStorage
      localStorage.setItem("admin_user", JSON.stringify(data.utilisateur));

      // Redirection vers le dashboard
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4DB8A8]/10 to-[#E75B3F]/10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/images/logo_perfect.jpeg"
            alt="Perfect Assistance"
            width={150}
            height={150}
            className="mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            Connexion Administrateur
          </h1>
          <p className="text-gray-600 mt-2">Perfect Assistance</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
              placeholder="admin@perfectassistance.ma"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
              placeholder="••••••••"
              value={formData.motDePasse}
              onChange={(e) =>
                setFormData({ ...formData, motDePasse: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4DB8A8] text-white py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Mot de passe oublié ? Contactez l'administrateur</p>
        </div>
      </div>
    </div>
  );
}