// Fichier: app/medecin/profil/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

export default function ProfilPage() {
  const router = useRouter();
  const [medecin, setMedecin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    specialite: '',
    numeroLicence: '',
    anneesExperience: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/medecin/profil');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur chargement');
      }

      const data = await response.json();
      setMedecin(data.medecin);
      
      setFormData({
        prenom: data.medecin.prenom || '',
        nom: data.medecin.nom || '',
        telephone: data.medecin.telephone || '',
        specialite: data.medecin.specialite || '',
        numeroLicence: data.medecin.numeroLicence || '',
        anneesExperience: data.medecin.anneesExperience || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/medecin/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur sauvegarde');
      }

      const data = await response.json();
      setMedecin(data.medecin);
      setSuccess(true);
      setEditing(false);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      prenom: medecin.prenom || '',
      nom: medecin.nom || '',
      telephone: medecin.telephone || '',
      specialite: medecin.specialite || '',
      numeroLicence: medecin.numeroLicence || '',
      anneesExperience: medecin.anneesExperience || ''
    });
    setEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!medecin) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar medecin={medecin} />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👤 Mon Profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-green-500 text-xl">✅</span>
              <p className="text-green-700 font-medium">Profil mis à jour avec succès !</p>
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

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900">Informations personnelles</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
                  >
                    ✏️ Modifier
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.prenom}
                          onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                          {medecin.prenom}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                          {medecin.nom}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📧 Email
                    </label>
                    <p className="px-4 py-3 bg-gray-100 rounded-xl text-gray-600">
                      {medecin.email}
                      <span className="ml-2 text-xs text-gray-500">(non modifiable)</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📱 Téléphone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {medecin.telephone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏥 Spécialité
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.specialite}
                        onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {medecin.specialite}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📜 Numéro de licence
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.numeroLicence}
                          onChange={(e) => setFormData({ ...formData, numeroLicence: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                          {medecin.numeroLicence || 'Non renseigné'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📅 Années d&apos;expérience
                      </label>
                      {editing ? (
                        <input
                          type="number"
                          value={formData.anneesExperience}
                          onChange={(e) => setFormData({ ...formData, anneesExperience: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                          {medecin.anneesExperience || 'Non renseigné'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="flex items-center space-x-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Enregistrement...</span>
                        </span>
                      ) : (
                        'Enregistrer les modifications'
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {medecin.clinique && (
              <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">🏥 Clinique affiliée</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">{medecin.clinique.nom}</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>📍 {medecin.clinique.ville}, {medecin.clinique.pays}</p>
                    {medecin.clinique.telephone && (
                      <p>📞 {medecin.clinique.telephone}</p>
                    )}
                    {medecin.clinique.email && (
                      <p>📧 {medecin.clinique.email}</p>
                    )}
                    {medecin.clinique.siteWeb && (
                      <a
                        href={medecin.clinique.siteWeb}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block"
                      >
                        🌐 Visiter le site web
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-6">🔐 Sécurité</h3>
              <div className="space-y-4">
                <Link href="/medecin/changer-mot-de-passe">
                  <button className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left rounded-xl transition-all">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🔑</span>
                      <div>
                        <p className="font-medium text-gray-900">Changer le mot de passe</p>
                        <p className="text-xs text-gray-500">Modifier votre mot de passe</p>
                      </div>
                    </div>
                  </button>
                </Link>

                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-gray-700">
                    <span className="text-green-600 font-medium">✅ Compte actif</span>
                  </p>
                  {medecin.derniereConnexion && (
                    <p className="text-xs text-gray-600 mt-1">
                      Dernière connexion : {new Date(medecin.derniereConnexion).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">💡 Besoin d&apos;aide ?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Notre équipe est disponible pour vous accompagner
              </p>
              <Link href="/medecin/messages/nouveau">
                <button className="w-full px-4 py-3 bg-white hover:bg-gray-50 text-blue-700 font-medium rounded-xl transition-all border border-blue-200">
                  📧 Contacter le support
                </button>
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">📊 Informations du compte</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de création</span>
                  <span className="font-medium text-gray-900">
                    {new Date(medecin.dateCreation).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière mise à jour</span>
                  <span className="font-medium text-gray-900">
                    {new Date(medecin.dateMiseAJour).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}