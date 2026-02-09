// app/patient/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';
import Link from 'next/link';

interface ConsultationVideo {
  id: string;
  titre: string;
  plateforme: 'DAILY' | 'ZEGOCLOUD';
  date_debut: string;
  duree: number;
  statut: string;
  lien_patient: string;
  enregistrement_autorise: boolean;
  rendez_vous?: {
    id: string;
    raison: string;
    medecin?: {
      id: string;
      prenom: string;
      nom: string;
      specialite: string;
    };
  };
}

interface DashboardData {
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    photoUrl?: string;
    statut: string;
    profilComplet: number;
  };
  sejourActif?: {
    id: string;
    typeTraitement: string;
    dateArrivee: string;
    dateDepart: string;
    statut: string;
    clinique: {
      nom: string;
      ville: string;
      adresse: string;
    };
    medecin?: {
      prenom: string;
      nom: string;
      specialite: string;
    };
  };
  prochainsRendezVous: Array<{
    id: string;
    type: string;
    datePrevue: string;
    duree: number;
    statut: string;
    raison?: string;
    urlReunion?: string;
    consultationVideo?: ConsultationVideo[];
    medecin?: {
      prenom: string;
      nom: string;
      specialite: string;
    };
    clinique?: {
      nom: string;
      ville: string;
    };
  }>;
  prochainesVisios?: ConsultationVideo[]; // ✅ NOUVEAU
  devisActif?: {
    id: string;
    numeroDevis: string;
    total: number;
    montantPaye: number;
    statutPaiement: string;
    articles: string;
  };
  documentsRecents: Array<{
    id: string;
    titre: string;
    type: string;
    dateTeleversement: string;
    ajoutePar: string;
  }>;
  messagesNonLus: number;
  notificationsNonLues: number;
  activitesRecentes: Array<{
    id: string;
    type: string;
    titre: string;
    description: string;
    date: string;
    icon: string;
  }>;
}

export default function PatientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/patient/dashboard');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement des données');
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || 'Erreur de format de données');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-64"></div>
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-teal-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen">
        <div className="w-64"></div>
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
            <p className="text-red-600 font-medium">❌ {error || 'Erreur de chargement'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { patient, sejourActif, prochainsRendezVous, prochainesVisios, devisActif, documentsRecents, messagesNonLus, notificationsNonLues, activitesRecentes } = data;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return formatDate(dateStr);
  };

  // ✅ NOUVEAU - Vérifier si une visio peut être rejointe
  const canJoinVisio = (dateDebut: string, duree: number) => {
    const debut = new Date(dateDebut);
    const now = new Date();
    const diff = (debut.getTime() - now.getTime()) / (1000 * 60); // en minutes
    
    // Peut rejoindre 15 min avant et pendant la durée
    return diff <= 15 && diff >= -duree;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
      <PatientSidebar 
        patient={patient} 
        notificationsNonLues={notificationsNonLues}
      />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bonjour {patient.prenom} ! 👋
            </h1>
            <p className="text-gray-600">Bienvenue sur votre espace personnel</p>
          </div>

          {/* Alert - Profil incomplet */}
          {patient.profilComplet < 100 && (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-5 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-bold text-amber-900 mb-1">Action requise</h3>
                  <p className="text-sm text-amber-800 mb-3">
                    Votre profil est incomplet à {patient.profilComplet}%
                  </p>
                  <Link href="/patient/profil">
                    <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                      Compléter maintenant
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* ✅ NOUVEAU - Prochaines Visioconférences */}
              {prochainesVisios && prochainesVisios.length > 0 && (
                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-purple-100">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <span className="mr-2">🎥</span>
                      Mes Visioconférences
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {prochainesVisios.map((visio) => {
                      const peutRejoindre = canJoinVisio(visio.date_debut, visio.duree);
                      
                      return (
                        <div 
                          key={visio.id}
                          className={`border-2 rounded-xl p-4 transition-all ${
                            peutRejoindre 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-bold text-gray-900">{visio.titre}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  visio.plateforme === 'DAILY'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {visio.plateforme === 'DAILY' ? '📹 Daily.co' : '🎥 ZegoCloud'}
                                </span>
                                {peutRejoindre && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 animate-pulse">
                                    🟢 Accessible maintenant
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600 mb-3">
                                <p>📅 {formatDate(visio.date_debut)} à {formatTime(visio.date_debut)}</p>
                                <p>⏱️ Durée: {visio.duree} minutes</p>
                                {visio.rendez_vous?.medecin && (
                                  <p>👨‍⚕️ Dr. {visio.rendez_vous.medecin.prenom} {visio.rendez_vous.medecin.nom}</p>
                                )}
                                {visio.enregistrement_autorise && (
                                  <p className="text-orange-600">🔴 Enregistrement autorisé</p>
                                )}
                              </div>

                              {visio.rendez_vous && (
                                <Link 
                                  href={`/patient/rendez-vous/${visio.rendez_vous.id}`}
                                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                                >
                                  Voir le rendez-vous associé →
                                </Link>
                              )}
                            </div>

                            {peutRejoindre && (
                              <Link href={`/patient/rendez-vous/${visio.rendez_vous?.id}/consultation`}>
                                <button className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all shadow-md">
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
              )}

              {/* Prochain Rendez-vous */}
              {prochainsRendezVous && prochainsRendezVous.length > 0 && (
                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-teal-100">
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <span className="mr-2">📅</span>
                      Prochain Rendez-vous
                    </h2>
                  </div>
                  <div className="p-6">
                    {prochainsRendezVous[0].type === 'VISIO_PRELIMINAIRE' && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
                        <span className="mr-1">✨</span>
                        Consultation gratuite
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {prochainsRendezVous[0].type === 'VISIO_PRELIMINAIRE' ? '🎥 Consultation Vidéo Préliminaire' : '🏥 Consultation en Clinique'}
                    </h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-700">
                        <span className="mr-3 text-lg">📆</span>
                        <span className="font-medium">{formatDate(prochainsRendezVous[0].datePrevue)} à {formatTime(prochainsRendezVous[0].datePrevue)}</span>
                      </div>
                      {prochainsRendezVous[0].medecin && (
                        <div className="flex items-center text-gray-700">
                          <span className="mr-3 text-lg">👨‍⚕️</span>
                          <span>Dr. {prochainsRendezVous[0].medecin.prenom} {prochainsRendezVous[0].medecin.nom} - {prochainsRendezVous[0].medecin.specialite}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-700">
                        <span className="mr-3 text-lg">⏱️</span>
                        <span>Durée: {prochainsRendezVous[0].duree} minutes</span>
                      </div>
                      {prochainsRendezVous[0].clinique && (
                        <div className="flex items-center text-gray-700">
                          <span className="mr-3 text-lg">📍</span>
                          <span>{prochainsRendezVous[0].clinique.nom}, {prochainsRendezVous[0].clinique.ville}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <Link href={`/patient/rendez-vous/${prochainsRendezVous[0].id}`}>
                        <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-all">
                          Voir les détails
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Mon Séjour */}
              {sejourActif && (
                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-cyan-100">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <span className="mr-2">🏥</span>
                      Mon Séjour Programmé
                    </h2>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {sejourActif.typeTraitement}
                    </h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-700">
                        <span className="mr-3 text-lg">📍</span>
                        <div>
                          <p className="font-medium">{sejourActif.clinique.nom}</p>
                          <p className="text-sm text-gray-500">{sejourActif.clinique.ville}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <span className="mr-3 text-lg">📅</span>
                        <span>Du {formatDate(sejourActif.dateArrivee)} au {formatDate(sejourActif.dateDepart)}</span>
                      </div>
                      {sejourActif.medecin && (
                        <div className="flex items-center text-gray-700">
                          <span className="mr-3 text-lg">👨‍⚕️</span>
                          <span>Dr. {sejourActif.medecin.prenom} {sejourActif.medecin.nom}</span>
                        </div>
                      )}
                    </div>
                    <Link href="/patient/sejour">
                      <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-xl transition-all shadow-sm">
                        Voir les détails
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Timeline d'activités */}
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <span className="mr-2">📊</span>
                    Activités Récentes
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {activitesRecentes && activitesRecentes.length > 0 ? (
                      activitesRecentes.map((activite) => (
                        <div key={activite.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-xl">
                            {activite.icon}
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="text-sm font-bold text-gray-900">{activite.titre}</h4>
                            <p className="text-sm text-gray-600 mt-1">{activite.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(activite.date)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne latérale (1/3) - reste identique */}
            <div className="space-y-6">
              {/* Mon Devis */}
              {devisActif && (
                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-green-100">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                      <span className="mr-2">📋</span>
                      Mon Devis
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">Devis #{devisActif.numeroDevis}</p>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">💰 Total:</span>
                        <span className="font-bold text-gray-900">{devisActif.total.toLocaleString()} MAD</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">✅ Payé:</span>
                        <span className="font-bold text-green-600">{devisActif.montantPaye.toLocaleString()} MAD</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">⏳ Reste:</span>
                        <span className="font-bold text-orange-600">{(devisActif.total - devisActif.montantPaye).toLocaleString()} MAD</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${(devisActif.montantPaye / devisActif.total) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {Math.round((devisActif.montantPaye / devisActif.total) * 100)}% payé
                      </p>
                    </div>
                    <Link href="/patient/devis">
                      <button className="w-full px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors text-sm">
                        Voir le devis
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Documents récents */}
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <span className="mr-2">📁</span>
                    Documents Récents
                  </h2>
                </div>
                <div className="p-6">
                  {documentsRecents && documentsRecents.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {documentsRecents.slice(0, 3).map((doc) => (
                        <div key={doc.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded flex items-center justify-center">
                            <span className="text-sm">📄</span>
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.titre}</p>
                            <p className="text-xs text-gray-500">{formatRelativeTime(doc.dateTeleversement)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">Aucun document</p>
                  )}
                  <Link href="/patient/documents">
                    <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors text-sm">
                      Voir tous les documents
                    </button>
                  </Link>
                </div>
              </div>

              {/* Messages & Notifications */}
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <span className="mr-2">💬</span>
                    Communication
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <Link href="/patient/messages">
                    <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer">
                      <div className="flex items-center">
                        <span className="mr-3 text-xl">💬</span>
                        <span className="text-sm font-medium text-gray-900">Messages</span>
                      </div>
                      {messagesNonLus > 0 && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          {messagesNonLus}
                        </span>
                      )}
                    </div>
                  </Link>
                  <Link href="/patient/notifications">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                      <div className="flex items-center">
                        <span className="mr-3 text-xl">🔔</span>
                        <span className="text-sm font-medium text-gray-900">Notifications</span>
                      </div>
                      {notificationsNonLues > 0 && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          {notificationsNonLues}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}