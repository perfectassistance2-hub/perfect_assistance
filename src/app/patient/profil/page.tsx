'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/patient/PatientSidebar';

interface Patient {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  whatsapp?: string;
  dateNaissance: string;
  sexe: string;
  nationalite: string;
  pays: string;
  ville?: string;
  adresse?: string;
  codePostal?: string;
  numeroPasseport?: string;
  dateExpirationPasseport?: string;
  langue: string;
  statut: string;
  dateCreation: string;
}

interface DossierMedical {
  groupeSanguin?: string;
  allergies?: string;
  maladiesChroniques?: string;
  medicamentsActuels?: string;
  antecedentsChirurgicaux?: string;
  antecedentsFamiliaux?: string;
}

export default function ProfilPatient() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dossierMedical, setDossierMedical] = useState<DossierMedical | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulaire d'édition
  const [formData, setFormData] = useState({
    telephone: '',
    whatsapp: '',
    ville: '',
    adresse: '',
    codePostal: '',
    langue: 'fr'
  });

  useEffect(() => {
    fetchProfil();
  }, []);

  const fetchProfil = async () => {
    try {
      const response = await fetch('/api/patient/profil');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement du profil');
      }

      const result = await response.json();
      
      if (result.success) {
        setPatient(result.patient);
        setDossierMedical(result.dossierMedical);
        
        // Initialiser le formulaire
        setFormData({
          telephone: result.patient.telephone || '',
          whatsapp: result.patient.whatsapp || '',
          ville: result.patient.ville || '',
          adresse: result.patient.adresse || '',
          codePostal: result.patient.codePostal || '',
          langue: result.patient.langue || 'fr'
        });
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/patient/profil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

      if (result.success) {
        setPatient(result.patient);
        setSuccess('Profil mis à jour avec succès !');
        setEditing(false);
        
        // Effacer le message après 3 secondes
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Réinitialiser le formulaire
    if (patient) {
      setFormData({
        telephone: patient.telephone || '',
        whatsapp: patient.whatsapp || '',
        ville: patient.ville || '',
        adresse: patient.adresse || '',
        codePostal: patient.codePostal || '',
        langue: patient.langue || 'fr'
      });
    }
    setEditing(false);
    setError('');
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

  if (!patient) {
    return (
      <div className="flex h-screen">
        <PatientSidebar patient={{ id: '', prenom: '', nom: '', email: '' }} />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
            <p className="text-red-600 font-medium">❌ {error || 'Erreur de chargement'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20">
      <PatientSidebar patient={patient} />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
              <p className="text-gray-600">Gérez vos informations personnelles</p>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg flex items-center"
              >
                <span className="mr-2">✏️</span>
                Modifier mon profil
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💾</span>
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-xl p-4">
              <p className="text-green-800 font-medium">✅ {success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-xl p-4">
              <p className="text-red-800 font-medium">❌ {error}</p>
            </div>
          )}

          {/* Informations personnelles */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center">
                <span className="mr-2">👤</span>
                Informations Personnelles
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Champs non modifiables */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={patient.prenom}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    value={patient.nom}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={patient.email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                  <input
                    type="text"
                    value={new Date(patient.dateNaissance).toLocaleDateString('fr-FR')}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sexe</label>
                  <input
                    type="text"
                    value={patient.sexe === 'M' ? 'Masculin' : 'Féminin'}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité</label>
                  <input
                    type="text"
                    value={patient.nationalite}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>

                {/* Champs modifiables */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all ${
                      editing
                        ? 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                        : 'bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all ${
                      editing
                        ? 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                        : 'bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                  <input
                    type="text"
                    value={patient.pays}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all ${
                      editing
                        ? 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                        : 'bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all ${
                      editing
                        ? 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                        : 'bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                  <input
                    type="text"
                    value={formData.codePostal}
                    onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all ${
                      editing
                        ? 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                        : 'bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Langue préférée</label>
                  <select
                    value={formData.langue}
                    onChange={(e) => setFormData({ ...formData, langue: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all ${
                      editing
                        ? 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                        : 'bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed'
                    }`}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Informations de passeport */}
          {patient.numeroPasseport && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <span className="mr-2">🛂</span>
                  Informations de Passeport
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de passeport</label>
                    <input
                      type="text"
                      value={patient.numeroPasseport}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  {patient.dateExpirationPasseport && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date d'expiration</label>
                      <input
                        type="text"
                        value={new Date(patient.dateExpirationPasseport).toLocaleDateString('fr-FR')}
                        disabled
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dossier médical (lecture seule) */}
          {dossierMedical && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <span className="mr-2">🏥</span>
                  Informations Médicales
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4 italic">
                  Ces informations sont gérées par votre médecin. Contactez l'administration pour toute modification.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dossierMedical.groupeSanguin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Groupe sanguin</label>
                      <input
                        type="text"
                        value={dossierMedical.groupeSanguin}
                        disabled
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700"
                      />
                    </div>
                  )}
                  {dossierMedical.allergies && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                      <textarea
                        value={dossierMedical.allergies}
                        disabled
                        rows={2}
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700"
                      />
                    </div>
                  )}
                  {dossierMedical.maladiesChroniques && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maladies chroniques</label>
                      <textarea
                        value={dossierMedical.maladiesChroniques}
                        disabled
                        rows={2}
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700"
                      />
                    </div>
                  )}
                  {dossierMedical.medicamentsActuels && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Médicaments actuels</label>
                      <textarea
                        value={dossierMedical.medicamentsActuels}
                        disabled
                        rows={2}
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}