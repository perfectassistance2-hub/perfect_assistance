'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';

interface Document {
  id: string;
  titre: string;
  description?: string;
  type: string;
  urlFichier: string;
  tailleFichier?: number;
  partageAvecMedecin: boolean;
  notes?: string;
  ajoutePar?: string;
  dateCreation: string;
  dateMiseAJour: string;
  nomFichier?: string;
  typeMime?: string;
}

export default function DetailDocument() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitre, setEditTitre] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatient();
    fetchDocumentDetails();
  }, [docId]);

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

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patient/documents/${docId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        if (response.status === 404) {
          throw new Error('Document non trouvé');
        }
        throw new Error('Erreur lors du chargement');
      }

      const result = await response.json();
      
      if (result.success) {
        setDocument(result.document);
        setEditTitre(result.document.titre);
        setEditNotes(result.document.notes || '');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Utiliser l'API de téléchargement qui masque l'URL Supabase
    window.open(`/api/patient/documents/${docId}/download`, '_blank');
  };

  const handleOpenFile = () => {
    // Ouvrir le fichier dans un nouvel onglet (pour visualisation)
    window.open(`/api/patient/documents/${docId}/preview`, '_blank');
  };

  const togglePartage = async () => {
    if (!document) return;

    try {
      const response = await fetch(`/api/patient/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          partageAvecMedecin: !document.partageAvecMedecin 
        })
      });

      if (response.ok) {
        fetchDocumentDetails();
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors du changement de partage');
    }
  };

  const saveEdit = async () => {
    if (!document) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/patient/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          titre: editTitre,
          notes: editNotes
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchDocumentDetails();
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const supprimerDocument = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/patient/documents/${docId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/patient/documents');
      } else {
        const result = await response.json();
        alert(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTaille = (taille?: number) => {
    if (!taille) return 'Taille inconnue';
    
    if (taille < 1024) return `${taille} B`;
    if (taille < 1024 * 1024) return `${(taille / 1024).toFixed(1)} KB`;
    return `${(taille / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIconeType = (type: string) => {
    if (!type) return '📄';
    if (type.includes('pdf')) return '📕';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('doc')) return '📘';
    if (type.includes('excel') || type.includes('sheet')) return '📗';
    return '📄';
  };

  const isPDF = (type: string) => type && type.includes('pdf');
  const isImage = (type: string) => type && type.includes('image');

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

  if (error || !document) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
        <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {error || 'Document non trouvé'}
              </h3>
              <p className="text-gray-600 mb-6">
                Ce document n'existe pas ou n'est plus accessible.
              </p>
              <button
                onClick={() => router.push('/patient/documents')}
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
      <PatientSidebar patient={patient || { id: '', prenom: '', nom: '', email: '' }} />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/patient/documents')}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center"
            >
              ← Retour à la liste
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="text-4xl mr-3">{getIconeType(document.type)}</span>
                        <div>
                          <h1 className="text-2xl font-bold">{document.titre}</h1>
                          <p className="text-purple-100 text-sm">{document.type}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="text-white hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
                    >
                      ✏️
                    </button>
                  </div>
                </div>

                {/* Section Aperçu/Ouverture */}
                <div className="p-6 bg-gray-50">
                  <div className="bg-white rounded-lg p-12 text-center">
                    <div className="text-6xl mb-4">{getIconeType(document.type)}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{document.titre}</h3>
                    <p className="text-gray-600 mb-2">{document.type}</p>
                    <p className="text-gray-500 mb-6">{formatTaille(document.tailleFichier)}</p>
                    
                    <div className="flex flex-col gap-3 max-w-md mx-auto">
                      <button
                        onClick={handleOpenFile}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                      >
                        👁️ Ouvrir le fichier
                      </button>
                      <p className="text-sm text-gray-500">
                        {isPDF(document.type) && "S'ouvrira dans le navigateur"}
                        {isImage(document.type) && "S'ouvrira dans le navigateur"}
                        {!isPDF(document.type) && !isImage(document.type) && "S'ouvrira avec l'application associée"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex gap-3">
                    <button
                      onClick={handleOpenFile}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-center"
                    >
                      👁️ Ouvrir
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-center"
                    >
                      📥 Télécharger
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">ℹ️</span>
                  Informations
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type</p>
                    <p className="font-medium text-gray-900">{document.type}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Taille</p>
                    <p className="font-medium text-gray-900">{formatTaille(document.tailleFichier)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ajouté par</p>
                    <p className="font-medium text-gray-900">
                      {document.ajoutePar === 'patient' ? '👤 Vous' : 
                       document.ajoutePar === 'medecin' ? '👨‍⚕️ Médecin' : 
                       '🏥 Administration'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date d'ajout</p>
                    <p className="font-medium text-gray-900">{formatDate(document.dateCreation)}</p>
                  </div>
                  
                  {document.dateMiseAJour !== document.dateCreation && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Dernière modification</p>
                      <p className="font-medium text-gray-900">{formatDate(document.dateMiseAJour)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🔗</span>
                  Partage
                </h2>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Partagé avec médecin</p>
                    <p className="text-sm text-gray-500">Visible par votre médecin</p>
                  </div>
                  <button
                    onClick={togglePartage}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      document.partageAvecMedecin ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        document.partageAvecMedecin ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">📝</span>
                  Notes
                </h2>
                
                {document.notes ? (
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{document.notes}</p>
                ) : (
                  <p className="text-gray-400 italic text-sm">Aucune note</p>
                )}
              </div>

              {document.ajoutePar === 'patient' && (
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">⚙️</span>
                    Actions
                  </h2>
                  
                  <button
                    onClick={supprimerDocument}
                    className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                  >
                    🗑️ Supprimer le document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal d'édition */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Modifier le document</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={editTitre}
                  onChange={(e) => setEditTitre(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  rows={5}
                  placeholder="Ajoutez des notes personnelles..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
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