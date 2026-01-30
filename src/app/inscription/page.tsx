// Fichier: app/inscription/page.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

export default function InscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Data - Seulement les champs essentiels
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    pays: '',
    motDePasse: '',
    confirmMotDePasse: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.prenom || !formData.nom || !formData.email || !formData.telephone || !formData.pays || !formData.motDePasse) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Adresse email invalide');
      setLoading(false);
      return;
    }

    if (formData.motDePasse.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      console.log('Envoi inscription:', formData.email);

      const response = await fetch('/api/auth/patient/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      console.log('Réponse inscription:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Rediriger vers le dashboard
      console.log('Inscription réussie, redirection...');
      router.push('/patient/dashboard?welcome=true');
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4DB8A8]/5 via-blue-50/30 to-white">
      {/* Header Simple */}
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
              <button className="px-6 py-2.5 text-[#4DB8A8] font-medium hover:bg-[#4DB8A8]/10 rounded-xl transition-colors">
                Connexion
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] px-8 py-8 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✨</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Créer votre compte</h1>
              <p className="text-white/90">Rejoignez Perfect Assistance en quelques clics</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Nom et Prénom */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">📧</span>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">📱</span>
                    </div>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Format international recommandé</p>
                </div>

                {/* Pays - SAISIE LIBRE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">🌍</span>
                    </div>
                    <input
                      type="text"
                      name="pays"
                      value={formData.pays}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Ex: Maroc, France, Belgique..."
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔒</span>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="motDePasse"
                      value={formData.motDePasse}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Minimum 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Au moins 8 caractères</p>
                </div>

                {/* Confirmer mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔒</span>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmMotDePasse"
                      value={formData.confirmMotDePasse}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Confirmez votre mot de passe"
                    />
                  </div>
                </div>

                {/* Info box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">ℹ️</span>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Informations complémentaires</p>
                      <p className="text-blue-600">
                        Vous pourrez compléter votre profil (date de naissance, adresse, documents) 
                        après votre inscription dans les paramètres de votre compte.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Création du compte...</span>
                    </span>
                  ) : (
                    'Créer mon compte ✨'
                  )}
                </button>
              </div>

              {/* Lien connexion */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Vous avez déjà un compte ?{' '}
                  <Link href="/connexion" className="text-[#4DB8A8] hover:text-[#3DA391] font-medium">
                    Se connecter
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}