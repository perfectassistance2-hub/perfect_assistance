'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Sejour {
  id: string;
  statut: string;
  dateArrivee: string;
  dateDepart: string;
  dateTraitement: string | null;
  typeTraitement: string;
  descriptionTraitement: string;
  hebergementNecessaire: boolean;
  detailsHebergement: string;
  transportNecessaire: boolean;
  detailsTransport: string;
  notes: string;
  dateCreation: string;
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    pays: string;
  };
  coordinateur: {
    prenom: string;
    nom: string;
    email: string;
  };
  clinique: {
    nom: string;
    ville: string;
    adresse: string;
    telephone: string;
  };
  medecin?: {
    prenom: string;
    nom: string;
    specialite: string;
    email: string;
  };
}

export default function DetailSejourAdmin() {
  const router = useRouter();
  const params = useParams();
  const sejourId = params.id as string;

  const [sejour, setSejour] = useState<Sejour | null>(null);
  const [rendezVous, setRendezVous] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [devis, setDevis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSejourDetails();
  }, [sejourId]);

  const fetchSejourDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sejours/${sejourId}`);
      
      if (!response.ok) {
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
        setDevis(result.devis || []);
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
      case 'PLANIFIE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EN_COURS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TERMINE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ANNULE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconeStatut = (statut: string) => {
    switch(statut) {
      case 'PLANIFIE': return '📅';
      case 'EN_COURS': return '🏥';
      case 'TERMINE': return '✅';
      case 'ANNULE': return '❌';
      default: return '📋';
    }
  };

  const calculateDuree = (debut: string, fin: string) => {
    const diff = new Date(fin).getTime() - new Date(debut).getTime();
    const jours = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return jours;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#4DB8A8] border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !sejour) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
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
              onClick={() => router.push('/admin/sejours')}
              className="px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-all font-medium"
            >
              ← Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dureeJours = calculateDuree(sejour.dateArrivee, sejour.dateDepart);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/sejours')}
            className="text-[#4DB8A8] hover:text-[#3DA391] font-medium flex items-center mb-4"
          >
            ← Retour aux séjours
          </button>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">🏥 Séjour Médical</h1>
                <p className="text-white/80">{sejour.typeTraitement}</p>
              </div>
                <div className="flex items-center gap-2">
                <Link href={`/admin/sejours/${sejourId}/modifier`}>
                    <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-lg transition-all font-medium border border-white/30">
                    ✏️ Modifier
                    </button>
                </Link>
                <span className="...">
                    {getIconeStatut(sejour.statut)} {sejour.statut}
                </span>
                </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              <span>📅 {new Date(sejour.dateArrivee).toLocaleDateString('fr-FR')} → {new Date(sejour.dateDepart).toLocaleDateString('fr-FR')}</span>
              <span>⏱️ Durée: {dureeJours} jour{dureeJours > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {/* Section Patient */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">👤</span> Patient
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nom complet</p>
                  <p className="font-medium text-gray-900">{sejour.patient.prenom} {sejour.patient.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{sejour.patient.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium text-gray-900">{sejour.patient.telephone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pays</p>
                  <p className="font-medium text-gray-900">{sejour.patient.pays}</p>
                </div>
                <div className="md:col-span-2">
                  <Link href={`/admin/patients/${sejour.patient.id}`}>
                    <button className="text-[#4DB8A8] hover:text-[#3DA391] font-medium text-sm">
                      Voir le profil complet →
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Section Traitement */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💊</span> Traitement
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Type de traitement</p>
                  <p className="font-medium text-gray-900">{sejour.typeTraitement}</p>
                </div>
                {sejour.descriptionTraitement && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-gray-900">{sejour.descriptionTraitement}</p>
                  </div>
                )}
                {sejour.dateTraitement && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Date du traitement</p>
                    <p className="font-medium text-gray-900">{new Date(sejour.dateTraitement).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section Clinique et Médecin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🏥</span> Clinique
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-gray-900">{sejour.clinique.nom}</p>
                  <p className="text-sm text-gray-600">{sejour.clinique.adresse}</p>
                  <p className="text-sm text-gray-600">{sejour.clinique.ville}</p>
                  <p className="text-sm text-gray-600">📞 {sejour.clinique.telephone}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">👨‍⚕️</span> Médecin
                </h2>
                {sejour.medecin ? (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <p className="font-medium text-gray-900">Dr. {sejour.medecin.prenom} {sejour.medecin.nom}</p>
                    <p className="text-sm text-gray-600">{sejour.medecin.specialite}</p>
                    <p className="text-sm text-gray-600">📧 {sejour.medecin.email}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500">Aucun médecin assigné</p>
                  </div>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🛎️</span> Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-lg p-4 border-2 ${sejour.hebergementNecessaire ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">🏨 Hébergement</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${sejour.hebergementNecessaire ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {sejour.hebergementNecessaire ? 'Requis' : 'Non requis'}
                    </span>
                  </div>
                  {sejour.detailsHebergement && (
                    <p className="text-sm text-gray-600">{sejour.detailsHebergement}</p>
                  )}
                </div>

                <div className={`rounded-lg p-4 border-2 ${sejour.transportNecessaire ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">🚗 Transport</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${sejour.transportNecessaire ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {sejour.transportNecessaire ? 'Requis' : 'Non requis'}
                    </span>
                  </div>
                  {sejour.detailsTransport && (
                    <p className="text-sm text-gray-600">{sejour.detailsTransport}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Coordinateur */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">👔</span> Coordinateur
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">{sejour.coordinateur.prenom} {sejour.coordinateur.nom}</p>
                <p className="text-sm text-gray-600">📧 {sejour.coordinateur.email}</p>
              </div>
            </div>

            {/* Notes */}
            {sejour.notes && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📝</span> Notes
                </h2>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{sejour.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sections supplémentaires */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rendez-vous */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Rendez-vous ({rendezVous.length})</h3>
            {rendezVous.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Aucun rendez-vous</p>
            ) : (
              <div className="space-y-2">
                {rendezVous.slice(0, 3).map((rdv) => (
                  <div key={rdv.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-900">{new Date(rdv.datePrevue).toLocaleDateString('fr-FR')}</p>
                    <p className="text-gray-600 text-xs">{rdv.type} - {rdv.statut}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📄 Documents ({documents.length})</h3>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Aucun document</p>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-900 truncate">{doc.titre}</p>
                    <p className="text-gray-600 text-xs">{doc.type}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Devis */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Devis ({devis.length})</h3>
            {devis.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Aucun devis</p>
            ) : (
              <div className="space-y-2">
                {devis.map((d) => (
                  <div key={d.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-900">{d.numeroDevis}</p>
                    <p className="text-gray-600 text-xs">{d.total.toLocaleString()} {d.devise}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}