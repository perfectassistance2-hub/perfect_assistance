// Fichier: app/medecin/rendez-vous/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

export default function MesRendezVousPage() {
  const router = useRouter();
  const [medecin, setMedecin] = useState<any>(null);
  const [rendezVous, setRendezVous] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [filtreType, setFiltreType] = useState('TOUS');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dashResponse = await fetch('/api/medecin/dashboard');
      if (!dashResponse.ok) {
        router.push('/connexion');
        return;
      }
      const dashData = await dashResponse.json();
      setMedecin(dashData.medecin);

      const rdvResponse = await fetch('/api/medecin/rendez-vous');
      if (rdvResponse.ok) {
        const rdvData = await rdvResponse.json();
        setRendezVous(rdvData.rendezVous || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const canJoinMeeting = (rdv: any) => {
    if (rdv.type !== 'EN_LIGNE') return false;
    
    const rdvDate = new Date(rdv.datePrevue);
    const now = new Date();
    const diff = rdvDate.getTime() - now.getTime();
    const minutesDiff = diff / (1000 * 60);
    
    return minutesDiff <= 5 && minutesDiff >= -(rdv.duree || 30);
  };

  const getTimeUntilRdv = (datePrevue: string) => {
    const rdvDate = new Date(datePrevue);
    const now = new Date();
    const diff = rdvDate.getTime() - now.getTime();
    const minutesDiff = Math.floor(diff / (1000 * 60));
    const hoursDiff = Math.floor(minutesDiff / 60);
    const daysDiff = Math.floor(hoursDiff / 24);

    if (minutesDiff < 0) return 'Passé';
    if (minutesDiff < 60) return `Dans ${minutesDiff} min`;
    if (hoursDiff < 24) return `Dans ${hoursDiff}h`;
    return `Dans ${daysDiff} jour(s)`;
  };

  const rdvFiltres = rendezVous.filter(rdv => {
    const matchStatut = filtreStatut === 'TOUS' || rdv.statut === filtreStatut;
    const matchType = filtreType === 'TOUS' || rdv.type === filtreType;
    return matchStatut && matchType;
  });

  const rdvAVenir = rdvFiltres.filter(rdv => new Date(rdv.datePrevue) >= new Date() && rdv.statut !== 'TERMINE' && rdv.statut !== 'ANNULE');
  const rdvPasses = rdvFiltres.filter(rdv => new Date(rdv.datePrevue) < new Date() || rdv.statut === 'TERMINE' || rdv.statut === 'ANNULE');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!medecin) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar medecin={medecin} />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Mes Rendez-vous</h1>
          <p className="text-gray-600">Gérez vos consultations et rejoignez vos visioconférences</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Statut
              </label>
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="PLANIFIE">Planifié</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="TERMINE">Terminé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Type
              </label>
              <select
                value={filtreType}
                onChange={(e) => setFiltreType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TOUS">Tous les types</option>
                <option value="EN_LIGNE">🎥 En ligne</option>
                <option value="SUR_PLACE">🏥 Sur place</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <span>📊 Total: <strong>{rendezVous.length}</strong></span>
            <span>•</span>
            <span>🔍 Affichés: <strong>{rdvFiltres.length}</strong></span>
            <span>•</span>
            <span>⏰ À venir: <strong>{rdvAVenir.length}</strong></span>
          </div>
        </div>

        {rdvAVenir.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⏰ Rendez-vous à venir</h2>
            <div className="space-y-4">
              {rdvAVenir.map((rdv) => (
                <div
                  key={rdv.id}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xl text-white">
                          {rdv.patient?.prenom[0]}{rdv.patient?.nom[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {rdv.patient?.prenom} {rdv.patient?.nom}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rdv.type === 'EN_LIGNE'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {rdv.type === 'EN_LIGNE' ? '🎥 En ligne' : '🏥 Sur place'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rdv.statut === 'CONFIRME'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {rdv.statut}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900 font-medium">
                            📅 {new Date(rdv.datePrevue).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            🕐 {new Date(rdv.datePrevue).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} • Durée: {rdv.duree} minutes
                          </p>
                          {rdv.raison && (
                            <p className="text-sm text-gray-600">
                              📋 {rdv.raison}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        canJoinMeeting(rdv)
                          ? 'bg-green-100 text-green-700 animate-pulse'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {getTimeUntilRdv(rdv.datePrevue)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                    <Link href={`/medecin/rendez-vous/${rdv.id}`} className="flex-1">
                      <button className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-all">
                        📋 Voir les détails
                      </button>
                    </Link>

                    {canJoinMeeting(rdv) && (
                      <Link href={`/medecin/rendez-vous/${rdv.id}/consultation`} className="flex-1">
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all animate-pulse">
                          🎥 Rejoindre maintenant
                        </button>
                      </Link>
                    )}

                    {rdv.type === 'EN_LIGNE' && !canJoinMeeting(rdv) && (
                      <div className="flex-1">
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
                        >
                          🎥 Disponible 5 min avant
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rdvPasses.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📜 Historique</h2>
            <div className="space-y-3">
              {rdvPasses.map((rdv) => (
                <div
                  key={rdv.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => router.push(`/medecin/rendez-vous/${rdv.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-2xl">
                        {rdv.type === 'EN_LIGNE' ? '🎥' : '🏥'}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {rdv.patient?.prenom} {rdv.patient?.nom}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(rdv.datePrevue).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })} à {new Date(rdv.datePrevue).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rdv.statut === 'TERMINE'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {rdv.statut}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rdvFiltres.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <span className="text-6xl mb-4 block">📅</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun rendez-vous</h3>
            <p className="text-gray-600">
              {filtreStatut !== 'TOUS' || filtreType !== 'TOUS'
                ? 'Aucun rendez-vous ne correspond à vos filtres'
                : "Vous n&apos;avez pas de rendez-vous programmés"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}