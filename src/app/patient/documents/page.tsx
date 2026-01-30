'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';
import UploadDocumentModal from '@/components/patient/UploadDocumentModal';
import Link from 'next/link';

interface Document {
  id: string;
  titre: string;
  description?: string;
  type: string;
  urlFichier: string;
  nomFichier: string;
  tailleFichier: number;
  typeMime: string;
  ajoutePar: string;
  dateTeleversement: string;
}

export default function DocumentsPatient() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [parType, setParType] = useState<any>({});
  const [typeFilter, setTypeFilter] = useState('TOUS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [totalDocuments, setTotalDocuments] = useState(0); // ✅ Compteur total permanent

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter]);

  const fetchDocuments = async () => {
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

      const response = await fetch(`/api/patient/documents?type=${typeFilter}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement des documents');
      }

      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.documents);
        setParType(result.parType);
        
        // ✅ Calculer le total de TOUS les documents (somme de tous les types)
        const total = Object.values(result.parType).reduce((sum: number, docs: any) => sum + docs.length, 0);
        setTotalDocuments(total);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: any = {
      'PASSEPORT': { icon: '🛂', label: 'Passeport', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'CARTE_IDENTITE': { icon: '🪪', label: 'Carte d\'identité', color: 'bg-green-100 text-green-800 border-green-200' },
      'EXAMEN_MEDICAL': { icon: '🩺', label: 'Examen médical', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      'ORDONNANCE': { icon: '💊', label: 'Ordonnance', color: 'bg-pink-100 text-pink-800 border-pink-200' },
      'FACTURE': { icon: '🧾', label: 'Facture', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'RECU': { icon: '📄', label: 'Reçu', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'AUTRE': { icon: '📎', label: 'Autre', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    return types[type] || types.AUTRE;
  };

  const getAjouteParLabel = (ajoutePar: string) => {
    const labels: any = {
      'patient': '👤 Vous',
      'medecin': '👨‍⚕️ Médecin',
      'admin': '🏥 Administration'
    };
    return labels[ajoutePar] || ajoutePar;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async (doc: Document) => {
    window.open(`/api/patient/documents/${doc.id}/download`, '_blank');
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Documents</h1>
              <p className="text-gray-600">Consultez et téléchargez vos documents médicaux</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg flex items-center"
              >
                <span className="mr-2">📤</span>
                Ajouter un document
              </button>
              
              <Link 
                href="/patient/messages"
                className="px-6 py-3 border-2 border-teal-500 text-teal-600 hover:bg-teal-50 font-medium rounded-xl transition-all flex items-center"
              >
                <span className="mr-2">💬</span>
                Contacter
              </Link>
            </div>
          </div>

          {/* Filtres par type */}
          <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <button
                onClick={() => setTypeFilter('TOUS')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all text-center ${
                  typeFilter === 'TOUS'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">📁</div>
                <div className="text-xs font-semibold">Tous</div>
                <div className="text-xs opacity-75">({totalDocuments})</div>
              </button>
              {Object.entries(parType).map(([type, docs]: [string, any]) => {
                const typeInfo = getTypeLabel(type);
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-2.5 rounded-lg font-medium transition-all text-center ${
                      typeFilter === type
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{typeInfo.icon}</div>
                    <div className="text-xs font-semibold truncate">{typeInfo.label}</div>
                    <div className="text-xs opacity-75">({docs.length})</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Liste des documents */}
          {documents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📂</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun document</h2>
              <p className="text-gray-600 mb-6">
                {typeFilter === 'TOUS' 
                  ? 'Vous n\'avez pas encore de documents. Les documents ajoutés par votre médecin ou l\'administration apparaîtront ici.'
                  : `Aucun document de type "${getTypeLabel(typeFilter).label}"`
                }
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all shadow-md"
              >
                <span className="mr-2">📤</span>
                Ajouter votre premier document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map(doc => {
                const typeInfo = getTypeLabel(doc.type);
                return (
                  <div key={doc.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100">
                    <div className={`px-4 py-3 ${typeInfo.color.replace('text', 'bg').replace('100', '50')} border-b border-gray-100`}>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${typeInfo.color}`}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                        <span className="text-xs text-gray-600">
                          {getAjouteParLabel(doc.ajoutePar)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{doc.titre}</h3>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                      )}
                      
                      <div className="space-y-2 mb-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">📄</span>
                          <span className="truncate">{doc.nomFichier}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="mr-2">💾</span>
                            <span>{formatFileSize(doc.tailleFichier)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">📅</span>
                            <span>{new Date(doc.dateTeleversement).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/patient/documents/${doc.id}`}
                          className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors flex items-center justify-center"
                        >
                          <span className="mr-2">👁️</span>
                          Voir
                        </Link>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                        >
                          <span className="mr-2">⬇️</span>
                          Télécharger
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal Upload */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={fetchDocuments}
      />
    </div>
  );
}