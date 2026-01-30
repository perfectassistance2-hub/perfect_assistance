'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PatientSidebar from '@/components/patient/PatientSidebar';


interface Article {
  id: string;
  designation: string;
  description?: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

interface Paiement {
  id: string;
  datePaiementPrevue: string;
  montantPrevu: number;
  estPaye: boolean;
  datePaiementEffectif?: string;
  notes?: string;
}

interface Devis {
  id: string;
  numeroDevis: string;
  articles: Article[];
  sousTotal: number;
  taxe: number;
  total: number;
  devise: string;
  statutPaiement: string;
  montantPaye: number;
  valideJusquau: string;
  dateCreation: string;
  dateMiseAJour: string;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
  };
  sejour?: {
    id: string;
    typeTraitement: string;
    dateArrivee: string;
    statut: string;
    clinique?: {
      nom: string;
      ville: string;
    };
  };
}

export default function DetailDevis() {
  const router = useRouter();
  const params = useParams();
  const devisId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [devis, setDevis] = useState<Devis | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatient();
    fetchDevisDetails();
  }, [devisId]);

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

  const fetchDevisDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patient/devis/${devisId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        if (response.status === 404) {
          throw new Error('Devis non trouvé');
        }
        throw new Error('Erreur lors du chargement');
      }

      const result = await response.json();
      
      if (result.success) {
        setDevis(result.devis);
        setPaiements(result.paiements || []);
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

  const handlePrint = () => {
    window.print();
  };

  const handleContact = () => {
    router.push('/patient/messages');
  };

  const isExpired = (date: string) => {
    return new Date(date) < new Date();
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

  if (error || !devis) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
        <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {error || 'Devis non trouvé'}
              </h3>
              <p className="text-gray-600 mb-6">
                Ce devis n'existe pas ou n'est plus accessible.
              </p>
              <button
                onClick={() => router.push('/patient/devis')}
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

  const resteAPayer = devis.total - devis.montantPaye;
  const pourcentage = (devis.montantPaye / devis.total) * 100;
  const expired = isExpired(devis.valideJusquau);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
      <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* En-tête */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/patient/devis')}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center mb-4"
            >
              ← Retour à mes devis
            </button>
          </div>

          {/* Carte principale du devis */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            {/* Header coloré */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">📄 {devis.numeroDevis}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border bg-white/20 border-white/30 text-white`}>
                      {getIconeStatut(devis.statutPaiement)} {getLabelStatut(devis.statutPaiement)}
                    </span>
                    {expired && devis.statutPaiement !== 'PAYE' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white border border-red-600">
                        ⚠️ Expiré
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  
                  <button
                    onClick={handleContact}
                    className="px-4 py-2 bg-white text-purple-600 hover:bg-gray-100 rounded-lg transition-all font-medium"
                  >
                    💬 Contacter
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-purple-100">
                <span>📅 Créé le {new Date(devis.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                <span>📌 Valide jusqu'au {new Date(devis.valideJusquau).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Informations Patient & Séjour */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">👤</span> Informations Patient
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium text-gray-700">Nom :</span> {devis.patient.prenom} {devis.patient.nom}</p>
                    <p><span className="font-medium text-gray-700">Email :</span> {devis.patient.email}</p>
                    <p><span className="font-medium text-gray-700">Téléphone :</span> {devis.patient.telephone}</p>
                  </div>
                </div>

                {devis.sejour && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">🏥</span> Séjour Associé
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium text-gray-700">Traitement :</span> {devis.sejour.typeTraitement}</p>
                      <p><span className="font-medium text-gray-700">Date d'arrivée :</span> {new Date(devis.sejour.dateArrivee).toLocaleDateString('fr-FR')}</p>
                      {devis.sejour.clinique && (
                        <p><span className="font-medium text-gray-700">Clinique :</span> {devis.sejour.clinique.nom}, {devis.sejour.clinique.ville}</p>
                      )}
                      <Link href={`/patient/sejour/${devis.sejour.id}`}>
                        <button className="mt-2 text-teal-600 hover:text-teal-700 font-medium text-sm">
                          Voir le séjour →
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Articles du devis */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📦</span> Articles du Devis
              </h3>
              <div className="space-y-3">
                {devis.articles.map((article, index) => (
                  <div key={`article-${index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{index + 1}. {article.designation}</h4>
                        {article.description && (
                          <p className="text-sm text-gray-600 mt-1">{article.description}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-gray-900">{article.sousTotal.toLocaleString()} {devis.devise}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Quantité : {article.quantite}</span>
                      <span>Prix unitaire : {article.prixUnitaire.toLocaleString()} {devis.devise}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Récapitulatif financier */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💰</span> Récapitulatif Financier
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center text-gray-700">
                    <span>Sous-total</span>
                    <span className="font-medium">{devis.sousTotal.toLocaleString()} {devis.devise}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-700">
                    <span>Taxe</span>
                    <span className="font-medium">{devis.taxe.toLocaleString()} {devis.devise}</span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">TOTAL</span>
                      <span className="text-2xl font-bold text-gray-900">{devis.total.toLocaleString()} {devis.devise}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">✅ Montant payé</span>
                    <span className="text-xl font-bold text-green-600">{devis.montantPaye.toLocaleString()} {devis.devise}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-700 font-medium">⏳ Reste à payer</span>
                    <span className="text-xl font-bold text-orange-600">{resteAPayer.toLocaleString()} {devis.devise}</span>
                  </div>
                </div>

                {/* Barre de progression */}
                {devis.statutPaiement !== 'PAYE' && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${pourcentage}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-2 font-medium">
                      {Math.round(pourcentage)}% payé
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Historique des paiements */}
          {paiements.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="mr-2">📊</span> Historique des Paiements
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {paiements.map(paiement => (
                    <div 
                      key={paiement.id}
                      className={`p-4 rounded-lg border-2 ${
                        paiement.estPaye 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {paiement.estPaye ? '✅' : '⏳'}
                            <span className="font-bold text-gray-900">
                              {paiement.montantPrevu.toLocaleString()} {devis.devise}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            📅 Prévu le {new Date(paiement.datePaiementPrevue).toLocaleDateString('fr-FR')}
                          </p>
                          {paiement.notes && (
                            <p className="text-xs text-gray-500 mt-1">{paiement.notes}</p>
                          )}
                          {paiement.estPaye && paiement.datePaiementEffectif && (
                            <p className="text-xs text-green-600 mt-1">
                              ✅ Payé le {new Date(paiement.datePaiementEffectif).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Informations complémentaires */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📝</span> Informations Complémentaires
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Ce devis est valide jusqu'au {new Date(devis.valideJusquau).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</li>
              <li>• Les prix sont en {devis.devise} (Dirham marocain)</li>
              <li>• Pour toute question concernant ce devis, utilisez le bouton "Contacter" ci-dessus</li>
              <li>• Les paiements sont gérés par l'administration de Perfect Assistance</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}