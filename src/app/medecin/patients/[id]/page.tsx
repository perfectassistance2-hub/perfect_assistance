// Fichier: app/medecin/patients/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

export default function DetailPatientPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params.id as string;

  const [medecin, setMedecin] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'infos' | 'dossier' | 'documents' | 'historique'>('infos');

  useEffect(() => {
    // Récupérer l'onglet depuis l'URL
    const tab = searchParams.get('tab');
    if (tab && ['infos', 'dossier', 'documents', 'historique'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

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

      // Charger le patient
      const patientResponse = await fetch(`/api/medecin/patients/${patientId}`);
      if (!patientResponse.ok) {
        throw new Error('Erreur chargement patient');
      }
      const patientData = await patientResponse.json();
      setData(patientData);
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/medecin/patients');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateNaissance: string) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleViewDocument = async (documentId: string) => {
    // Ouvrir directement l'URL de l'API dans un nouvel onglet
    const viewUrl = `/api/medecin/patients/${patientId}/documents/${documentId}/view`;
    window.open(viewUrl, '_blank');
  };

  const handleDownloadDocument = async (documentId: string) => {
    // Créer un lien temporaire pour déclencher le téléchargement
    const downloadUrl = `/api/medecin/patients/${patientId}/documents/${documentId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = ''; // Force le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDocument = async (documentId: string, titre: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le document "${titre}" ?`)) {
      return;
    }

    setDeletingDocId(documentId);

    try {
      const response = await fetch(`/api/medecin/patients/${patientId}/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la suppression');
        return;
      }

      // Recharger les données
      await loadData();
      alert('Document supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingDocId(null);
    }
  };

  const getDocumentTypeInfo = (type: string) => {
    const types: Record<string, { icon: string; label: string; color: string }> = {
      'PASSEPORT': { icon: '🛂', label: 'Passeport', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'CARTE_IDENTITE': { icon: '🪪', label: 'Carte d\'identité', color: 'bg-green-100 text-green-800 border-green-200' },
      'EXAMEN_MEDICAL': { icon: '🩺', label: 'Examen médical', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      'ORDONNANCE': { icon: '💊', label: 'Ordonnance', color: 'bg-pink-100 text-pink-800 border-pink-200' },
      'FACTURE': { icon: '🧾', label: 'Facture', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'RECU': { icon: '📄', label: 'Reçu', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'AUTRE': { icon: '📎', label: 'Autre', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    return types[type] || types['AUTRE'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data || !medecin) return null;

  const { patient, dossierMedical, sejours, rendezVous, documents } = data;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar medecin={medecin} />

      <main className="flex-1 ml-64 p-8">
        {/* Header avec retour */}
        <div className="mb-6">
          <Link href="/medecin/patients">
            <button className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center space-x-2">
              <span>←</span>
              <span>Retour aux patients</span>
            </button>
          </Link>
        </div>

        {/* Carte patient */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-3xl text-white font-bold">
                  {patient.prenom[0]}{patient.nom[0]}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {patient.prenom} {patient.nom}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span>{calculateAge(patient.dateNaissance)} ans</span>
                  <span>•</span>
                  <span>{patient.sexe}</span>
                  <span>•</span>
                  <span>🌍 {patient.pays}</span>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>📧 {patient.email}</span>
                  <span>•</span>
                  <span>📱 {patient.telephone}</span>
                </div>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              patient.statut === 'ACTIF'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {patient.statut}
            </span>
          </div>

          {/* Séjour en cours */}
          {sejours.length > 0 && sejours[0].statut === 'EN_COURS' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-600 font-medium">🏥 Séjour en cours</span>
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>{sejours[0].typeTraitement}</strong>
                </p>
                <p className="text-xs text-gray-600">
                  Du {new Date(sejours[0].dateArrivee).toLocaleDateString('fr-FR')} au {new Date(sejours[0].dateDepart).toLocaleDateString('fr-FR')}
                </p>
                {sejours[0].clinique && (
                  <p className="text-xs text-gray-600 mt-1">
                    📍 {sejours[0].clinique.nom}, {sejours[0].clinique.ville}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-t-2xl shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('infos')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'infos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Informations
            </button>
            <button
              onClick={() => setActiveTab('dossier')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'dossier'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏥 Dossier médical
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-6 py-4 font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'documents'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>📄 Documents</span>
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {documents.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'historique'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Historique
            </button>
          </div>

          <div className="p-6">
            {/* Onglet Informations */}
            {activeTab === 'infos' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Informations personnelles</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Date de naissance</p>
                      <p className="font-medium text-gray-900">
                        {new Date(patient.dateNaissance).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Nationalité</p>
                      <p className="font-medium text-gray-900">{patient.nationalite || 'Non renseignée'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Adresse</p>
                      <p className="font-medium text-gray-900">{patient.adresse || 'Non renseignée'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Ville / Pays</p>
                      <p className="font-medium text-gray-900">
                        {patient.ville || 'Non renseignée'} / {patient.pays}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Séjours */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Séjours médicaux</h3>
                  {sejours.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">Aucun séjour enregistré</p>
                  ) : (
                    <div className="space-y-3">
                      {sejours.map((sejour: any) => (
                        <div key={sejour.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{sejour.typeTraitement}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Du {new Date(sejour.dateArrivee).toLocaleDateString('fr-FR')} au {new Date(sejour.dateDepart).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sejour.statut === 'EN_COURS'
                                ? 'bg-green-100 text-green-700'
                                : sejour.statut === 'TERMINE'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {sejour.statut}
                            </span>
                          </div>
                          {sejour.clinique && (
                            <p className="text-sm text-gray-600">
                              📍 {sejour.clinique.nom}, {sejour.clinique.ville}
                            </p>
                          )}
                          {sejour.descriptionTraitement && (
                            <p className="text-sm text-gray-600 mt-2">{sejour.descriptionTraitement}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Onglet Dossier médical */}
            {activeTab === 'dossier' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Dossier médical</h3>
                
                {!dossierMedical ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">🏥</span>
                    <p className="text-gray-600">Aucun dossier médical disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dossierMedical.groupeSanguin && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Groupe sanguin</p>
                        <p className="font-medium text-gray-900">{dossierMedical.groupeSanguin}</p>
                      </div>
                    )}
                    
                    {dossierMedical.allergies && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">⚠️ Allergies</p>
                        <p className="font-medium text-gray-900">{dossierMedical.allergies}</p>
                      </div>
                    )}

                    {dossierMedical.maladiesChroniques && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Maladies chroniques</p>
                        <p className="font-medium text-gray-900">{dossierMedical.maladiesChroniques}</p>
                      </div>
                    )}

                    {dossierMedical.medicamentsActuels && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">💊 Médicaments actuels</p>
                        <p className="font-medium text-gray-900">{dossierMedical.medicamentsActuels}</p>
                      </div>
                    )}

                    {dossierMedical.antecedentsChirurgicaux && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Antécédents chirurgicaux</p>
                        <p className="font-medium text-gray-900">{dossierMedical.antecedentsChirurgicaux}</p>
                      </div>
                    )}

                    {dossierMedical.antecedentsFamiliaux && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Antécédents familiaux</p>
                        <p className="font-medium text-gray-900">{dossierMedical.antecedentsFamiliaux}</p>
                      </div>
                    )}

                    {dossierMedical.notes && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">📝 Notes supplémentaires</p>
                        <p className="font-medium text-gray-900">{dossierMedical.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Onglet Documents */}
            {activeTab === 'documents' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Documents médicaux</h3>
                  <Link href={`/medecin/patients/${patientId}/documents/nouveau`}>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all">
                      📤 Ajouter un document
                    </button>
                  </Link>
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📄</span>
                    <p className="text-gray-600 mb-4">Aucun document disponible</p>
                    <Link href={`/medecin/patients/${patientId}/documents/nouveau`}>
                      <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all">
                        Ajouter le premier document
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc: any) => {
                      const typeInfo = getDocumentTypeInfo(doc.type);
                      const isAddedByMedecin = doc.ajoutePar === 'medecin';
                      
                      return (
                        <div key={doc.id} className={`border rounded-xl p-4 hover:border-blue-300 transition-all ${typeInfo.color} border-2`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-2xl">{typeInfo.icon}</span>
                                <div>
                                  <h4 className="font-medium text-gray-900">{doc.titre}</h4>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                                    {typeInfo.label}
                                  </span>
                                </div>
                              </div>
                              {doc.description && (
                                <p className="text-sm text-gray-600 mb-2 ml-10">{doc.description}</p>
                              )}
                              <div className="flex items-center space-x-3 text-xs text-gray-500 ml-10">
                                <span>{new Date(doc.dateTeleversement).toLocaleDateString('fr-FR')}</span>
                                <span>•</span>
                                <span>Ajouté par: {isAddedByMedecin ? '👨‍⚕️ Médecin' : '👤 Patient'}</span>
                                <span>•</span>
                                <span>{(doc.tailleFichier / 1024 / 1024).toFixed(2)} MB</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {/* Bouton Voir - visible pour tous les documents */}
                              <button
                                onClick={() => handleViewDocument(doc.id)}
                                className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg transition-all"
                              >
                                👁️ Voir
                              </button>

                              {/* Bouton Télécharger - visible pour tous les documents */}
                              <button
                                onClick={() => handleDownloadDocument(doc.id)}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-all"
                              >
                                📥 Télécharger
                              </button>

                              {/* Bouton Supprimer - visible seulement pour les documents ajoutés par le médecin */}
                              {isAddedByMedecin && (
                                <button
                                  onClick={() => handleDeleteDocument(doc.id, doc.titre)}
                                  disabled={deletingDocId === doc.id}
                                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deletingDocId === doc.id ? (
                                    <span className="flex items-center space-x-1">
                                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      <span>...</span>
                                    </span>
                                  ) : (
                                    '🗑️ Supprimer'
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Onglet Historique */}
            {activeTab === 'historique' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Historique des consultations</h3>
                
                {rendezVous.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📅</span>
                    <p className="text-gray-600">Aucun rendez-vous enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rendezVous.map((rdv: any) => (
                      <div key={rdv.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{rdv.type === 'EN_LIGNE' ? '🎥' : '🏥'}</span>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {rdv.type === 'EN_LIGNE' ? 'Consultation en ligne' : 'Consultation sur place'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {new Date(rdv.datePrevue).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })} à {new Date(rdv.datePrevue).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rdv.statut === 'TERMINE'
                              ? 'bg-gray-100 text-gray-700'
                              : rdv.statut === 'CONFIRME'
                              ? 'bg-green-100 text-green-700'
                              : rdv.statut === 'ANNULE'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {rdv.statut}
                          </span>
                        </div>
                        {rdv.raison && (
                          <p className="text-sm text-gray-600 pl-11">
                            📋 {rdv.raison}
                          </p>
                        )}
                        {rdv.notes && (
                          <p className="text-sm text-gray-600 pl-11 mt-1">
                            📝 {rdv.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}