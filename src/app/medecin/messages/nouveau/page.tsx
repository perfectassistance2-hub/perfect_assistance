// Fichier: app/medecin/messages/nouveau/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

export default function NouveauMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replyToId = searchParams.get('replyTo');

  const [medecin, setMedecin] = useState<any>(null);
  const [destinataires, setDestinataires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    destinataireId: '',
    destinataireType: 'utilisateur',
    sujet: '',
    contenu: '',
    file: null as File | null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dashResponse = await fetch('/api/medecin/dashboard');
      if (!dashResponse.ok) {
        router.push('/connexion');
        return;
      }
      const dashData = await dashResponse.json();
      setMedecin(dashData.medecin);

      // Charger la liste des destinataires
      const destResponse = await fetch('/api/medecin/messages/destinataires');
      if (destResponse.ok) {
        const destData = await destResponse.json();
        setDestinataires(destData.destinataires || []);
      }

      // Si réponse à un message, charger le message original
      if (replyToId) {
        const msgResponse = await fetch(`/api/medecin/messages`);
        if (msgResponse.ok) {
          const msgData = await msgResponse.json();
          const originalMsg = msgData.messages.find((m: any) => m.id === replyToId);
          
          if (originalMsg) {
            setFormData({
              ...formData,
              destinataireId: originalMsg.expediteurId,
              destinataireType: originalMsg.expediteurType,
              sujet: originalMsg.sujet?.startsWith('Re:') 
                ? originalMsg.sujet 
                : `Re: ${originalMsg.sujet || 'Votre message'}`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux (max 10MB)');
        return;
      }

      setFormData({ ...formData, file });
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      if (!formData.destinataireId) {
        throw new Error('Veuillez sélectionner un destinataire');
      }

      if (!formData.sujet || !formData.contenu) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      let urlPieceJointe = null;
      let nomPieceJointe = null;

      // Upload fichier si présent
      if (formData.file) {
        const uploadData = new FormData();
        uploadData.append('file', formData.file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        });

        if (!uploadResponse.ok) {
          throw new Error('Erreur upload fichier');
        }

        const uploadResult = await uploadResponse.json();
        urlPieceJointe = uploadResult.url;
        nomPieceJointe = formData.file.name;
      }

      // Envoyer le message
      const response = await fetch('/api/medecin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinataireId: formData.destinataireId,
          destinataireType: formData.destinataireType,
          sujet: formData.sujet,
          contenu: formData.contenu,
          urlPieceJointe,
          nomPieceJointe
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur envoi message');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/medecin/messages');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      'SUPER_ADMIN': { color: 'bg-purple-100 text-purple-800', label: '👑 Super Admin' },
      'ADMIN': { color: 'bg-blue-100 text-blue-800', label: '🛡️ Admin' },
      'COORDINATEUR': { color: 'bg-green-100 text-green-800', label: '📋 Coordinateur' }
    };
    return badges[role] || { color: 'bg-gray-100 text-gray-800', label: role };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar medecin={medecin} />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/medecin/messages">
            <button className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center space-x-2">
              <span>←</span>
              <span>Retour aux messages</span>
            </button>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ✉️ Nouveau message
          </h1>
          <p className="text-gray-600">Contactez l'administration</p>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-green-500 text-xl">✅</span>
              <p className="text-green-700 font-medium">Message envoyé avec succès !</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8">
          <div className="space-y-6">
            {/* Destinataire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 Destinataire *
              </label>
              <select
                value={formData.destinataireId}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  destinataireId: e.target.value,
                  destinataireType: 'utilisateur'
                })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionnez un destinataire</option>
                {destinataires.map((dest) => {
                  const badge = getRoleBadge(dest.role);
                  return (
                    <option key={dest.id} value={dest.id}>
                      {dest.nom} - {badge.label} ({dest.email})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sujet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Sujet *
              </label>
              <input
                type="text"
                value={formData.sujet}
                onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                required
                placeholder="Objet de votre message"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💬 Message *
              </label>
              <textarea
                value={formData.contenu}
                onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                required
                rows={8}
                placeholder="Écrivez votre message..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Pièce jointe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📎 Pièce jointe (optionnel)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-all">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-3xl mb-2">📎</div>
                  {formData.file ? (
                    <div className="space-y-2">
                      <p className="text-green-600 font-medium">✅ {formData.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, file: null })}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-medium mb-1">
                        Cliquez pour joindre un fichier
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, JPG, PNG, DOC (Max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Link href="/medecin/messages">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
            </Link>
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Envoi...</span>
                </span>
              ) : (
                '📤 Envoyer le message'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}