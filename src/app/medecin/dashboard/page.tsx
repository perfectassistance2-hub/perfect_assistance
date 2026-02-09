// app/medecin/dashboard/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

interface ConsultationVideo {
  id: string;
  titre: string;
  plateforme: 'DAILY' | 'ZEGOCLOUD';
  date_debut: string;
  duree: number;
  statut: string;
  lien_medecin: string;
  enregistrement_autorise: boolean;
  rendez_vous?: {
    id: string;
    raison: string;
    patient?: {
      id: string;
      prenom: string;
      nom: string;
    };
  };
}

interface DashboardData {
  medecin: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    specialite: string;
    telephone: string;
    clinique?: any;
  };
  stats: {
    patientsCount: number;
    rendezVousAujourdhui: number;
    prochainsRendezVous: any[];
    prochainesVisios?: ConsultationVideo[]; // ✅ NOUVEAU
    sejoursActifs: any[];
    messagesNonLus: number;
  };
}

export default function MedecinDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/medecin/dashboard');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur chargement');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/connexion');
    } finally {
      setLoading(false);
    }
  };

  const canJoinMeeting = (rdv: any) => {
    if (rdv.type !== 'EN_LIGNE' || !rdv.urlReunion) return false;
    
    const rdvDate = new Date(rdv.datePrevue);
    const now = new Date();
    const diff = rdvDate.getTime() - now.getTime();
    const minutesDiff = diff / (1000 * 60);
    
    return minutesDiff <= 5 && minutesDiff >= -(rdv.duree || 30);
  };

  // ✅ NOUVEAU - Vérifier si visio accessible
  const canJoinVisio = (dateDebut: string, duree: number) => {
    const debut = new Date(dateDebut);
    const now = new Date();
    const diff = (debut.getTime() - now.getTime()) / (1000 * 60); // en minutes
    
    // Peut rejoindre 15 min avant et pendant la durée
    return diff <= 15 && diff >= -duree;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar medecin={data.medecin} messagesNonLus={data.stats.messagesNonLus} />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue Dr. {data.medecin.prenom} 👋
          </h1>
          <p className="text-gray-600">
            {data.medecin.specialite}
            {data.medecin.clinique && ` • ${data.medecin.clinique.nom}`}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/medecin/patients">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {data.stats.patientsCount}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Patients actifs</h3>
            </div>
          </Link>

          <Link href="/medecin/rendez-vous">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {data.stats.rendezVousAujourdhui}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">RDV aujourd'hui</h3>
            </div>
          </Link>

          <Link href="/medecin/messages">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {data.stats.messagesNonLus}
                  </span>
                  {data.stats.messagesNonLus > 0 && (
                    <span className="bg-red-500 w-3 h-3 rounded-full animate-pulse"></span>
                  )}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Messages non lus</h3>
            </div>
          </Link>
        </div>

        {/* ✅ NOUVEAU - Prochaines Visioconférences */}
        {data.stats.prochainesVisios && data.stats.prochainesVisios.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🎥</span>
                Mes Visioconférences
              </h2>
            </div>

            <div className="space-y-4">
              {data.stats.prochainesVisios.map((visio) => {
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
                          <p>📅 {new Date(visio.date_debut).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} à {new Date(visio.date_debut).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                          <p>⏱️ Durée: {visio.duree} minutes</p>
                          {visio.rendez_vous?.patient && (
                            <p>👤 Patient: {visio.rendez_vous.patient.prenom} {visio.rendez_vous.patient.nom}</p>
                          )}
                          {visio.enregistrement_autorise && (
                            <p className="text-orange-600">
                              🔴 Enregistrement autorisé
                              {visio.plateforme === 'ZEGOCLOUD' && ' (non disponible sur ZegoCloud)'}
                            </p>
                          )}
                        </div>

                        {visio.rendez_vous && (
                          <Link 
                            href={`/medecin/rendez-vous/${visio.rendez_vous.id}`}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Voir le rendez-vous associé →
                          </Link>
                        )}
                      </div>

                      {peutRejoindre && visio.rendez_vous && (
                        <Link href={`/medecin/rendez-vous/${visio.rendez_vous.id}/consultation`}>
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

        {/* Actions rapides */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-8 text-white">
          <h2 className="text-xl font-bold mb-4">⚡ Actions rapides</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/medecin/patients">
              <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-xl font-medium transition-all">
                👥 Voir mes patients
              </button>
            </Link>
            <Link href="/medecin/rendez-vous">
              <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-xl font-medium transition-all">
                📅 Mes rendez-vous
              </button>
            </Link>
            <Link href="/medecin/messages/nouveau">
              <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-xl font-medium transition-all">
                ✉️ Contacter l'admin
              </button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Prochains rendez-vous */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">📅 Prochains rendez-vous</h2>
              <Link href="/medecin/rendez-vous">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Voir tous →
                </button>
              </Link>
            </div>

            {data.stats.prochainsRendezVous.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">📅</span>
                <p className="text-gray-500">Aucun rendez-vous à venir</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.stats.prochainsRendezVous.map((rdv) => (
                  <div
                    key={rdv.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">
                            {rdv.type === 'EN_LIGNE' ? '🎥' : '🏥'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {rdv.patient?.prenom} {rdv.patient?.nom}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(rdv.datePrevue).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })} • {new Date(rdv.datePrevue).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rdv.statut === 'CONFIRME'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rdv.statut}
                      </span>
                    </div>

                    {rdv.raison && (
                      <p className="text-sm text-gray-600 mb-3">
                        📋 {rdv.raison}
                      </p>
                    )}

                    <div className="flex items-center space-x-2">
                      <Link href={`/medecin/patients/${rdv.patient?.id}`} className="flex-1">
                        <button className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all">
                          Voir dossier
                        </button>
                      </Link>
                      {canJoinMeeting(rdv) && (
                        <Link href={`/medecin/rendez-vous/${rdv.id}/consultation`} className="flex-1">
                          <button className="w-full px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all">
                            🎥 Rejoindre
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patients en séjour actif */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">🏥 Séjours en cours</h2>
              <Link href="/medecin/patients">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Voir tous →
                </button>
              </Link>
            </div>

            {data.stats.sejoursActifs.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">🏥</span>
                <p className="text-gray-500">Aucun séjour en cours</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.stats.sejoursActifs.map((sejour) => (
                  <div
                    key={sejour.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {sejour.patient?.prenom} {sejour.patient?.nom}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {sejour.typeTraitement}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        EN COURS
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3 space-y-1">
                      <p>📅 Arrivée: {new Date(sejour.dateArrivee).toLocaleDateString('fr-FR')}</p>
                      <p>📅 Départ: {new Date(sejour.dateDepart).toLocaleDateString('fr-FR')}</p>
                    </div>

                    <Link href={`/medecin/patients/${sejour.patient?.id}`}>
                      <button className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-all">
                        Voir le dossier complet
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}