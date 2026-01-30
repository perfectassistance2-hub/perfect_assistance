'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';
import Link from 'next/link';

interface RendezVous {
  id: string;
  type: string;
  datePrevue: string;
  duree: number;
  statut: string;
  raison?: string;
  notes?: string;
  urlReunion?: string;
  medecin?: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
    telephone: string;
    email: string;
  };
  clinique?: {
    id: string;
    nom: string;
    ville: string;
    adresse: string;
    telephone: string;
  };
  consultationVideo?: {
    id: string;
    lien_patient: string;
    statut: string;
  };
}

export default function RendezVousPatient() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [rdvAvenir, setRdvAvenir] = useState<RendezVous[]>([]);
  const [rdvPasses, setRdvPasses] = useState<RendezVous[]>([]);
  const [filter, setFilter] = useState<'avenir' | 'passes' | 'tous'>('avenir');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatient();
    fetchRendezVous();
  }, []); // Charger une seule fois au montage

  const fetchPatient = async () => {
    try {
      const response = await fetch('/api/patient/profil');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.patient) {
          setPatient(result.patient);
        }
      }
    } catch (err) {
      console.error('Erreur chargement patient:', err);
    }
  };

  const fetchRendezVous = async () => {
    try {
      const response = await fetch(`/api/patient/rendez-vous`); // Sans filtre
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement des rendez-vous');
      }

      const result = await response.json();
      
      if (result.success) {
        setRdvAvenir(result.avenir || []);
        setRdvPasses(result.passes || []);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: any = {
      'VISIO_PRELIMINAIRE': { color: 'bg-green-100 text-green-800 border-green-200', icon: '🎥', text: 'Visio préliminaire (Gratuit)' },
      'EN_LIGNE': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '💻', text: 'En ligne' },
      'SUR_PLACE': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🏥', text: 'Sur place' },
      'SUIVI': { color: 'bg-teal-100 text-teal-800 border-teal-200', icon: '🔄', text: 'Suivi' }
    };
    return badges[type] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '📅', text: type };
  };

  const getStatutBadge = (statut: string) => {
    const badges: any = {
      'PLANIFIE': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📅', text: 'Planifié' },
      'CONFIRME': { color: 'bg-green-100 text-green-800 border-green-200', icon: '✅', text: 'Confirmé' },
      'EN_COURS': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳', text: 'En cours' },
      'TERMINE': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '✔️', text: 'Terminé' },
      'ANNULE': { color: 'bg-red-100 text-red-800 border-red-200', icon: '❌', text: 'Annulé' }
    };
    return badges[statut] || badges['PLANIFIE'];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canJoinVisio = (rdv: RendezVous) => {
    if (!rdv.consultationVideo) return false;
    
    const rdvDate = new Date(rdv.datePrevue);
    const now = new Date();
    const diff = rdvDate.getTime() - now.getTime();
    const diffMinutes = diff / (1000 * 60);
    
    // Peut rejoindre 15 min avant jusqu'à la fin du RDV
    return diffMinutes <= 15 && diffMinutes >= -(rdv.duree);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <PatientSidebar patient={{ id: '', prenom: '', nom: '', email: '' }} />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-teal-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
      <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Rendez-vous</h1>
            <p className="text-gray-600">Consultez et gérez vos rendez-vous médicaux</p>
          </div>

          {/* Filtres */}
          <div className="mb-6 bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('avenir')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'avenir'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔜 À venir ({rdvAvenir.length})
              </button>
              <button
                onClick={() => setFilter('passes')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'passes'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✅ Passés ({rdvPasses.length})
              </button>
            </div>

            <Link href="/patient/messages">
              <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors flex items-center">
                <span className="mr-2">💬</span>
                Demander un RDV
              </button>
            </Link>
          </div>

          {/* Liste des rendez-vous */}
          {filter === 'avenir' && (
            <div className="space-y-6">
              {rdvAvenir.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                  <div className="text-6xl mb-4">📅</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun rendez-vous à venir</h2>
                  <p className="text-gray-600 mb-6">Vous n'avez pas de rendez-vous programmé pour le moment.</p>
                  <Link href="/patient/messages">
                    <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all shadow-md">
                      <span className="mr-2">💬</span>
                      Contacter l'administration
                    </button>
                  </Link>
                </div>
              ) : (
                rdvAvenir.map(rdv => {
                  const typeBadge = getTypeBadge(rdv.type);
                  const statutBadge = getStatutBadge(rdv.statut);
                  const canJoin = canJoinVisio(rdv);

                  return (
                    <div key={rdv.id} className="bg-white rounded-2xl shadow-md overflow-hidden border-l-4 border-teal-500">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${typeBadge.color}`}>
                                {typeBadge.icon} {typeBadge.text}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statutBadge.color}`}>
                                {statutBadge.icon} {statutBadge.text}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {rdv.raison || 'Consultation médicale'}
                            </h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-gray-700">
                            <span className="text-xl mr-3">📅</span>
                            <div>
                              <p className="font-medium">{formatDate(rdv.datePrevue)}</p>
                              <p className="text-sm text-gray-500">à {formatTime(rdv.datePrevue)}</p>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-700">
                            <span className="text-xl mr-3">⏱️</span>
                            <span>Durée: {rdv.duree} minutes</span>
                          </div>

                          {rdv.medecin && (
                            <div className="flex items-center text-gray-700">
                              <span className="text-xl mr-3">👨‍⚕️</span>
                              <div>
                                <p className="font-medium">Dr. {rdv.medecin.prenom} {rdv.medecin.nom}</p>
                                <p className="text-sm text-gray-500">{rdv.medecin.specialite}</p>
                              </div>
                            </div>
                          )}

                          {rdv.clinique && (
                            <div className="flex items-center text-gray-700">
                              <span className="text-xl mr-3">📍</span>
                              <div>
                                <p className="font-medium">{rdv.clinique.nom}</p>
                                <p className="text-sm text-gray-500">{rdv.clinique.ville}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {rdv.notes && (
                          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                            <p className="text-sm text-gray-700">{rdv.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                          {rdv.consultationVideo && canJoin && (
                            <a 
                              href={rdv.consultationVideo.lien_patient}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg flex items-center"
                            >
                              <span className="mr-2">📹</span>
                              Rejoindre la visio
                            </a>
                          )}
                          {rdv.consultationVideo && !canJoin && (
                            <button 
                              disabled
                              className="px-6 py-3 bg-gray-300 text-gray-600 font-medium rounded-xl cursor-not-allowed flex items-center"
                              title="Disponible 15 minutes avant le rendez-vous"
                            >
                              <span className="mr-2">📹</span>
                              Rejoindre la visio
                            </button>
                          )}
                          {rdv.medecin && (
                            <a 
                              href={`tel:${rdv.medecin.telephone}`}
                              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-all flex items-center"
                            >
                              <span className="mr-2">📞</span>
                              Appeler
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {filter === 'passes' && (
            <div className="space-y-4">
              {rdvPasses.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun rendez-vous passé</h2>
                  <p className="text-gray-600">Votre historique de rendez-vous apparaîtra ici.</p>
                </div>
              ) : (
                rdvPasses.map(rdv => {
                  const typeBadge = getTypeBadge(rdv.type);
                  const statutBadge = getStatutBadge(rdv.statut);

                  return (
                    <div key={rdv.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statutBadge.color}`}>
                              {statutBadge.icon} {statutBadge.text}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1">
                            {rdv.raison || 'Consultation médicale'}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>📅 {formatDate(rdv.datePrevue)}</span>
                            {rdv.medecin && (
                              <span>👨‍⚕️ Dr. {rdv.medecin.nom}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/patient/rendez-vous/${rdv.id}`}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-all"
                          >
                            📄 Voir détails
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}