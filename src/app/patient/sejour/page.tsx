'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';
import Link from 'next/link';

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
  medecin?: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
    telephone: string;
    email: string;
  };
  clinique: {
    id: string;
    nom: string;
    ville: string;
    pays: string;
    adresse: string;
    telephone: string;
    email?: string;
    siteWeb?: string;
    specialites?: string;
  };
  coordinateur?: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone?: string;
  };
}

export default function SejourPatient() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [sejoursActifs, setSejoursActifs] = useState<Sejour[]>([]);
  const [sejoursPasses, setSejoursPasses] = useState<Sejour[]>([]);
  const [selectedSejour, setSelectedSejour] = useState<Sejour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSejours();
  }, []);

  const fetchSejours = async () => {
    try {
      // Récupérer les infos du patient
    const patientResponse = await fetch('/api/patient/profil');
    if (patientResponse.ok) {
      const patientResult = await patientResponse.json();
      if (patientResult.success && patientResult.patient) {
        setPatient(patientResult.patient);
      }
    }
      const response = await fetch('/api/patient/sejour');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement des séjours');
      }

      const result = await response.json();
      
      if (result.success) {
        setSejoursActifs(result.sejoursActifs);
        setSejoursPasses(result.sejoursPasses);
        
        // Sélectionner le premier séjour actif par défaut
        if (result.sejoursActifs.length > 0) {
          setSelectedSejour(result.sejoursActifs[0]);
        } else if (result.sejoursPasses.length > 0) {
          setSelectedSejour(result.sejoursPasses[0]);
        }
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  if (sejoursActifs.length === 0 && sejoursPasses.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
        <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Séjour</h1>
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🏥</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun séjour programmé</h2>
              <p className="text-gray-600 mb-6">Vous n'avez pas encore de séjour planifié. L'administration vous contactera pour organiser votre séjour médical.</p>
              <Link href="/patient/messages">
                <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all shadow-md">
                  <span className="mr-2">💬</span>
                  Contacter l'administration
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const badge = selectedSejour ? getStatutBadge(selectedSejour.statut) : null;
  const duree = selectedSejour ? calculateDuree(selectedSejour.dateArrivee, selectedSejour.dateDepart) : 0;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
      <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Séjour Médical</h1>
            <p className="text-gray-600">Informations détaillées sur votre séjour au Maroc</p>
          </div>

          {/* Sélection séjour si plusieurs */}
          {(sejoursActifs.length + sejoursPasses.length) > 1 && (
            <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un séjour</label>
              <select
                value={selectedSejour?.id || ''}
                onChange={(e) => {
                  const sejour = [...sejoursActifs, ...sejoursPasses].find(s => s.id === e.target.value);
                  setSelectedSejour(sejour || null);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              >
                {sejoursActifs.length > 0 && (
                  <optgroup label="Séjours actifs">
                    {sejoursActifs.map(sejour => (
                      <option key={sejour.id} value={sejour.id}>
                        {sejour.typeTraitement} - {new Date(sejour.dateArrivee).toLocaleDateString('fr-FR')}
                      </option>
                    ))}
                  </optgroup>
                )}
                {sejoursPasses.length > 0 && (
                  <optgroup label="Séjours passés">
                    {sejoursPasses.map(sejour => (
                      <option key={sejour.id} value={sejour.id}>
                        {sejour.typeTraitement} - {new Date(sejour.dateArrivee).toLocaleDateString('fr-FR')}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {selectedSejour && (
            <>
              {/* Bannière principale */}
              <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-5xl">🏥</div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedSejour.typeTraitement}</h2>
                        <p className="text-cyan-100 text-sm">{selectedSejour.clinique.nom}</p>
                      </div>
                    </div>
                    {badge && (
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border ${badge.color}`}>
                        {badge.icon} {badge.text}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-cyan-200 mb-1">Date d'arrivée</p>
                      <p className="font-bold text-lg">
                        {new Date(selectedSejour.dateArrivee).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-cyan-200 mb-1">Date de départ</p>
                      <p className="font-bold text-lg">
                        {new Date(selectedSejour.dateDepart).toLocaleDateString('fr-FR', { 
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
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche */}
                <div className="space-y-6">
                  {/* Clinique */}
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                      <h3 className="text-lg font-bold flex items-center">
                        <span className="mr-2">🏥</span>
                        Établissement
                      </h3>
                    </div>
                    <div className="p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-4">{selectedSejour.clinique.nom}</h4>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-xl mr-3">📍</span>
                          <div>
                            <p className="font-medium text-gray-900">{selectedSejour.clinique.adresse}</p>
                            <p className="text-gray-600">{selectedSejour.clinique.ville}, {selectedSejour.clinique.pays}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xl mr-3">📞</span>
                          <a href={`tel:${selectedSejour.clinique.telephone}`} className="text-teal-600 hover:text-teal-700 font-medium">
                            {selectedSejour.clinique.telephone}
                          </a>
                        </div>
                        {selectedSejour.clinique.email && (
                          <div className="flex items-center">
                            <span className="text-xl mr-3">📧</span>
                            <a href={`mailto:${selectedSejour.clinique.email}`} className="text-teal-600 hover:text-teal-700">
                              {selectedSejour.clinique.email}
                            </a>
                          </div>
                        )}
                        {selectedSejour.clinique.siteWeb && (
                          <div className="flex items-center">
                            <span className="text-xl mr-3">🌐</span>
                            <a 
                              href={selectedSejour.clinique.siteWeb} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:text-teal-700"
                            >
                              Site web de la clinique
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSejour.clinique.nom + ' ' + selectedSejour.clinique.ville)}`}
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
                  {selectedSejour.medecin && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        <h3 className="text-lg font-bold flex items-center">
                          <span className="mr-2">👨‍⚕️</span>
                          Médecin Traitant
                        </h3>
                      </div>
                      <div className="p-6">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          Dr. {selectedSejour.medecin.prenom} {selectedSejour.medecin.nom}
                        </h4>
                        <p className="text-gray-600 mb-4">{selectedSejour.medecin.specialite}</p>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="text-xl mr-3">📞</span>
                            <a href={`tel:${selectedSejour.medecin.telephone}`} className="text-blue-600 hover:text-blue-700 font-medium">
                              {selectedSejour.medecin.telephone}
                            </a>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xl mr-3">📧</span>
                            <a href={`mailto:${selectedSejour.medecin.email}`} className="text-blue-600 hover:text-blue-700">
                              {selectedSejour.medecin.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Colonne droite */}
                <div className="space-y-6">
                  {/* Détails du traitement */}
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                      <h3 className="text-lg font-bold flex items-center">
                        <span className="mr-2">💉</span>
                        Détails du Traitement
                      </h3>
                    </div>
                    <div className="p-6">
                      {selectedSejour.dateTraitement && (
                        <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">📅 Date du traitement</p>
                          <p className="font-bold text-gray-900">
                            {new Date(selectedSejour.dateTraitement).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {selectedSejour.descriptionTraitement && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Description :</p>
                          <p className="text-gray-600 leading-relaxed">{selectedSejour.descriptionTraitement}</p>
                        </div>
                      )}
                      {selectedSejour.notes && (
                        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                          <p className="text-sm font-medium text-gray-700 mb-1">📝 Notes importantes :</p>
                          <p className="text-gray-600 text-sm">{selectedSejour.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  
                  <div className="mt-6 flex gap-3">
                    <Link href={`/patient/sejour/${selectedSejour.id}`} className="flex-1">
                      <button className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all shadow-md">
                        <span className="mr-2">👁️</span>
                        Voir tous les détails
                      </button>
                    </Link>
                    
                    <Link href="/patient/messages" className="flex-1">
                      <button className="w-full px-6 py-3 bg-white hover:bg-gray-50 border-2 border-teal-500 text-teal-600 font-medium rounded-xl transition-all">
                        <span className="mr-2">💬</span>
                        Contacter
                      </button>
                    </Link>
                  </div>


                  {/* Services inclus */}
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      <h3 className="text-lg font-bold flex items-center">
                        <span className="mr-2">✨</span>
                        Services Inclus
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {selectedSejour.hebergementNecessaire && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-start">
                            <span className="text-2xl mr-3">🛏️</span>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">Hébergement</h4>
                              <p className="text-sm text-gray-600">
                                {selectedSejour.detailsHebergement || 'Hébergement inclus pendant votre séjour'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedSejour.transportNecessaire && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-start">
                            <span className="text-2xl mr-3">🚗</span>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">Transport</h4>
                              <p className="text-sm text-gray-600">
                                {selectedSejour.detailsTransport || 'Transfert aéroport-clinique organisé'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {!selectedSejour.hebergementNecessaire && !selectedSejour.transportNecessaire && (
                        <p className="text-gray-500 text-center py-4">Aucun service supplémentaire inclus</p>
                      )}
                    </div>
                  </div>

                  {/* Coordinateur */}
                  {selectedSejour.coordinateur && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white">
                        <h3 className="text-lg font-bold flex items-center">
                          <span className="mr-2">👤</span>
                          Votre Coordinateur
                        </h3>
                      </div>
                      <div className="p-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4">
                          {selectedSejour.coordinateur.prenom} {selectedSejour.coordinateur.nom}
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Votre coordinateur est disponible pour répondre à toutes vos questions et vous accompagner tout au long de votre séjour.
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="text-xl mr-3">📧</span>
                            <a href={`mailto:${selectedSejour.coordinateur.email}`} className="text-orange-600 hover:text-orange-700">
                              {selectedSejour.coordinateur.email}
                            </a>
                          </div>
                          {selectedSejour.coordinateur.telephone && (
                            <div className="flex items-center">
                              <span className="text-xl mr-3">📞</span>
                              <a href={`tel:${selectedSejour.coordinateur.telephone}`} className="text-orange-600 hover:text-orange-700 font-medium">
                                {selectedSejour.coordinateur.telephone}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <Link href="/patient/messages">
                            <button className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
                              <span className="mr-2">💬</span>
                              Envoyer un message
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Préparatifs */}
              <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📋</span>
                  Préparatifs avant votre arrivée
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✅</span>
                    <span>Passeport valide (minimum 6 mois après la date de retour)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✅</span>
                    <span>Dossier médical complet et documents d'assurance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✅</span>
                    <span>Coordonnées de contact d'urgence</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✅</span>
                    <span>Médicaments habituels en quantité suffisante</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}