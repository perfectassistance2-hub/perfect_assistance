'use client';

import { useState } from 'react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadDocumentModal({ isOpen, onClose, onSuccess }: UploadDocumentModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    type: 'AUTRE',
    titre: '',
    description: '',
    file: null as File | null,
  });

  const documentTypes = [
    { value: 'PASSEPORT', label: 'Passeport', icon: '🛂' },
    { value: 'CARTE_IDENTITE', label: 'Carte d\'identité', icon: '🪪' },
    { value: 'EXAMEN_MEDICAL', label: 'Examen médical', icon: '🩺' },
    { value: 'ORDONNANCE', label: 'Ordonnance', icon: '💊' },
    { value: 'FACTURE', label: 'Facture', icon: '🧾' },
    { value: 'RECU', label: 'Reçu', icon: '📄' },
    { value: 'AUTRE', label: 'Autre', icon: '📎' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 10 MB');
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('type', uploadForm.type);
      formData.append('titre', uploadForm.titre);
      formData.append('description', uploadForm.description);

      const response = await fetch('/api/patient/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Document ajouté avec succès !');
        setUploadForm({
          type: 'AUTRE',
          titre: '',
          description: '',
          file: null,
        });
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('❌ ' + (error.message || 'Erreur lors de l\'upload'));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const resetForm = () => {
    setUploadForm({
      type: 'AUTRE',
      titre: '',
      description: '',
      file: null,
    });
    // Réinitialiser l'input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="mr-2">📤</span>
            Ajouter un document
          </h3>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type de document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de document *
            </label>
            <select
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
              value={uploadForm.type}
              onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Sélectionnez le type de document que vous souhaitez ajouter
            </p>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du document *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              value={uploadForm.titre}
              onChange={(e) => setUploadForm({ ...uploadForm, titre: e.target.value })}
              placeholder="Ex: Passeport - Jean Dupont"
            />
            <p className="text-xs text-gray-500 mt-1">
              Donnez un titre clair pour identifier facilement ce document
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Ajoutez des détails sur ce document..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Informations complémentaires (numéro, date d'expiration, etc.)
            </p>
          </div>

          {/* Fichier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier * (max 10 MB)
            </label>
            <div className="mt-1">
              <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                  <span className="text-4xl mb-2">📁</span>
                  <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, JPG, PNG, DOC, DOCX (max 10 MB)
                  </p>
                </div>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {uploadForm.file && (
              <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-3">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadForm.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadForm.file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadForm({ ...uploadForm, file: null });
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="ml-3 text-red-600 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-xl mr-3 flex-shrink-0">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">À savoir :</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Vos documents seront automatiquement visibles par l'administration</li>
                  <li>Vous pourrez partager vos documents avec votre médecin depuis la page de détail</li>
                  <li>Seuls les documents que vous ajoutez peuvent être supprimés par vous</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading || !uploadForm.file}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Upload en cours...
                </span>
              ) : (
                '📤 Ajouter le document'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}