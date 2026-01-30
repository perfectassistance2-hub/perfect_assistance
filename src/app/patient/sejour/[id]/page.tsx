'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';
import Link from 'next/link';

interface Medecin {
  id: string;
  prenom: string;
  nom: string;
  specialite: string;
  telephone: string;
  email: string;
}

interface Clinique {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  pays: string;
  telephone: string;
  email?: string;
  siteWeb?: string;
  specialites?: string;
}

interface Coordinateur {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
}

interface Sejour {
  id: string;
  typeTraitement: string;
  descriptionTraitement?: string;
  dateArrivee: string;
  dateDepart: string;
  dateTraitement?: string;
  statut: string;
  hebergementNecessaire: boolean;
  detailsHebergement?: string;
  transportNecessaire: boolean;
  detailsTransport?: string;
  notes?: string;
  medecin?: Medecin;
  clinique: Clinique;
  coordinateur?: Coordinateur;
}

interface RendezVous {
  id: string;
  type: string;
  statut: string;
  datePrevue: string;
  duree: number;
  raison?: string;
  medecin?: {
    prenom: string;
    nom: string;
    specialite: string;
  };
}

interface Document {
  id: string;
  titre: string;
  typeDocument: string;
  urlFichier: string;
  dateCreation: string;
}

export default function DetailSejour() {
  const router = useRouter();
  const [sejourId, setSejourId] = useState<string | null>(null);
  const params = useParams();

  const [patient, setPatient] = useState<any>(null);
  const [sejour, setSejour] = useState<Sejour | null>(null);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setSejourId(resolved.id as string);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (sejourId) {
      fetchPatient();
      fetchSejourDetails();
    }
  }, [sejourId]);

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

  const fetchSejourDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patient/sejour/${sejourId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        if (response.status === 404) {
          throw new Error('Séjour non trouvé');
        }
        throw new Error('Erreur lors du chargement');
      }

      const result = await response.json();
      
      if (result.success) {
        setSejour(result.sejour);
        setRendezVous(result.rendezVous || []);
        setDocuments(result.documents || []);
        setNewNotes(result.sejour.notes || '');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!sejour) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/patient/sejour/${sejourId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: newNotes })
      });

      if (response.ok) {
        setShowNotesModal(false);
        fetchSejourDetails();
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
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
      'PLANIFIE': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📅', text: 'Planifié' },
      'EN_COURS': { color: 'bg-green-100 text-green-800 border-green-200', icon: '🏥', text: 'En cours' },
      'TERMINE': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '✅', text: 'Terminé' },
      'ANNULE': { color: 'bg-red-100 text-red-800 border-red-200', icon: '❌', text: 'Annulé' }
    };
    return badges[statut] || badges['PLANIFIE'];
  };

  const calculateDuree = (dateArrivee: string, dateDepart: string) => {
    const debut = new Date(dateArrivee);
    const fin = new Date(dateDepart);
    const diffTime = Math.abs(fin.getTime() - debut.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  if (error || !sejour) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
        <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {error || 'Séjour non trouvé'}
              </h3>
              <p className="text-gray-600 mb-6">
                Ce séjour n'existe pas ou n'est plus accessible.
              </p>
              <button
                onClick={() => router.push('/patient/sejour')}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                ← Retour
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const badge = getStatutBadge(sejour.statut);
  const duree = calculateDuree(sejour.dateArrivee, sejour.dateDepart);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
      <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/patient/sejour')}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center"
            >
              ← Retour
            </button>
          </div>

          {/* Bannière principale */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="text-5xl">🏥</div>
                  <div>
                    <h1 className="text-3xl font-bold">{sejour.typeTraitement}</h1>
                    <p className="text-cyan-100">{sejour.clinique.nom}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold border ${badge.color}`}>
                  {badge.icon} {badge.text}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-cyan-200 mb-1">Date d'arrivée</p>
                  <p className="font-bold text-lg">
                    {new Date(sejour.dateArrivee).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-cyan-200 mb-1">Date de départ</p>
                  <p className="font-bold text-lg">
                    {new Date(sejour.dateDepart).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-cyan-200 mb-1">Durée</p>
                  <p className="font-bold text-lg">{duree} jour{duree > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Détails du traitement */}
            <div className="p-8 space-y-6">
              {sejour.dateTraitement && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">📅 Date du traitement</p>
                  <p className="font-bold text-gray-900">
                    {formatDate(sejour.dateTraitement)} à {formatTime(sejour.dateTraitement)}
                  </p>
                </div>
              )}

              {sejour.descriptionTraitement && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Description du traitement</h3>
                  <p className="text-gray-700 leading-relaxed">{sejour.descriptionTraitement}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Clinique */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                <h3 className="text-lg font-bold flex items-center">
                  <span className="mr-2">🏥</span>
                  Établissement
                </h3>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4">{sejour.clinique.nom}</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-xl mr-3">📍</span>
                    <div>
                      <p className="font-medium text-gray-900">{sejour.clinique.adresse}</p>
                      <p className="text-gray-600">{sejour.clinique.ville}, {sejour.clinique.pays}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xl mr-3">📞</span>
                    <a href={`tel:${sejour.clinique.telephone}`} className="text-teal-600 hover:text-teal-700 font-medium">
                      {sejour.clinique.telephone}
                    </a>
                  </div>
                  {sejour.clinique.email && (
                    <div className="flex items-center">
                      <span className="text-xl mr-3">📧</span>
                      <a href={`mailto:${sejour.clinique.email}`} className="text-teal-600 hover:text-teal-700">
                        {sejour.clinique.email}
                      </a>
                    </div>
                  )}
                  {sejour.clinique.siteWeb && (
                    <div className="flex items-center">
                      <span className="text-xl mr-3">🌐</span>
                      <a href={sejour.clinique.siteWeb} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">
                        Site web
                      </a>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sejour.clinique.nom + ' ' + sejour.clinique.ville)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <span className="mr-2">🗺️</span>
                    Voir sur Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Médecin */}
            {sejour.medecin && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <h3 className="text-lg font-bold flex items-center">
                    <span className="mr-2">👨‍⚕️</span>
                    Médecin Traitant
                  </h3>
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    Dr. {sejour.medecin.prenom} {sejour.medecin.nom}
                  </h4>
                  <p className="text-gray-600 mb-4">{sejour.medecin.specialite}</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">📞</span>
                      <a href={`tel:${sejour.medecin.telephone}`} className="text-blue-600 hover:text-blue-700 font-medium">
                        {sejour.medecin.telephone}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xl mr-3">📧</span>
                      <a href={`mailto:${sejour.medecin.email}`} className="text-blue-600 hover:text-blue-700">
                        {sejour.medecin.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Coordinateur */}
            {sejour.coordinateur && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white">
                  <h3 className="text-lg font-bold flex items-center">
                    <span className="mr-2">👤</span>
                    Votre Coordinateur
                  </h3>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">
                    {sejour.coordinateur.prenom} {sejour.coordinateur.nom}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Disponible pour répondre à vos questions et vous accompagner.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">📧</span>
                      <a href={`mailto:${sejour.coordinateur.email}`} className="text-orange-600 hover:text-orange-700">
                        {sejour.coordinateur.email}
                      </a>
                    </div>
                    {sejour.coordinateur.telephone && (
                      <div className="flex items-center">
                        <span className="text-xl mr-3">📞</span>
                        <a href={`tel:${sejour.coordinateur.telephone}`} className="text-orange-600 hover:text-orange-700 font-medium">
                          {sejour.coordinateur.telephone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Services */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <h3 className="text-lg font-bold flex items-center">
                  <span className="mr-2">✨</span>
                  Services Inclus
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {sejour.hebergementNecessaire && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🛏️</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">Hébergement</h4>
                        <p className="text-sm text-gray-600">
                          {sejour.detailsHebergement || 'Hébergement inclus'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {sejour.transportNecessaire && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🚗</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">Transport</h4>
                        <p className="text-sm text-gray-600">
                          {sejour.detailsTransport || 'Transferts organisés'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!sejour.hebergementNecessaire && !sejour.transportNecessaire && (
                  <p className="text-gray-500 text-center py-4">Aucun service supplémentaire</p>
                )}
              </div>
            </div>
          </div>

          {/* Rendez-vous liés */}
          {rendezVous.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <h3 className="text-lg font-bold flex items-center">
                  <span className="mr-2">📅</span>
                  Rendez-vous pendant le séjour ({rendezVous.length})
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {rendezVous.map(rdv => (
                    <Link key={rdv.id} href={`/patient/rendez-vous/${rdv.id}`}>
                      <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{rdv.raison || rdv.type}</p>
                            {rdv.medecin && (
                              <p className="text-sm text-gray-600">
                                Dr. {rdv.medecin.prenom} {rdv.medecin.nom} - {rdv.medecin.specialite}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              📅 {formatDate(rdv.datePrevue)} à {formatTime(rdv.datePrevue)}
                            </p>
                          </div>
                          <span className="text-teal-600">→</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes personnelles */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">📝</span>
                Mes notes personnelles
              </h3>
              <button
                onClick={() => setShowNotesModal(true)}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                ✏️ Modifier
              </button>
            </div>
            <div className="p-6">
              {sejour.notes ? (
                <p className="text-gray-700 whitespace-pre-wrap">{sejour.notes}</p>
              ) : (
                <p className="text-gray-400 italic">Aucune note pour ce séjour</p>
              )}
            </div>
          </div>

          {/* Documents */}
          {documents.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-700 text-white">
                <h3 className="text-lg font-bold flex items-center">
                  <span className="mr-2">📄</span>
                  Documents liés ({documents.length})
                </h3>
              </div>
              <div className="p-6">
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
            </div>
          )}
        </div>
      </main>

      {/* Modal Notes */}
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
              placeholder="Ajoutez vos notes personnelles pour ce séjour..."
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