"use client";

import { useState, useEffect } from "react";

type Document = {
  id: string;
  type: string;
  titre: string;
  description: string | null;
  urlFichier: string;
  nomFichier: string;
  tailleFichier: number;
  typeMime: string;
  dateTeleversement: string;
  partageAvecMedecin?: boolean;
  medecinPartageId?: string | null;
};

type Medecin = {
  id: string;
  prenom: string;
  nom: string;
  specialite: string;
};

type DocumentsManagerProps = {
  patientId: string;
  canEdit?: boolean;
};

export default function DocumentsManager({ patientId, canEdit = true }: DocumentsManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [selectedMedecinId, setSelectedMedecinId] = useState<string>("");
  const [filterType, setFilterType] = useState("TOUS");

  const [uploadForm, setUploadForm] = useState({
    type: "AUTRE",
    titre: "",
    description: "",
    file: null as File | null,
  });

  useEffect(() => {
    loadDocuments();
    loadMedecins();
  }, [patientId, filterType]);

  const loadDocuments = async () => {
    try {
      const url = `/api/admin/documents?patientId=${patientId}${filterType !== 'TOUS' ? `&type=${filterType}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        setDocuments(await response.json());
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMedecins = async () => {
    try {
      const response = await fetch('/api/admin/medecins');
      if (response.ok) {
        setMedecins(await response.json());
      }
    } catch (error) {
      console.error("Erreur chargement médecins:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier ne doit pas dépasser 10 MB");
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('patientId', patientId);
      formData.append('type', uploadForm.type);

      const uploadResponse = await fetch('/api/admin/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Erreur lors de l'upload");
      }

      const uploadData = await uploadResponse.json();

      const docResponse = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          type: uploadForm.type,
          titre: uploadForm.titre,
          description: uploadForm.description,
          urlFichier: uploadData.urlFichier,
          nomFichier: uploadData.nomFichier,
          tailleFichier: uploadData.tailleFichier,
          typeMime: uploadData.typeMime,
        }),
      });

      if (!docResponse.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      setShowUploadModal(false);
      setUploadForm({
        type: "AUTRE",
        titre: "",
        description: "",
        file: null,
      });
      loadDocuments();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;

    try {
      const response = await fetch(`/api/admin/documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadDocuments();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Nouvelle fonction pour ouvrir le modal de partage
  const openShareModal = (docId: string, currentMedecinId?: string | null) => {
    setSelectedDocId(docId);
    setSelectedMedecinId(currentMedecinId || "");
    setShowShareModal(true);
  };

  // Nouvelle fonction pour partager/retirer le partage
  const handleShare = async () => {
    try {
      const shareData: any = {
        partageAvecMedecin: selectedMedecinId !== "",
        medecinPartageId: selectedMedecinId || null,
      };

      const response = await fetch(`/api/admin/documents/${selectedDocId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData),
      });

      if (response.ok) {
        setShowShareModal(false);
        loadDocuments();
        alert(selectedMedecinId ? "Document partagé avec succès" : "Partage retiré");
      }
    } catch (error) {
      console.error("Erreur partage:", error);
      alert("Erreur lors du partage");
    }
  };

  const handleView = (id: string) => {
    window.open(`/api/admin/documents/${id}/file`, '_blank');
  };

  const handleDownload = (id: string, nomFichier: string) => {
    const link = document.createElement('a');
    link.href = `/api/admin/documents/${id}/file?download=true`;
    link.download = nomFichier;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      PASSEPORT: "🛂",
      CARTE_IDENTITE: "🪪",
      EXAMEN_MEDICAL: "🩺",
      ORDONNANCE: "💊",
      FACTURE: "🧾",
      RECU: "📄",
      AUTRE: "📎",
    };
    return icons[type] || "📎";
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      PASSEPORT: "bg-blue-100 text-blue-800",
      CARTE_IDENTITE: "bg-green-100 text-green-800",
      EXAMEN_MEDICAL: "bg-purple-100 text-purple-800",
      ORDONNANCE: "bg-pink-100 text-pink-800",
      FACTURE: "bg-yellow-100 text-yellow-800",
      RECU: "bg-orange-100 text-orange-800",
      AUTRE: "bg-gray-100 text-gray-800",
    };
    return styles[type] || "bg-gray-100 text-gray-800";
  };

  const getMedecinName = (medecinId: string | null | undefined) => {
    if (!medecinId) return null;
    const medecin = medecins.find(m => m.id === medecinId);
    return medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête avec filtres */}
      <div className="flex items-center justify-between mb-6">
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="TOUS">Tous les documents</option>
          <option value="PASSEPORT">Passeport</option>
          <option value="CARTE_IDENTITE">Carte d'identité</option>
          <option value="EXAMEN_MEDICAL">Examen médical</option>
          <option value="ORDONNANCE">Ordonnance</option>
          <option value="FACTURE">Facture</option>
          <option value="RECU">Reçu</option>
          <option value="AUTRE">Autre</option>
        </select>

        {canEdit && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-[#4DB8A8] text-white px-4 py-2 rounded-lg hover:bg-[#3DA391]"
          >
            + Ajouter un document
          </button>
        )}
      </div>

      {/* Liste des documents */}
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTypeIcon(doc.type)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{doc.titre}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeBadge(doc.type)}`}>
                      {doc.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {doc.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
              )}

              {/* Badge de partage */}
              {doc.partageAvecMedecin && doc.medecinPartageId && (
                <div className="mb-3 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
                  <span className="text-blue-700">
                    🩺 Partagé avec {getMedecinName(doc.medecinPartageId)}
                  </span>
                </div>
              )}

              <div className="space-y-1 mb-3 text-xs text-gray-500">
                <p>📄 {doc.nomFichier}</p>
                <p>💾 {formatFileSize(doc.tailleFichier)}</p>
                <p>📅 {new Date(doc.dateTeleversement).toLocaleDateString('fr-FR')}</p>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(doc.id)}
                    className="flex-1 bg-blue-50 text-blue-600 text-center py-2 rounded text-sm hover:bg-blue-100"
                  >
                    👁️ Voir
                  </button>
                  <button
                    onClick={() => handleDownload(doc.id, doc.nomFichier)}
                    className="flex-1 bg-green-50 text-green-600 text-center py-2 rounded text-sm hover:bg-green-100"
                  >
                    ⬇️ Télécharger
                  </button>
                </div>
                
                {canEdit && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openShareModal(doc.id, doc.medecinPartageId)}
                      className="flex-1 bg-purple-50 text-purple-600 text-center py-2 rounded text-sm hover:bg-purple-100"
                    >
                      🤝 Partager
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-5xl mb-3">📁</div>
          <p className="text-gray-600">Aucun document</p>
          {canEdit && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 text-[#4DB8A8] hover:text-[#3DA391]"
            >
              + Ajouter le premier document
            </button>
          )}
        </div>
      )}

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Ajouter un document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type de document *</label>
                <select
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({...uploadForm, type: e.target.value})}
                >
                  <option value="PASSEPORT">Passeport</option>
                  <option value="CARTE_IDENTITE">Carte d'identité</option>
                  <option value="EXAMEN_MEDICAL">Examen médical</option>
                  <option value="ORDONNANCE">Ordonnance</option>
                  <option value="FACTURE">Facture</option>
                  <option value="RECU">Reçu</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                  value={uploadForm.titre}
                  onChange={(e) => setUploadForm({...uploadForm, titre: e.target.value})}
                  placeholder="Ex: Passeport - Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  placeholder="Détails optionnels..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fichier * (max 10 MB)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                />
                {uploadForm.file && (
                  <p className="text-xs text-gray-600 mt-1">
                    {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={uploading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] disabled:opacity-50"
                >
                  {uploading ? "Upload en cours..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de partage */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Partager le document</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Sélectionner un médecin</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8]"
                value={selectedMedecinId}
                onChange={(e) => setSelectedMedecinId(e.target.value)}
              >
                <option value="">Ne pas partager</option>
                {medecins.filter(m => m.estActif !== false).map(medecin => (
                  <option key={medecin.id} value={medecin.id}>
                    Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Le médecin pourra consulter ce document dans son espace
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleShare}
                className="flex-1 px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}