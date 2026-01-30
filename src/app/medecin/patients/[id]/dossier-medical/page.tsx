// Fichier: app/medecin/patients/[id]/dossier-medical/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

export default function EditerDossierMedicalPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [medecin, setMedecin] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    groupeSanguin: '',
    allergies: '',
    maladiesChroniques: '',
    medicamentsActuels: '',
    antecedentsChirurgicaux: '',
    antecedentsFamiliaux: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      // Charger le médecin
      const dashResponse = await fetch('/api/medecin/dashboard');
      if (!dashResponse.ok) {
        router.push('/connexion');
        return;
      }
      const dashData = await dashResponse.json();
      setMedecin(dashData.medecin);

      // Charger le patient et dossier
      const response = await fetch(`/api/medecin/patients/${patientId}`);
      if (!response.ok) {
        throw new Error('Erreur chargement');
      }
      const data = await response.json();
      setPatient(data.patient);

      // Pré-remplir si dossier existe
      if (data.dossierMedical) {
        setFormData({
          groupeSanguin: data.dossierMedical.groupeSanguin || '',
          allergies: data.dossierMedical.allergies || '',
          maladiesChroniques: data.dossierMedical.maladiesChroniques || '',
          medicamentsActuels: data.dossierMedical.medicamentsActuels || '',
          antecedentsChirurgicaux: data.dossierMedical.antecedentsChirurgicaux || '',
          antecedentsFamiliaux: data.dossierMedical.antecedentsFamiliaux || '',
          notes: data.dossierMedical.notes || ''
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/medecin/patients');
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
      const response = await fetch(`/api/medecin/patients/${patientId}/dossier-medical`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur sauvegarde');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/medecin/patients/${patientId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
                Dossier médical - {patient.prenom} {patient.nom}
              </h1>
              <p className="text-gray-600">Complétez les informations médicales du patient</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-green-500 text-xl">✅</span>
              <p className="text-green-700 font-medium">Dossier médical enregistré avec succès !</p>
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
            {/* Groupe sanguin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🩸 Groupe sanguin
              </label>
              <select
                value={formData.groupeSanguin}
                onChange={(e) => setFormData({ ...formData, groupeSanguin: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionnez le groupe sanguin</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⚠️ Allergies connues
              </label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                rows={3}
                placeholder="Médicaments, aliments, substances... (ex: Pénicilline, Arachides, Pollen)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Listez toutes les allergies connues du patient
              </p>
            </div>

            {/* Maladies chroniques */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏥 Maladies chroniques
              </label>
              <textarea
                value={formData.maladiesChroniques}
                onChange={(e) => setFormData({ ...formData, maladiesChroniques: e.target.value })}
                rows={3}
                placeholder="Diabète, hypertension, asthme... (ex: Diabète type 2 depuis 2015)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Médicaments actuels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💊 Médicaments actuels
              </label>
              <textarea
                value={formData.medicamentsActuels}
                onChange={(e) => setFormData({ ...formData, medicamentsActuels: e.target.value })}
                rows={4}
                placeholder="Nom du médicament, dosage, fréquence... (ex: Metformine 500mg, 2x/jour)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Incluez tous les médicaments, vitamines et suppléments pris régulièrement
              </p>
            </div>

            {/* Antécédents chirurgicaux */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔪 Antécédents chirurgicaux
              </label>
              <textarea
                value={formData.antecedentsChirurgicaux}
                onChange={(e) => setFormData({ ...formData, antecedentsChirurgicaux: e.target.value })}
                rows={3}
                placeholder="Opérations passées avec dates... (ex: Appendicectomie en 2018)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Antécédents familiaux */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👨‍👩‍👧‍👦 Antécédents familiaux
              </label>
              <textarea
                value={formData.antecedentsFamiliaux}
                onChange={(e) => setFormData({ ...formData, antecedentsFamiliaux: e.target.value })}
                rows={3}
                placeholder="Maladies dans la famille... (ex: Père diabétique, Mère hypertendue)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notes supplémentaires */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Notes supplémentaires
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Informations complémentaires, observations cliniques, recommandations..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                'Enregistrer le dossier médical'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}