// app/patient/rendez-vous/[id]/page.tsx

'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';
import Link from 'next/link';

interface Medecin {
  id: string;
  prenom: string;
  nom: string;
  specialite: string;
  telephone?: string;
  email?: string;
}

interface Clinique {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
}

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

interface RendezVous {
  id: string;
  type: string;
  statut: string;
  datePrevue: string;
  duree: number;
  urlReunion?: string;
  motDePasseReunion?: string;
  raison?: string;
  notes?: string;
  medecin?: Medecin;
  clinique?: Clinique;
  consultationVideo?: ConsultationVideo[];
  dateCreation: string;
}

interface Document {
  id: string;
  titre: string;
  typeDocument: string;
  urlFichier: string;
  dateCreation: string;
}

export default function DetailRendezVous({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rdvId = resolvedParams.id;

  const [patient, setPatient] = useState<any>(null);
  const [rdv, setRdv] = useState<RendezVous | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rdvId) {
      fetchPatient();
      fetchRdvDetails();
    }
  }, [rdvId]);

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

  const fetchRdvDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patient/rendez-vous/${rdvId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        if (response.status === 404) {
          throw new Error('Rendez-vous non trouvé');
        }
        throw new Error('Erreur lors du chargement');
      }

      const result = await response.json();
      
      if (result.success) {
        setRdv(result.rdv);
        setDocuments(result.documents || []);
        setNewNotes(result.rdv.notes || '');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!rdv) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/patient/rendez-vous/${rdvId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: newNotes })
      });

      if (response.ok) {
        setShowNotesModal(false);
        fetchRdvDetails();
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const annulerRdv = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/patient/rendez-vous/${rdvId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statut: 'ANNULE' })
      });

      if (response.ok) {
        fetchRdvDetails();
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de l\'annulation');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutBadge = (statut: string) => {
    const badges: any = {
      PLANIFIE: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planifié' },
      CONFIRME: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmé' },
      TERMINE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Terminé' },
      ANNULE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulé' },
      EN_COURS: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En cours' }
    };
    
    const badge = badges[statut] || badges.PLANIFIE;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const types: any = {
      VISIO_PRELIMINAIRE: { icon: '🎥', label: 'Visio Préliminaire', color: 'text-teal-600' },
      CONSULTATION: { icon: '🏥', label: 'Consultation', color: 'text-blue-600' },
      SUIVI: { icon: '📋', label: 'Suivi', color: 'text-purple-600' },
      URGENCE: { icon: '🚨', label: 'Urgence', color: 'text-red-600' }
    };
    
    const typeInfo = types[type] || { icon: '📅', label: type, color: 'text-gray-600' };
    return (
      <div className={`flex items-center ${typeInfo.color} font-medium`}>
        <span className="text-2xl mr-2">{typeInfo.icon}</span>
        {typeInfo.label}
      </div>
    );
  };

  // ✅ NOUVEAU - Vérifier si une visio peut être rejointe
  const canJoinVisio = (consultation: ConsultationVideo) => {
    if (rdv?.statut === 'ANNULE') return false;
    if (!consultation || !consultation.lien_patient) return false;
    
    const visioDate = new Date(consultation.date_debut);
    const now = new Date();
    const diff = (visioDate.getTime() - now.getTime()) / 1000 / 60; // en minutes
    
    // Peut rejoindre 15 min avant et pendant la durée
    return diff <= 15 && diff >= -consultation.duree;
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

  if (error || !rdv) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
        <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {error || 'Rendez-vous non trouvé'}
              </h3>
              <p className="text-gray-600 mb-6">
                Ce rendez-vous n'existe pas ou n'est plus accessible.
              </p>
              <button
                onClick={() => router.push('/patient/rendez-vous')}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                ← Retour à la liste
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const consultations = rdv.consultationVideo || [];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
      <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/patient/rendez-vous')}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center"
            >
              ← Retour à la liste
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-8">
              <div className="flex items-start justify-between mb-4">
                {getTypeBadge(rdv.type)}
                {getStatutBadge(rdv.statut)}
              </div>
              
              <h1 className="text-3xl font-bold mb-2">
                {rdv.raison || 'Rendez-vous médical'}
              </h1>
              
              <div className="flex items-center text-teal-100">
                <span className="text-xl mr-2">📅</span>
                <span className="text-lg">
                  {formatDate(rdv.datePrevue)} à {formatTime(rdv.datePrevue)}
                </span>
                <span className="mx-3">•</span>
                <span className="text-lg">⏱️ {rdv.duree} minutes</span>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* ✅ NOUVEAU - Section Visioconférences (TOUTES) */}
              {consultations.length > 0 && (
                <div className="border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🎥</span>
                    Consultations en ligne ({consultations.length})
                  </h2>
                  
                  <div className="space-y-4">
                    {consultations.map((consultation) => {
                      const peutRejoindre = canJoinVisio(consultation);
                      
                      return (
                        <div 
                          key={consultation.id}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            peutRejoindre 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-bold text-gray-900">{consultation.titre}</h3>
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
                              
                              <div className="space-y-1 text-sm text-gray-600 mb-3">
                                <p>📅 {formatDate(consultation.date_debut)} à {formatTime(consultation.date_debut)}</p>
                                <p>⏱️ Durée: {consultation.duree} minutes</p>
                                {consultation.enregistrement_autorise && (
                                  <p className="text-orange-600">
                                    🔴 Enregistrement autorisé
                                    {consultation.plateforme === 'ZEGOCLOUD' && ' (non disponible sur ZegoCloud)'}
                                  </p>
                                )}
                              </div>

                              {!peutRejoindre && consultation.statut === 'PLANIFIE' && (
                                <p className="text-xs text-gray-500 italic">
                                  La consultation sera accessible 15 minutes avant le début
                                </p>
                              )}
                            </div>

                            {peutRejoindre && (
                              <Link href={`/patient/rendez-vous/${rdvId}/consultation`}>
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

              {rdv.medecin && (
                <div className="border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">👨‍⚕️</span>
                    Médecin
                  </h2>
                  
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4 flex-shrink-0">
                      {rdv.medecin.prenom[0]}
                      {rdv.medecin.nom[0]}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
                      </h3>
                      <p className="text-teal-600 font-medium mb-3">{rdv.medecin.specialite}</p>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {rdv.medecin.email && (
                          <div className="flex items-center">
                            <span className="mr-2">📧</span>
                            <a href={`mailto:${rdv.medecin.email}`} className="hover:text-teal-600">
                              {rdv.medecin.email}
                            </a>
                          </div>
                        )}
                        {rdv.medecin.telephone && (
                          <div className="flex items-center">
                            <span className="mr-2">📞</span>
                            <a href={`tel:${rdv.medecin.telephone}`} className="hover:text-teal-600">
                              {rdv.medecin.telephone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {rdv.clinique && (
                <div className="border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🏥</span>
                    Lieu du rendez-vous
                  </h2>
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{rdv.clinique.nom}</h3>
                    <div className="space-y-1 text-gray-600">
                      <div className="flex items-start">
                        <span className="mr-2 mt-0.5">📍</span>
                        <div>
                          <p>{rdv.clinique.adresse}</p>
                          <p>{rdv.clinique.ville}, {rdv.clinique.pays || 'Maroc'}</p>
                        </div>
                      </div>
                      
                      {rdv.clinique.telephone && (
                        <div className="flex items-center">
                          <span className="mr-2">📞</span>
                          <a href={`tel:${rdv.clinique.telephone}`} className="hover:text-teal-600">
                            {rdv.clinique.telephone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">📝</span>
                    Mes notes
                  </h2>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    ✏️ Modifier
                  </button>
                </div>
                
                {rdv.notes ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{rdv.notes}</p>
                ) : (
                  <p className="text-gray-400 italic">Aucune note pour ce rendez-vous</p>
                )}
              </div>

              {documents.length > 0 && (
                <div className="border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">📄</span>
                    Documents liés ({documents.length})
                  </h2>
                  
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">📄</span>
                          <div>
                            <p className="font-medium text-gray-900">{doc.titre}</p>
                            <p className="text-sm text-gray-500">{doc.typeDocument}</p>
                          </div>
                        </div>
                        <a
                          href={doc.urlFichier}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 font-medium"
                        >
                          Voir →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
            
            <div className="flex flex-wrap gap-3">
              {rdv.statut !== 'ANNULE' && rdv.statut !== 'TERMINE' && (
                <button
                  onClick={annulerRdv}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                >
                  ❌ Annuler le rendez-vous
                </button>
              )}
              
              <button
                onClick={() => {
                  const event = {
                    title: rdv.raison || 'Rendez-vous médical',
                    start: new Date(rdv.datePrevue),
                    duration: rdv.duree,
                    description: `Rendez-vous avec ${rdv.medecin?.prenom} ${rdv.medecin?.nom}`,
                    location: rdv.clinique?.nom || ''
                  };
                  
                  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${new Date(rdv.datePrevue).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
                  window.open(googleCalUrl, '_blank');
                }}
                className="px-6 py-3 border-2 border-teal-500 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors font-medium"
              >
                📅 Ajouter au calendrier
              </button>
            </div>
          </div>
        </div>
      </main>

      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Modifier mes notes</h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              rows={8}
              placeholder="Ajoutez vos notes personnelles pour ce rendez-vous..."
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={saveNotes}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}