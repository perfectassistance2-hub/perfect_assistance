// Fichier: app/medecin/patients/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/medecin/Sidebar';

interface Patient {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  sexe: string;
  pays: string;
  statut: string;
  dernierSejour?: {
    typeTraitement: string;
    dateArrivee: string;
    dateDepart: string;
    statut: string;
  };
}

export default function MesPatientsPage() {
  const router = useRouter();
  const [medecin, setMedecin] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger le médecin
      const dashResponse = await fetch('/api/medecin/dashboard');
      if (!dashResponse.ok) {
        router.push('/connexion');
        return;
      }
      const dashData = await dashResponse.json();
      setMedecin(dashData.medecin);

      // Charger les patients
      const patientsResponse = await fetch('/api/medecin/patients');
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData.patients || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateNaissance: string) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const patientsFiltres = patients.filter(patient => {
    const matchSearch = 
      patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatut = 
      filtreStatut === 'TOUS' || 
      patient.dernierSejour?.statut === filtreStatut;

    return matchSearch && matchStatut;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar medecin={medecin} />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Mes Patients</h1>
          <p className="text-gray-600">Gérez vos patients et leurs dossiers médicaux</p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Rechercher un patient
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, prénom, email..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtre statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Statut du séjour
              </label>
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TOUS">Tous les patients</option>
                <option value="PLANIFIE">Séjour planifié</option>
                <option value="EN_COURS">En séjour</option>
                <option value="TERMINE">Séjour terminé</option>
              </select>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <span>📊 Total: <strong>{patients.length}</strong></span>
            <span>•</span>
            <span>🔍 Affichés: <strong>{patientsFiltres.length}</strong></span>
          </div>
        </div>

        {/* Liste des patients */}
        {patientsFiltres.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <span className="text-6xl mb-4 block">👥</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun patient trouvé</h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Essayez de modifier vos critères de recherche"
                : "Vous n'avez pas encore de patients affectés"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patientsFiltres.map((patient) => (
              <Link key={patient.id} href={`/medecin/patients/${patient.id}`}>
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-blue-300">
                  {/* Avatar et infos */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl text-white font-bold">
                        {patient.prenom[0]}{patient.nom[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {patient.prenom} {patient.nom}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {calculateAge(patient.dateNaissance)} ans • {patient.sexe}
                      </p>
                    </div>
                  </div>

                  {/* Infos contact */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📧</span>
                      <span className="truncate">{patient.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📱</span>
                      <span>{patient.telephone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🌍</span>
                      <span>{patient.pays}</span>
                    </div>
                  </div>

                  {/* Statut du séjour */}
                  {patient.dernierSejour && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Séjour actuel</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          patient.dernierSejour.statut === 'EN_COURS'
                            ? 'bg-green-100 text-green-700'
                            : patient.dernierSejour.statut === 'PLANIFIE'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {patient.dernierSejour.statut}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {patient.dernierSejour.typeTraitement}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(patient.dernierSejour.dateArrivee).toLocaleDateString('fr-FR')} → {' '}
                        {new Date(patient.dernierSejour.dateDepart).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-all">
                      Voir le dossier complet →
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}