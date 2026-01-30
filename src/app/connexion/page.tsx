"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

export default function ConnexionPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'patient' | 'medecin'>('patient');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Tentative connexion:', { userType, email });

      const endpoint = userType === 'patient' 
        ? '/api/auth/patient/login'
        : '/api/auth/medecin/login';

      console.log('📡 Endpoint appelé:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse })
      });

      console.log('📊 Statut HTTP:', response.status);

      const data = await response.json();
      console.log('📦 Réponse:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // ✅ Vérifier si changement de mot de passe obligatoire
      if (data.doitChangerMotDePasse) {
        console.log('🔑 Changement MDP obligatoire');
        router.push(`/${userType}/changer-mot-de-passe?obligatoire=true`);
        return;
      }

      // ✅ Vérifier si première connexion (ancien système)
      if (data.premiereConnexion) {
        console.log('🆕 Première connexion');
        router.push(`/${userType}/changer-mot-de-passe?first=true`);
        return;
      }

      // ✅ Connexion normale
      console.log('✅ Connexion réussie - Redirection dashboard');
      router.push(`/${userType}/dashboard`);

    } catch (err: any) {
      console.error('❌ Erreur connexion:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4DB8A8]/5 via-blue-50/30 to-white">
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
            <Link href="/">
              <button className="text-gray-600 hover:text-[#4DB8A8] font-medium transition-colors">
                ← Retour à l'accueil
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] px-8 py-8 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔐</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Connexion</h1>
              <p className="text-white/90">Accédez à votre espace personnel</p>
            </div>

            <div className="p-8">
              {/* User Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Je suis :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUserType('patient');
                      setError('');
                    }}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      userType === 'patient'
                        ? 'bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👤 Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserType('medecin');
                      setError('');
                    }}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      userType === 'medecin'
                        ? 'bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👨‍⚕️ Médecin
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
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
                </div>

                <div>
                  <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔒</span>
                    </div>
                    <input
                      id="motDePasse"
                      type={showPassword ? 'text' : 'password'}
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Mot de passe oublié */}
                <div className="text-right">
                  <Link 
                    href={`/mot-de-passe-oublie?type=${userType}`} 
                    className="text-sm text-[#4DB8A8] hover:text-[#3DA391] font-medium"
                  >
                    Mot de passe oublié ?
                  </Link>
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
                      <span>Connexion...</span>
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>

              {userType === 'patient' && (
                <>
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">Pas encore de compte ?</span>
                    </div>
                  </div>

                  <Link href="/inscription">
                    <button className="w-full py-3.5 border-2 border-[#4DB8A8] text-[#4DB8A8] font-bold rounded-xl hover:bg-[#4DB8A8]/5 transition-all">
                      Créer un compte
                    </button>
                  </Link>
                </>
              )}

              {userType === 'medecin' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">ℹ️</span>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Compte médecin</p>
                      <p className="text-blue-600">
                        Utilisez les identifiants qui vous ont été communiqués par l'administrateur.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              En vous connectant, vous acceptez nos{' '}
              <Link href="/conditions" className="text-[#4DB8A8] hover:underline">
                Conditions d'utilisation
              </Link>{' '}
              et notre{' '}
              <Link href="/confidentialite" className="text-[#4DB8A8] hover:underline">
                Politique de confidentialité
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}