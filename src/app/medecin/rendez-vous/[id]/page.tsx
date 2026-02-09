// app/medecin/rendez-vous/[id]/page.tsx

"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

interface ConsultationVideo {
  id: string;
  titre: string;
  plateforme: 'DAILY' | 'ZEGOCLOUD';
  daily_room_name?: string;
  daily_room_url?: string;
  zego_room_id?: string;
  lien_patient: string;
  lien_medecin: string;
  statut: string;
  date_debut: string;
  duree: number;
  enregistrement_autorise: boolean;
}

export default function DetailRendezVousPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rdvId = resolvedParams.id;

  const [medecin, setMedecin] = useState<any>(null);
  const [rdv, setRdv] = useState<any>(null);
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
      setDossierMedical(rdvData.dossierMedical);
      setDocuments(rdvData.documents || []);
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/medecin/rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU - Vérifier si une visio peut être rejointe
  const canJoinVisio = (consultation: ConsultationVideo) => {
    if (rdv?.statut === 'ANNULE') return false;
    if (!consultation || !consultation.lien_medecin) return false;
    
    const visioDate = new Date(consultation.date_debut);
    const now = new Date();
    const diff = (visioDate.getTime() - now.getTime()) / 1000 / 60; // en minutes
    
    // Peut rejoindre 15 min avant et pendant la durée
    return diff <= 15 && diff >= -consultation.duree;
  };

  const handleDownloadDocument = async (docId: string, nomFichier: string) => {
    setDownloadingDoc(docId);
    try {
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

  // ✅ NOUVEAU - Badge plateforme
  const getPlatformBadge = (plateforme: string) => {
    if (plateforme === 'DAILY') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          📹 Daily.co
        </span>
      );
    } else if (plateforme === 'ZEGOCLOUD') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          🎥 ZegoCloud
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!rdv || !medecin) return null;

  const patient = rdv.patient;
  const consultations = rdv.consultationVideo || [];

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
                  {consultations.length > 0 ? '🎥' : '🏥'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {consultations.length > 0 ? 'Consultation en ligne' : 'Consultation sur place'}
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
                  : rdv.statut === 'PLANIFIE'
                  ? 'bg-yellow-100 text-yellow-700'
                  : rdv.statut === 'TERMINE'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {rdv.statut}
              </span>
            </div>
          </div>

          {/* ✅ NOUVEAU - Section Visioconférences (TOUTES) */}
          {consultations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-xl mr-2">🎥</span>
                  Consultations en ligne ({consultations.length})
                </h3>
                
                <div className="space-y-3">
                  {consultations.map((consultation: ConsultationVideo) => {
                    const peutRejoindre = canJoinVisio(consultation);
                    
                    return (
                      <div 
                        key={consultation.id}
                        className={`border-2 rounded-lg p-3 transition-all ${
                          peutRejoindre 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-bold text-gray-900">{consultation.titre}</h4>
                              {getPlatformBadge(consultation.plateforme)}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                consultation.statut === 'PLANIFIE'
                                  ? 'bg-blue-100 text-blue-700'
                                  : consultation.statut === 'EN_COURS'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {consultation.statut}
                              </span>
                              {peutRejoindre && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 animate-pulse">
                                  🟢 Accessible
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>📅 {new Date(consultation.date_debut).toLocaleDateString('fr-FR')} à {new Date(consultation.date_debut).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</p>
                              <p>⏱️ Durée: {consultation.duree} minutes</p>
                              {consultation.enregistrement_autorise && (
                                <p className="text-orange-600">
                                  🔴 Enregistrement autorisé
                                  {consultation.plateforme === 'ZEGOCLOUD' && ' (non disponible sur ZegoCloud)'}
                                </p>
                              )}
                            </div>
                          </div>

                          {peutRejoindre && (
                            <Link href={`/medecin/rendez-vous/${rdvId}/consultation`}>
                              <button className="ml-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all shadow-md">
                                🎥 Rejoindre
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {patient && (
            <div className="pt-4 border-t border-gray-200 mt-4">
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
                    {consultations.length > 0 ? '🎥 En ligne' : '🏥 Sur place'}
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

              {rdv.sejours && rdv.sejours.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">🏥 Séjours liés</p>
                  {rdv.sejours.map((sejour: any) => (
                    <div key={sejour.id} className="mb-2 last:mb-0">
                      <p className="text-gray-900 font-medium">{sejour.typeTraitement}</p>
                      <p className="text-sm text-gray-600">
                        Du {new Date(sejour.dateArrivee).toLocaleDateString('fr-FR')} au {new Date(sejour.dateDepart).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
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