// Fichier: app/medecin/patients/[id]/documents/nouveau/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

export default function AjouterDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [medecin, setMedecin] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    type: '',
    titre: '',
    description: '',
    file: null as File | null
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      const dashResponse = await fetch('/api/medecin/dashboard');
      if (!dashResponse.ok) {
        router.push('/connexion');
        return;
      }
      const dashData = await dashResponse.json();
      setMedecin(dashData.medecin);

      const response = await fetch(`/api/medecin/patients/${patientId}`);
      if (!response.ok) {
        throw new Error('Erreur chargement');
      }
      const data = await response.json();
      setPatient(data.patient);
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/medecin/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier la taille (max 10MB)
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
    setUploading(true);
    setError('');

    try {
      if (!formData.file) {
        throw new Error('Veuillez sélectionner un fichier');
      }

      if (!formData.type || !formData.titre) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Créer FormData pour l'upload
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('type', formData.type);
      uploadData.append('titre', formData.titre);
      uploadData.append('description', formData.description);

      // Upload du fichier via l'API médecin
      const uploadResponse = await fetch(`/api/medecin/patients/${patientId}/upload`, {
        method: 'POST',
        body: uploadData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Erreur upload fichier');
      }

      const uploadResult = await uploadResponse.json();

      // Redirection avec message de succès
      router.push(`/medecin/patients/${patientId}?tab=documents`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!patient || !medecin) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar medecin={medecin} />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/medecin/patients/${patientId}`}>
            <button className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center space-x-2">
              <span>←</span>
              <span>Retour au dossier patient</span>
            </button>
          </Link>

          <div className="flex items-center space-x-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl text-white font-bold">
                {patient.prenom[0]}{patient.nom[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ajouter un document - {patient.prenom} {patient.nom}
              </h1>
              <p className="text-gray-600">Examens médicaux, ordonnances, passeports, cartes d'identité...</p>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
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
            {/* Type de document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Type de document *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionnez un type</option>
                <option value="PASSEPORT">🛂 Passeport</option>
                <option value="CARTE_IDENTITE">🪪 Carte d'identité</option>
                <option value="EXAMEN_MEDICAL">🩺 Examen médical</option>
                <option value="ORDONNANCE">💊 Ordonnance</option>
                <option value="FACTURE">🧾 Facture</option>
                <option value="RECU">📄 Reçu</option>
                <option value="AUTRE">📎 Autre</option>
              </select>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Titre du document *
              </label>
              <input
                type="text"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                required
                placeholder="Ex: Examen médical complet - 15/01/2026"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💬 Description (optionnel)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Détails supplémentaires sur le document..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Upload fichier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📎 Fichier *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-all">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  id="file-upload"
                  required
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-3">📤</div>
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
                        Changer le fichier
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-medium mb-1">
                        Cliquez pour sélectionner un fichier
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, JPG, PNG, DOC (Max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">ℹ️</span>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Information importante</p>
                  <p>
                    Ce document sera automatiquement partagé et visible par l'administrateur et le patient concerné.
                    Assurez-vous que les informations sont correctes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Link href={`/medecin/patients/${patientId}`}>
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
            </Link>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Téléversement...</span>
                </span>
              ) : (
                '📤 Ajouter le document'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}