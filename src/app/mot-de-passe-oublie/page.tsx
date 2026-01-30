"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from '@/components/Footer';

export default function MotDePasseOubliePage() {
  const searchParams = useSearchParams();
  const userType = searchParams.get("type") || "patient";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/patient/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la demande");
      }

      // Afficher le nouveau mot de passe temporaire
      setNewPassword(data.motDePasseTemporaire);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    alert("Mot de passe copié !");
  };

  // Rediriger les médecins vers la page appropriée
  if (userType === "medecin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">👨‍⚕️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Compte Médecin
          </h1>
          <p className="text-gray-600 mb-6">
            Si vous avez oublié votre mot de passe, veuillez contacter l'administrateur qui pourra le réinitialiser pour vous.
          </p>
          <Link
            href="/connexion?type=medecin"
            className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4DB8A8]/5 via-blue-50/30 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/logo_perfect.jpeg"
                alt="Perfect Assistance"
                width={50}
                height={50}
                className="rounded-xl shadow-lg"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] bg-clip-text text-transparent">
                  PERFECT ASSISTANCE
                </h1>
                <p className="text-xs text-gray-600">Tourisme Médical & Hébergement</p>
              </div>
            </Link>
            <Link href="/connexion">
              <button className="text-gray-600 hover:text-[#4DB8A8] font-medium transition-colors">
                ← Retour à la connexion
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto">
          {!success ? (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header de la carte */}
              <div className="bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] px-8 py-8 text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🔐</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Mot de passe oublié ?
                </h1>
                <p className="text-white/90">
                  Pas de problème, nous allons vous aider
                </p>
              </div>

              <div className="p-8">
                {/* Instructions */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 text-xl">ℹ️</span>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Comment ça fonctionne ?</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Entrez votre adresse email</li>
                        <li>Nous générerons un nouveau mot de passe</li>
                        <li>Vous le recevrez par email</li>
                        <li>Connectez-vous avec ce mot de passe</li>
                        <li>Changez-le lors de votre première connexion</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-500">❌</span>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Votre adresse email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400">📧</span>
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                        placeholder="votre@email.com"
                        autoComplete="email"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      L'email associé à votre compte patient
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Traitement en cours...</span>
                      </span>
                    ) : (
                      "🔑 Réinitialiser mon mot de passe"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/connexion"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Retour à la connexion
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header succès */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-8 text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  C'est fait !
                </h1>
                <p className="text-white/90">
                  Votre mot de passe a été réinitialisé
                </p>
              </div>

              <div className="p-8">
                {/* Nouveau mot de passe */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Voici votre nouveau mot de passe temporaire. <strong>Copiez-le maintenant</strong>, vous devrez le changer lors de votre prochaine connexion.
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
                </div>

                {/* Instructions */}
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-500 text-xl">⚠️</span>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important :</p>
                      <ul className="list-disc list-inside space-y-1 text-yellow-700">
                        <li>Notez ce mot de passe dans un endroit sûr</li>
                        <li>Vous devrez le changer à la prochaine connexion</li>
                        <li>Un email de confirmation vous a été envoyé</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Link
                  href="/connexion"
                  className="block w-full py-3.5 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all text-center"
                >
                  → Se connecter maintenant
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Besoin d'aide ?{" "}
              <Link href="/contact" className="text-[#4DB8A8] hover:underline">
                Contactez-nous
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}