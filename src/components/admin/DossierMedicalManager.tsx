"use client";

import { useState } from "react";

type DossierMedical = {
  id: string;
  patientId: string;
  groupeSanguin: string | null;
  allergies: string | null;
  maladiesChroniques: string | null;
  medicamentsActuels: string | null;
  antecedentsChirurgicaux: string | null;
  antecedentsFamiliaux: string | null;
  raisonVisite: string | null;
  traitementNecessaire: string | null;
  notes: string | null;
  dateCreation: string;
  dateMiseAJour: string;
};

type DossierMedicalManagerProps = {
  patientId: string;
  dossier: DossierMedical | null;
  canEdit?: boolean; // admin, coordinateur, médecin
  canDelete?: boolean; // admin uniquement
  onUpdate?: () => void;
};

export default function DossierMedicalManager({
  patientId,
  dossier: initialDossier,
  canEdit = true,
  canDelete = false,
  onUpdate,
}: DossierMedicalManagerProps) {
  const [dossier, setDossier] = useState<DossierMedical | null>(initialDossier);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    groupeSanguin: dossier?.groupeSanguin || "",
    allergies: dossier?.allergies || "",
    maladiesChroniques: dossier?.maladiesChroniques || "",
    medicamentsActuels: dossier?.medicamentsActuels || "",
    antecedentsChirurgicaux: dossier?.antecedentsChirurgicaux || "",
    antecedentsFamiliaux: dossier?.antecedentsFamiliaux || "",
    raisonVisite: dossier?.raisonVisite || "",
    traitementNecessaire: dossier?.traitementNecessaire || "",
    notes: dossier?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = `/api/admin/patients/${patientId}/dossier-medical`;
      const method = dossier ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      setDossier(data.dossier);
      setSuccess(dossier ? "✅ Dossier mis à jour" : "✅ Dossier créé avec succès");
      setEditing(false);
      setCreating(false);
      
      if (onUpdate) onUpdate();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce dossier médical ? Cette action est irréversible.")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/patients/${patientId}/dossier-medical`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      setDossier(null);
      setSuccess("Dossier médical supprimé");
      
      if (onUpdate) onUpdate();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setCreating(false);
    setError("");
    
    // Restaurer les données originales
    if (dossier) {
      setFormData({
        groupeSanguin: dossier.groupeSanguin || "",
        allergies: dossier.allergies || "",
        maladiesChroniques: dossier.maladiesChroniques || "",
        medicamentsActuels: dossier.medicamentsActuels || "",
        antecedentsChirurgicaux: dossier.antecedentsChirurgicaux || "",
        antecedentsFamiliaux: dossier.antecedentsFamiliaux || "",
        raisonVisite: dossier.raisonVisite || "",
        traitementNecessaire: dossier.traitementNecessaire || "",
        notes: dossier.notes || "",
      });
    }
  };

  const groupesSanguins = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Aucun dossier existant
  if (!dossier && !creating) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun dossier médical</h3>
        <p className="text-gray-600 mb-6">Créez le dossier médical de ce patient</p>
        
        {canEdit && (
          <button
            onClick={() => setCreating(true)}
            className="px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] font-medium"
          >
            + Créer le dossier médical
          </button>
        )}
      </div>
    );
  }

  // Mode création ou édition
  if (creating || editing) {
    return (
      <div>
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations médicales générales */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations médicales générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Groupe sanguin</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.groupeSanguin}
                  onChange={(e) => setFormData({...formData, groupeSanguin: e.target.value})}
                >
                  <option value="">Sélectionner...</option>
                  {groupesSanguins.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Allergies</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.allergies}
                  onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  placeholder="Ex: Pénicilline, Pollen..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Maladies chroniques</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.maladiesChroniques}
                  onChange={(e) => setFormData({...formData, maladiesChroniques: e.target.value})}
                  placeholder="Ex: Diabète, Hypertension..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Médicaments actuels</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.medicamentsActuels}
                  onChange={(e) => setFormData({...formData, medicamentsActuels: e.target.value})}
                  placeholder="Liste des médicaments pris régulièrement..."
                />
              </div>
            </div>
          </div>

          {/* Antécédents */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Antécédents</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Antécédents chirurgicaux</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.antecedentsChirurgicaux}
                  onChange={(e) => setFormData({...formData, antecedentsChirurgicaux: e.target.value})}
                  placeholder="Opérations passées, dates, complications..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Antécédents familiaux</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.antecedentsFamiliaux}
                  onChange={(e) => setFormData({...formData, antecedentsFamiliaux: e.target.value})}
                  placeholder="Maladies héréditaires, conditions familiales..."
                />
              </div>
            </div>
          </div>

          {/* Raison de la visite */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visite actuelle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Raison de la visite</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.raisonVisite}
                  onChange={(e) => setFormData({...formData, raisonVisite: e.target.value})}
                  placeholder="Motif de consultation, symptômes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Traitement nécessaire</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
                  value={formData.traitementNecessaire}
                  onChange={(e) => setFormData({...formData, traitementNecessaire: e.target.value})}
                  placeholder="Traitement prévu ou recommandé..."
                />
              </div>
            </div>
          </div>

          {/* Notes médicales */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes médicales</h3>
            <textarea
              rows={5}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Notes complémentaires, observations..."
            />
          </div>

          {/* Boutons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] font-medium disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                creating ? "Créer le dossier" : "Enregistrer les modifications"
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

   if (!dossier) {  // ✅ AJOUTER
    return null;   // ✅ AJOUTER
  }    

  // Mode affichage
  return (
    <div>
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {dossier && (
            <div className="text-sm text-gray-500">
              Dernière mise à jour : {new Date(dossier.dateMiseAJour).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
            >
              ✏️ Modifier
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50"
            >
              {deleting ? "Suppression..." : "🗑️ Supprimer"}
            </button>
          )}
        </div>
      </div>

      {/* Affichage du dossier */}
      <div className="space-y-6">
        {/* Informations médicales générales */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations médicales générales</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dossier.groupeSanguin && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Groupe sanguin</dt>
                <dd className="text-lg font-semibold text-red-600">{dossier.groupeSanguin}</dd>
              </div>
            )}
            {dossier.allergies && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Allergies</dt>
                <dd className="text-sm text-gray-900">{dossier.allergies}</dd>
              </div>
            )}
            {dossier.maladiesChroniques && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500 mb-1">Maladies chroniques</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{dossier.maladiesChroniques}</dd>
              </div>
            )}
            {dossier.medicamentsActuels && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500 mb-1">Médicaments actuels</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{dossier.medicamentsActuels}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Antécédents */}
        {(dossier.antecedentsChirurgicaux || dossier.antecedentsFamiliaux) && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Antécédents</h3>
            <dl className="space-y-4">
              {dossier.antecedentsChirurgicaux && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Antécédents chirurgicaux</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">{dossier.antecedentsChirurgicaux}</dd>
                </div>
              )}
              {dossier.antecedentsFamiliaux && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Antécédents familiaux</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">{dossier.antecedentsFamiliaux}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Visite actuelle */}
        {(dossier.raisonVisite || dossier.traitementNecessaire) && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visite actuelle</h3>
            <dl className="space-y-4">
              {dossier.raisonVisite && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Raison de la visite</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">{dossier.raisonVisite}</dd>
                </div>
              )}
              {dossier.traitementNecessaire && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Traitement nécessaire</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">{dossier.traitementNecessaire}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Notes médicales */}
        {dossier.notes && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes médicales</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{dossier.notes}</p>
          </div>
        )}

        {/* Message si dossier vide */}
        {!dossier.groupeSanguin && !dossier.allergies && !dossier.maladiesChroniques && 
         !dossier.medicamentsActuels && !dossier.antecedentsChirurgicaux && 
         !dossier.antecedentsFamiliaux && !dossier.raisonVisite && 
         !dossier.traitementNecessaire && !dossier.notes && (
          <div className="text-center py-8 text-gray-500">
            <p>Aucune information médicale enregistrée</p>
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="mt-4 text-[#4DB8A8] hover:text-[#3DA391]"
              >
                ✏️ Compléter le dossier
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}