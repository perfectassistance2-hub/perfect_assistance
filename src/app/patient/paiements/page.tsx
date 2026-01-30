'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';

interface Devis {
  id: string;
  numero: string;
  typeTraitement: string;
  montantTotal: number;
  statut: string;
  dateCreation: string;
}

interface Paiement {
  id: string;
  devisId: string;
  datePaiementPrevue: string;
  montantPrevu: number;
  estPaye: boolean;
  datePaiementEffectif?: string;
  notes?: string;
}

export default function SuiviPaiementsPatient() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDevisId, setSelectedDevisId] = useState('');
  const [error, setError] = useState('');
  
  // Form state
  const [formDate, setFormDate] = useState('');
  const [formMontant, setFormMontant] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les infos du patient
      const patientResponse = await fetch('/api/patient/profil');
      if (patientResponse.ok) {
        const patientResult = await patientResponse.json();
        if (patientResult.success && patientResult.patient) {
          setPatient(patientResult.patient);
        }
      }
      
      // Récupérer les devis
      const devisResponse = await fetch('/api/patient/devis');
      if (!devisResponse.ok) {
        if (devisResponse.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement des devis');
      }
      
      const devisResult = await devisResponse.json();
      if (devisResult.success) {
        setDevis(devisResult.devis || []);
        if (devisResult.devis && devisResult.devis.length > 0) {
          setSelectedDevisId(devisResult.devis[0].id);
        }
      }

      // Récupérer les paiements
      const paiementsResponse = await fetch('/api/patient/paiements');
      if (paiementsResponse.ok) {
        const paiementsResult = await paiementsResponse.json();
        if (paiementsResult.success) {
          setPaiements(paiementsResult.paiements || []);
        }
      }
      
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ajouterPaiement = async () => {
    if (!selectedDevisId || !formDate || !formMontant) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await fetch('/api/patient/paiements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          devisId: selectedDevisId,
          datePaiementPrevue: formDate,
          montantPrevu: parseFloat(formMontant),
          notes: formNotes || null
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormDate('');
        setFormMontant('');
        setFormNotes('');
        fetchData();
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de l\'ajout du paiement');
    }
  };

  const marquerCommePaye = async (paiementId: string) => {
    try {
      const response = await fetch('/api/patient/paiements', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paiementId,
          estPaye: true
        })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const supprimerPaiement = async (paiementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette échéance ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/patient/paiements?id=${paiementId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Calculer les statistiques
  const montantTotal = devis.reduce((sum, d) => sum + d.montantTotal, 0);
  const montantPaye = paiements
    .filter(p => p.estPaye)
    .reduce((sum, p) => sum + p.montantPrevu, 0);
  const montantRestant = montantTotal - montantPaye;
  const pourcentagePaye = montantTotal > 0 ? (montantPaye / montantTotal) * 100 : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(montant);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 Suivi des Paiements</h1>
            <p className="text-gray-600">Gérez vos paiements et échéances personnelles</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <p className="font-medium">⚠️ Erreur</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Vue d'ensemble */}
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="text-3xl mr-3">📊</span>
              Vue d'ensemble
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-teal-100 text-sm mb-1">Montant total</p>
                <p className="text-3xl font-bold">{formatMontant(montantTotal)}</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-teal-100 text-sm mb-1">Déjà payé</p>
                <p className="text-3xl font-bold text-green-300">{formatMontant(montantPaye)}</p>
                <p className="text-sm text-teal-100 mt-1">{pourcentagePaye.toFixed(0)}% du total</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-teal-100 text-sm mb-1">Reste à payer</p>
                <p className="text-3xl font-bold text-yellow-300">{formatMontant(montantRestant)}</p>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="bg-white/20 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${pourcentagePaye}%` }}
              >
                {pourcentagePaye > 10 && (
                  <span className="text-xs font-bold text-white">{pourcentagePaye.toFixed(0)}%</span>
                )}
              </div>
            </div>
          </div>

          {/* Liste des devis */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">📋 Mes Devis</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {devis.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-600">Aucun devis pour le moment</p>
                </div>
              ) : (
                devis.map(d => {
                  const paiementsDevis = paiements.filter(p => p.devisId === d.id);
                  const totalPaye = paiementsDevis.filter(p => p.estPaye).reduce((sum, p) => sum + p.montantPrevu, 0);
                  const pourcentage = (totalPaye / d.montantTotal) * 100;

                  return (
                    <div key={d.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{d.numero}</h3>
                          <p className="text-gray-600">{d.typeTraitement}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          d.statut === 'VALIDE' ? 'bg-green-100 text-green-700' :
                          d.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {d.statut}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-lg font-bold text-gray-900">{formatMontant(d.montantTotal)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Payé</p>
                          <p className="text-lg font-bold text-green-600">{formatMontant(totalPaye)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Reste</p>
                          <p className="text-lg font-bold text-yellow-600">{formatMontant(d.montantTotal - totalPaye)}</p>
                        </div>
                      </div>

                      <div className="bg-gray-100 rounded-full h-2 mb-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all"
                          style={{ width: `${pourcentage}%` }}
                        />
                      </div>

                      <button
                        onClick={() => router.push(`/patient/devis#${d.id}`)}
                        className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                      >
                        Voir les détails →
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Échéancier */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="text-3xl mr-3">📅</span>
                Mon Échéancier Personnel
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                + Ajouter une échéance
              </button>
            </div>

            <div className="space-y-3">
              {paiements.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-gray-600 mb-4">Aucune échéance planifiée</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Ajouter votre première échéance →
                  </button>
                </div>
              ) : (
                paiements.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      p.estPaye
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => !p.estPaye && marquerCommePaye(p.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-all ${
                          p.estPaye
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-teal-500'
                        }`}
                        disabled={p.estPaye}
                      >
                        {p.estPaye && <span className="text-white text-sm">✓</span>}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`font-bold mr-3 ${p.estPaye ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {formatDate(p.datePaiementPrevue)}
                          </span>
                          <span className={`text-lg font-bold ${p.estPaye ? 'text-green-600' : 'text-teal-600'}`}>
                            {formatMontant(p.montantPrevu)}
                          </span>
                        </div>
                        {p.notes && (
                          <p className="text-sm text-gray-600 mt-1">{p.notes}</p>
                        )}
                        {p.estPaye && p.datePaiementEffectif && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ Payé le {formatDate(p.datePaiementEffectif)}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => supprimerPaiement(p.id)}
                      className="ml-4 text-red-600 hover:text-red-700 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Ajouter échéance */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Ajouter une échéance</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devis concerné
                </label>
                <select
                  value={selectedDevisId}
                  onChange={(e) => setSelectedDevisId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {devis.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.numero} - {d.typeTraitement}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date prévue *
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (MAD) *
                </label>
                <input
                  type="number"
                  value={formMontant}
                  onChange={(e) => setFormMontant(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="15000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Ex: Paiement par virement"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={ajouterPaiement}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}