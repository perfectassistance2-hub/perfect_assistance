'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PatientSidebar from '@/components/patient/PatientSidebar';

interface Devis {
  id: string;
  numeroDevis: string;
  articles: string;
  sousTotal: number;
  taxe: number;
  total: number;
  devise: string;
  statutPaiement: 'EN_ATTENTE' | 'PARTIEL' | 'PAYE' | 'ANNULE';
  montantPaye: number;
  valideJusquau: string;
  dateCreation: string;
  sejour?: {
    typeTraitement: string;
    dateArrivee: string;
  };
}

export default function DevisPatient() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'TOUS' | 'EN_ATTENTE' | 'PAYE'>('TOUS');

  useEffect(() => {
    fetchDevis();
  }, []);

  const fetchDevis = async () => {
    try {
      // Récupérer les infos du patient
      const patientResponse = await fetch('/api/patient/profil');
      if (patientResponse.ok) {
        const patientResult = await patientResponse.json();
        if (patientResult.success && patientResult.patient) {
          setPatient(patientResult.patient);
        }
      }

      // Récupérer les devis
      const response = await fetch('/api/patient/devis');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement des devis');
      }

      const result = await response.json();
      
      if (result.success) {
        setDevisList(result.devis);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStatut = (statut: string) => {
    switch(statut) {
      case 'PAYE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PARTIEL':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'EN_ATTENTE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ANNULE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconeStatut = (statut: string) => {
    switch(statut) {
      case 'PAYE': return '✅';
      case 'PARTIEL': return '⏳';
      case 'EN_ATTENTE': return '📝';
      case 'ANNULE': return '❌';
      default: return '📄';
    }
  };

  const getLabelStatut = (statut: string) => {
    switch(statut) {
      case 'PAYE': return 'Payé';
      case 'PARTIEL': return 'Partiellement payé';
      case 'EN_ATTENTE': return 'En attente';
      case 'ANNULE': return 'Annulé';
      default: return statut;
    }
  };

  const isExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  const filteredDevis = devisList.filter(devis => {
    if (filter === 'TOUS') return true;
    if (filter === 'EN_ATTENTE') return devis.statutPaiement === 'EN_ATTENTE' || devis.statutPaiement === 'PARTIEL';
    if (filter === 'PAYE') return devis.statutPaiement === 'PAYE';
    return true;
  });

  const stats = {
    total: devisList.length,
    enAttente: devisList.filter(d => d.statutPaiement === 'EN_ATTENTE' || d.statutPaiement === 'PARTIEL').length,
    payes: devisList.filter(d => d.statutPaiement === 'PAYE').length,
    montantTotal: devisList.reduce((acc, d) => acc + d.total, 0),
    montantPaye: devisList.reduce((acc, d) => acc + d.montantPaye, 0)
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

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
        <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                Réessayer
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
      <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 Mes Devis</h1>
            <p className="text-gray-600">Consultez et gérez vos devis médicaux</p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Devis</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                  📄
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En attente</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.enAttente}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl">
                  ⏳
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.payes}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">
                  ✅
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Montant total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.montantTotal.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">MAD</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  💰
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilter('TOUS')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === 'TOUS'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({stats.total})
              </button>
              <button
                onClick={() => setFilter('EN_ATTENTE')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === 'EN_ATTENTE'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                En attente ({stats.enAttente})
              </button>
              <button
                onClick={() => setFilter('PAYE')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === 'PAYE'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Payés ({stats.payes})
              </button>
            </div>
          </div>

          {/* Liste des devis */}
          {filteredDevis.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun devis</h3>
              <p className="text-gray-600">
                {filter === 'TOUS' 
                  ? "Vous n'avez pas encore de devis"
                  : `Aucun devis ${filter === 'PAYE' ? 'payé' : 'en attente'}`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredDevis.map((devis) => {
                const expired = isExpired(devis.valideJusquau);
                const pourcentage = (devis.montantPaye / devis.total) * 100;

                return (
                  <div
                    key={devis.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {devis.numeroDevis}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBadgeStatut(devis.statutPaiement)}`}>
                              {getIconeStatut(devis.statutPaiement)} {getLabelStatut(devis.statutPaiement)}
                            </span>
                            {expired && devis.statutPaiement !== 'PAYE' && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                ⚠️ Expiré
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>📅 Créé le {new Date(devis.dateCreation).toLocaleDateString('fr-FR')}</span>
                            <span>📌 Valide jusqu'au {new Date(devis.valideJusquau).toLocaleDateString('fr-FR')}</span>
                            {devis.sejour && (
                              <span>🏥 {devis.sejour.typeTraitement}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Link href={`/patient/devis/${devis.id}`}>
                            <button className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium">
                              📄 Voir détails
                            </button>
                          </Link>
                        </div>
                      </div>

                      {/* Montants */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Montant total</p>
                          <p className="text-xl font-bold text-gray-900">{devis.total.toLocaleString()} {devis.devise}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Déjà payé</p>
                          <p className="text-xl font-bold text-green-600">{devis.montantPaye.toLocaleString()} {devis.devise}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Reste à payer</p>
                          <p className="text-xl font-bold text-orange-600">{(devis.total - devis.montantPaye).toLocaleString()} {devis.devise}</p>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      {devis.statutPaiement !== 'PAYE' && (
                        <div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pourcentage}%` }}
                            ></div>
                          </div>
                          <p className="text-right text-xs text-gray-600 mt-1">
                            {Math.round(pourcentage)}% payé
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}