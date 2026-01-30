// Fichier: app/medecin/rendez-vous/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

export default function DetailRendezVousPage() {
  const router = useRouter();
  const params = useParams();
  const rdvId = params.id as string;

  const [medecin, setMedecin] = useState<any>(null);
  const [rdv, setRdv] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [dossierMedical, setDossierMedical] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rdv' | 'patient' | 'dossier' | 'documents'>('rdv');

  useEffect(() => {
    loadData();
  }, [rdvId]);

  const loadData = async () => {
    try {
      const dashResponse = await fetch('/api/medecin/dashboard');
      if (!dashResponse.ok) {
        router.push('/connexion');
        return;
      }
      const dashData = await dashResponse.json();
      setMedecin(dashData.medecin);

      const rdvResponse = await fetch(`/api/medecin/rendez-vous/${rdvId}`);
      if (!rdvResponse.ok) throw new Error('RDV introuvable');
      
      const rdvData = await rdvResponse.json();
      setRdv(rdvData.rendezVous);
      setPatient(rdvData.rendezVous.patient);
      setDossierMedical(rdvData.dossierMedical);
      setDocuments(rdvData.documents || []);
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/medecin/rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const canJoinMeeting = () => {
    if (!rdv || rdv.type !== 'EN_LIGNE') return false;
    
    const rdvDate = new Date(rdv.datePrevue);
    const now = new Date();
    const diff = rdvDate.getTime() - now.getTime();
    const minutesDiff = diff / (1000 * 60);
    
    return minutesDiff <= 5 && minutesDiff >= -(rdv.duree || 30);
  };

  const handleDownloadDocument = async (docId: string, nomFichier: string) => {
    setDownloadingDoc(docId);
    try {
      // L'API proxy le fichier directement
      window.open(`/api/medecin/documents/${docId}/download`, '_blank');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du téléchargement du document');
    } finally {
      setTimeout(() => setDownloadingDoc(null), 500);
    }
  };

  const handleViewDocument = async (docId: string) => {
    setDownloadingDoc(docId);
    try {
      // L'API proxy le fichier pour aperçu
      window.open(`/api/medecin/documents/${docId}/preview`, '_blank');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ouverture du document');
    } finally {
      setTimeout(() => setDownloadingDoc(null), 500);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!rdv || !medecin) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar medecin={medecin} />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <Link href="/medecin/rendez-vous">
            <button className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center space-x-2">
              <span>←</span>
              <span>Retour aux rendez-vous</span>
            </button>
          </Link>
        </div>

            {/* Header RDV */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">
                    {rdv.type === 'EN_LIGNE' ? '🎥' : '🏥'}
                    </span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                    {rdv.type === 'EN_LIGNE' ? 'Consultation en ligne' : 'Consultation sur place'}
                    </h1>
                    <p className="text-gray-600">
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

                <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    rdv.statut === 'CONFIRME'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                    {rdv.statut}
                </span>

                {canJoinMeeting() && (
                    <Link href={`/medecin/rendez-vous/${rdv.id}/consultation`}>
                    <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all animate-pulse shadow-lg">
                        🎥 Rejoindre la visio
                    </button>
                    </Link>
                )}
                </div>
            </div>

            {patient && (
                <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                        {patient.prenom[0]}{patient.nom[0]}
                    </span>
                    </div>
                    <div>
                    <p className="font-medium text-gray-900">
                        {patient.prenom} {patient.nom}
                    </p>
                    <p className="text-sm text-gray-600">
                        {calculateAge(patient.dateNaissance)} ans • {patient.sexe}
                    </p>
                    </div>
                </div>
                </div>
            )}
            </div>

        {/* Onglets */}
        <div className="bg-white rounded-t-2xl shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('rdv')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'rdv'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Détails du RDV
            </button>
            {patient && (
              <>
                <button
                  onClick={() => setActiveTab('patient')}
                  className={`px-6 py-4 font-medium transition-all ${
                    activeTab === 'patient'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  👤 Informations patient
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
                  {documents.length > 0 && (
                    <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {documents.length}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Contenu onglets */}
        <div className="bg-white rounded-b-2xl shadow-sm p-6">
          {/* Onglet RDV */}
          {activeTab === 'rdv' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <p className="font-medium text-gray-900">
                    {rdv.type === 'EN_LIGNE' ? '🎥 En ligne' : '🏥 Sur place'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Durée</p>
                  <p className="font-medium text-gray-900">{rdv.duree} minutes</p>
                </div>
              </div>

              {rdv.raison && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">📋 Raison de la consultation</p>
                  <p className="text-gray-900">{rdv.raison}</p>
                </div>
              )}

              {rdv.notes && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">📝 Notes</p>
                  <p className="text-gray-900">{rdv.notes}</p>
                </div>
              )}

              {rdv.sejour && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">🏥 Lié au séjour</p>
                  <p className="text-gray-900">{rdv.sejour.typeTraitement}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Du {new Date(rdv.sejour.dateArrivee).toLocaleDateString('fr-FR')} au {new Date(rdv.sejour.dateDepart).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Onglet Patient */}
          {activeTab === 'patient' && patient && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{patient.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                  <p className="font-medium text-gray-900">{patient.telephone}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Pays</p>
                  <p className="font-medium text-gray-900">{patient.pays}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Nationalité</p>
                  <p className="font-medium text-gray-900">{patient.nationalite}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Date de naissance</p>
                  <p className="font-medium text-gray-900">
                    {new Date(patient.dateNaissance).toLocaleDateString('fr-FR')} ({calculateAge(patient.dateNaissance)} ans)
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Sexe</p>
                  <p className="font-medium text-gray-900">{patient.sexe}</p>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Dossier médical */}
          {activeTab === 'dossier' && (
            <div>
              {!dossierMedical ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">📋</span>
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
                      <p className="text-sm font-medium text-orange-700 mb-2">⚠️ ALLERGIES</p>
                      <p className="text-gray-900">{dossierMedical.allergies}</p>
                    </div>
                  )}

                  {dossierMedical.maladiesChroniques && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-2">Maladies chroniques</p>
                      <p className="text-gray-900">{dossierMedical.maladiesChroniques}</p>
                    </div>
                  )}

                  {dossierMedical.medicamentsActuels && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-2">💊 Médicaments actuels</p>
                      <p className="text-gray-900">{dossierMedical.medicamentsActuels}</p>
                    </div>
                  )}

                  {dossierMedical.antecedentsChirurgicaux && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-2">Antécédents chirurgicaux</p>
                      <p className="text-gray-900">{dossierMedical.antecedentsChirurgicaux}</p>
                    </div>
                  )}

                  {dossierMedical.antecedentsFamiliaux && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-2">Antécédents familiaux</p>
                      <p className="text-gray-900">{dossierMedical.antecedentsFamiliaux}</p>
                    </div>
                  )}

                  {dossierMedical.notes && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-2">📝 Notes supplémentaires</p>
                      <p className="text-gray-900">{dossierMedical.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Onglet Documents */}
          {activeTab === 'documents' && (
            <div>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">📄</span>
                  <p className="text-gray-600">Aucun document disponible</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl">📄</span>
                            <h4 className="font-medium text-gray-900">{doc.titre}</h4>
                          </div>
                          {doc.description && (
                            <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                          )}
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{new Date(doc.dateTeleversement).toLocaleDateString('fr-FR')}</span>
                            <span>•</span>
                            <span>Ajouté par: {doc.ajoutePar}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDocument(doc.id)}
                            disabled={downloadingDoc === doc.id}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                          >
                            {downloadingDoc === doc.id ? '⏳' : '👁️'} Voir
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc.id, doc.nomFichier)}
                            disabled={downloadingDoc === doc.id}
                            className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                          >
                            {downloadingDoc === doc.id ? '⏳' : '⬇️'} Télécharger
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}