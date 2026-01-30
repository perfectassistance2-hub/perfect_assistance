// Fichier: app/medecin/changer-mot-de-passe/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';

export default function ChangerMotDePasseMedecinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isObligatoire = searchParams.get('obligatoire') === 'true';
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validation en temps réel
  const [validation, setValidation] = useState({
    longueur: false,
    majuscule: false,
    minuscule: false,
    chiffre: false,
    correspondance: false
  });

  useEffect(() => {
    const pwd = newPassword;
    setValidation({
      longueur: pwd.length >= 8,
      majuscule: /[A-Z]/.test(pwd),
      minuscule: /[a-z]/.test(pwd),
      chiffre: /[0-9]/.test(pwd),
      correspondance: pwd === confirmPassword && pwd.length > 0
    });
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('📤 Envoi changement mot de passe...');
    console.log('Nouveau MDP longueur:', newPassword.length);
    console.log('Validation:', validation);

    // Vérifications côté client
    if (!isObligatoire && !currentPassword) {
      setError("Veuillez saisir votre mot de passe actuel");
      setLoading(false);
      return;
    }

    if (!validation.longueur || !validation.majuscule || !validation.minuscule || !validation.chiffre) {
      setError("Le mot de passe ne respecte pas tous les critères requis");
      setLoading(false);
      return;
    }

    if (!validation.correspondance) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      const requestBody = {
        currentPassword: isObligatoire ? undefined : currentPassword,
        newPassword: newPassword,
        isFirstLogin: isObligatoire
      };

      console.log('📦 Body à envoyer:', {
        hasCurrentPassword: !!requestBody.currentPassword,
        newPasswordLength: requestBody.newPassword.length,
        isFirstLogin: requestBody.isFirstLogin
      });

      const response = await fetch('/api/medecin/changer-mot-de-passe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📊 Réponse HTTP:', response.status);

      const data = await response.json();
      console.log('📦 Réponse data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/medecin/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4DB8A8]/5 via-blue-50/30 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Mot de passe mis à jour !</h2>
          <p className="text-gray-600 mb-6">
            Votre mot de passe a été changé avec succès. Redirection...
          </p>
          <div className="animate-spin h-8 w-8 border-4 border-[#4DB8A8] border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

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
                <p className="text-xs text-gray-600">Espace Médecin</p>
              </div>
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
              <h1 className="text-3xl font-bold text-white mb-2">
                {isObligatoire ? 'Changement obligatoire' : 'Changer le mot de passe'}
              </h1>
              <p className="text-white/90">
                {isObligatoire 
                  ? 'Pour votre sécurité, veuillez définir un nouveau mot de passe'
                  : 'Modifiez votre mot de passe'
                }
              </p>
            </div>

            <div className="p-8">
              {isObligatoire && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">⚠️</span>
                    <div className="text-sm text-orange-700">
                      <p className="font-medium mb-1">Changement obligatoire</p>
                      <p className="text-orange-600">
                        Vous devez changer votre mot de passe temporaire pour accéder à votre compte.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isObligatoire && (
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400">🔒</span>
                      </div>
                      <input
                        id="currentPassword"
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔒</span>
                    </div>
                    <input
                      id="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Minimum 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Le mot de passe doit contenir :</p>
                    <ul className="space-y-1">
                      <li className={`text-xs flex items-center space-x-2 ${validation.longueur ? 'text-green-600' : 'text-gray-500'}`}>
                        <span>{validation.longueur ? '✅' : '⭕'}</span>
                        <span>Au moins 8 caractères</span>
                      </li>
                      <li className={`text-xs flex items-center space-x-2 ${validation.majuscule ? 'text-green-600' : 'text-gray-500'}`}>
                        <span>{validation.majuscule ? '✅' : '⭕'}</span>
                        <span>Une lettre majuscule</span>
                      </li>
                      <li className={`text-xs flex items-center space-x-2 ${validation.minuscule ? 'text-green-600' : 'text-gray-500'}`}>
                        <span>{validation.minuscule ? '✅' : '⭕'}</span>
                        <span>Une lettre minuscule</span>
                      </li>
                      <li className={`text-xs flex items-center space-x-2 ${validation.chiffre ? 'text-green-600' : 'text-gray-500'}`}>
                        <span>{validation.chiffre ? '✅' : '⭕'}</span>
                        <span>Un chiffre</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔒</span>
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Confirmez le mot de passe"
                    />
                  </div>
                  {confirmPassword && (
                    <p className={`text-xs mt-2 ${validation.correspondance ? 'text-green-600' : 'text-red-600'}`}>
                      {validation.correspondance ? '✅ Les mots de passe correspondent' : '❌ Les mots de passe ne correspondent pas'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !Object.values(validation).every(v => v)}
                  className="w-full py-3.5 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Changement...</span>
                    </span>
                  ) : (
                    'Changer le mot de passe'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}