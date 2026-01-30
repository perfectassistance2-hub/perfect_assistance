'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';

interface Notification {
  id: string;
  type: 'RDV' | 'MESSAGE' | 'DOCUMENT' | 'DEVIS' | 'PAIEMENT' | 'SYSTEME';
  titre: string;
  message: string;
  estLu: boolean;
  dateCreation: string;
  dateLecture?: string;
  lien?: string;
}

type Filtre = 'all' | 'non_lues' | 'lues';

export default function NotificationsPatient() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [countNonLues, setCountNonLues] = useState(0);
  const [filtreActif, setFiltreActif] = useState<Filtre>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatient();
    fetchNotifications();
  }, [filtreActif]);

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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const url = `/api/patient/notifications${filtreActif !== 'all' ? `?filtre=${filtreActif}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement des notifications');
      }

      const result = await response.json();
      
      if (result.success) {
        setNotifications(result.notifications);
        setCountNonLues(result.countNonLues);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const marquerCommeLu = async (notificationId: string) => {
    try {
      const response = await fetch('/api/patient/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const marquerToutCommeLu = async () => {
    try {
      const response = await fetch('/api/patient/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true })
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const supprimerNotification = async (notificationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/patient/notifications?id=${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const getIconeType = (type: string) => {
    switch (type) {
      case 'RDV': return '📅';
      case 'MESSAGE': return '💬';
      case 'DOCUMENT': return '📄';
      case 'DEVIS': return '💰';
      case 'PAIEMENT': return '💳';
      case 'SYSTEME': return '⚙️';
      default: return '🔔';
    }
  };

  const getColorType = (type: string) => {
    switch (type) {
      case 'RDV': return 'from-blue-500 to-blue-600';
      case 'MESSAGE': return 'from-teal-500 to-cyan-600';
      case 'DOCUMENT': return 'from-purple-500 to-purple-600';
      case 'DEVIS': return 'from-green-500 to-green-600';
      case 'PAIEMENT': return 'from-yellow-500 to-yellow-600';
      case 'SYSTEME': return 'from-gray-500 to-gray-600';
      default: return 'from-teal-500 to-cyan-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  🔔 Notifications
                  {countNonLues > 0 && (
                    <span className="ml-3 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                      {countNonLues}
                    </span>
                  )}
                </h1>
                <p className="text-gray-600 mt-2">Restez informé de toutes vos activités</p>
              </div>
              
              {countNonLues > 0 && (
                <button
                  onClick={marquerToutCommeLu}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  ✓ Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Filtres */}
            <div className="flex gap-2">
              <button
                onClick={() => setFiltreActif('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtreActif === 'all'
                    ? 'bg-teal-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setFiltreActif('non_lues')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtreActif === 'non_lues'
                    ? 'bg-teal-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Non lues ({countNonLues})
              </button>
              <button
                onClick={() => setFiltreActif('lues')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtreActif === 'lues'
                    ? 'bg-teal-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Lues
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <p className="font-medium">⚠️ Erreur</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Liste des notifications */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune notification</h3>
                <p className="text-gray-600">
                  {filtreActif === 'non_lues' 
                    ? 'Toutes vos notifications sont lues !'
                    : 'Vous n\'avez pas encore de notifications'}
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden ${
                    !notif.estLu ? 'border-l-4 border-teal-500' : ''
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start">
                      {/* Icône type */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorType(notif.type)} flex items-center justify-center flex-shrink-0 mr-4`}>
                        <span className="text-2xl">{getIconeType(notif.type)}</span>
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            {notif.titre}
                            {!notif.estLu && (
                              <span className="ml-2 w-2 h-2 bg-teal-500 rounded-full"></span>
                            )}
                          </h3>
                          <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                            {formatDate(notif.dateCreation)}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                          {notif.message}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-3">
                          {notif.lien && (
                            <button
                              onClick={() => router.push(notif.lien!)}
                              className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center"
                            >
                              Voir →
                            </button>
                          )}
                          
                          {!notif.estLu && (
                            <button
                              onClick={() => marquerCommeLu(notif.id)}
                              className="text-sm font-medium text-gray-600 hover:text-gray-700 flex items-center"
                            >
                              ✓ Marquer comme lu
                            </button>
                          )}
                          
                          <button
                            onClick={() => supprimerNotification(notif.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center ml-auto"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}