"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DocumentsManager from "@/components/admin/DocumentsManager";
import DossierMedicalManager from "@/components/admin/DossierMedicalManager";


type Patient = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  sexe: string;
  telephone: string;
  whatsapp: string | null;
  pays: string;
  ville: string | null;
  adresse: string | null;
  codePostal: string | null;
  numeroPasseport: string | null;
  dateExpirationPasseport: string | null;
  nationalite: string;
  medecinreferentid: string | null;
  medecinReferent?: {              // ✅ AJOUTER
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    specialite: string | null;
    etablissement: string | null;
    ville: string | null;
    pays: string;
  } | null;
  statut: string;
  langue: string;
  dateCreation: string;
};

type DossierMedical = {
  id: string;
  patientId: string;  // ✅ AJOUTER
  groupeSanguin: string | null;
  allergies: string | null;
  antecedentsChirurgicaux: string | null;  // ✅ AJOUTER
  antecedentsFamiliaux: string | null;     // ✅ AJOUTER
  maladiesChroniques: string | null;
  medicamentsActuels: string | null;
  raisonVisite: string | null;
  traitementNecessaire: string | null;
  notes: string | null;
  dateCreation: string;      // ✅ AJOUTER
  dateMiseAJour: string;     // ✅ AJOUTER
};

type RendezVous = {
  id: string;
  type: string;
  statut: string;
  datePrevue: string;
  raison: string | null;
  medecin: { prenom: string; nom: string } | null;
  clinique: { nom: string } | null;
};

type Sejour = {
  id: string;
  statut: string;
  dateArrivee: string;
  dateDepart: string;
  typeTraitement: string;
  clinique: { nom: string };
  medecin: { prenom: string; nom: string } | null;
};

type Devis = {
  id: string;
  numeroDevis: string;
  total: number;
  devise: string;
  statutPaiement: string;
  dateCreation: string;
};

type Message = {
  id: string;
  sujet: string | null;
  contenu: string;
  estLu: boolean;
  dateCreation: string;
  expediteur: { prenom: string; nom: string } | null;
};

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [dossierMedical, setDossierMedical] = useState<DossierMedical | null>(null);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      const response = await fetch(`/api/admin/patients/${patientId}`);
      if (!response.ok) throw new Error("Patient non trouvé");
      
      const data = await response.json();
      setPatient(data.patient);
      setDossierMedical(data.dossierMedical);
      setRendezVous(data.rendezVous || []);
      setSejours(data.sejours || []);
      setDevis(data.devis || []);
      setMessages(data.messages || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Patient non trouvé</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href="/admin/patients"
          className="inline-block bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391]"
        >
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: "📊" },
    { id: "medical", label: "Dossier médical", icon: "🏥" },
    { id: "documents", label: "Documents", icon: "📁" },
    { id: "rendez-vous", label: `RDV (${rendezVous.length})`, icon: "📅" },
    { id: "sejours", label: `Séjours (${sejours.length})`, icon: "✈️" },
    { id: "devis", label: `Devis (${devis.length})`, icon: "💰" },
    { id: "messages", label: `Messages (${messages.length})`, icon: "💬" },
  ];

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/patients"
          className="text-[#4DB8A8] hover:text-[#3DA391] mb-4 inline-block"
        >
          ← Retour à la liste
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-[#4DB8A8] text-white flex items-center justify-center font-bold text-2xl">
              {patient.prenom[0]}
              {patient.nom[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {patient.prenom} {patient.nom}
              </h1>
              <p className="text-gray-600">{patient.email}</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Link
              href={`/admin/patients/${patient.id}/modifier`}
              className="px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors"
            >
              ✏️ Modifier
            </Link>
            <Link
              href={`/admin/rendez-vous/nouveau?patientId=${patient.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📅 Nouveau RDV
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? "border-[#4DB8A8] text-[#4DB8A8]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Vue d'ensemble */}
        {activeTab === "overview" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations personnelles
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(patient.dateNaissance).toLocaleDateString("fr-FR")}
                      {" "}({new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear()} ans)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Sexe</dt>
                    <dd className="text-sm text-gray-900">{patient.sexe}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                    <dd className="text-sm text-gray-900">{patient.telephone}</dd>
                  </div>
                  {patient.whatsapp && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">WhatsApp</dt>
                      <dd className="text-sm text-gray-900">{patient.whatsapp}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nationalité</dt>
                    <dd className="text-sm text-gray-900">{patient.nationalite}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Langue</dt>
                    <dd className="text-sm text-gray-900">
                      {patient.langue === "fr" ? "Français" : patient.langue === "en" ? "Anglais" : "Arabe"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Adresse et documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Adresse et documents
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Pays</dt>
                    <dd className="text-sm text-gray-900">{patient.pays}</dd>
                  </div>
                  {patient.ville && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ville</dt>
                      <dd className="text-sm text-gray-900">{patient.ville}</dd>
                    </div>
                  )}
                  {patient.adresse && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                      <dd className="text-sm text-gray-900">{patient.adresse}</dd>
                    </div>
                  )}
                  {patient.numeroPasseport && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">N° Passeport</dt>
                      <dd className="text-sm text-gray-900">{patient.numeroPasseport}</dd>
                    </div>
                  )}
                  {patient.dateExpirationPasseport && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Expiration passeport</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(patient.dateExpirationPasseport).toLocaleDateString("fr-FR")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* ✅ AJOUTER ICI LE MÉDECIN RÉFÉRENT */}
              {patient.medecinReferent && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    👨‍⚕️ Médecin Référent
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Link
                          href={`/admin/medecins-referents/${patient.medecinReferent.id}`}
                          className="text-xl font-bold text-gray-900 hover:text-[#4DB8A8] transition-colors"
                        >
                          Dr. {patient.medecinReferent.prenom} {patient.medecinReferent.nom}
                        </Link>
                        {patient.medecinReferent.specialite && (
                          <p className="text-sm text-gray-600 mt-1">
                            {patient.medecinReferent.specialite}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/admin/medecins-referents/${patient.medecinReferent.id}`}
                        className="text-blue-600 hover:text-blue-800 text-xl"
                      >
                        →
                      </Link>
                    </div>

                    <div className="space-y-2 border-t border-blue-200 pt-3">
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="mr-2">📧</span>
                        <a 
                          href={`mailto:${patient.medecinReferent.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {patient.medecinReferent.email}
                        </a>
                      </div>

                      <div className="flex items-center text-sm text-gray-700">
                        <span className="mr-2">📞</span>
                        <a href={`tel:${patient.medecinReferent.telephone}`}>
                          {patient.medecinReferent.telephone}
                        </a>
                      </div>

                      {patient.medecinReferent.etablissement && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="mr-2">🏥</span>
                          <span>{patient.medecinReferent.etablissement}</span>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-700">
                        <span className="mr-2">🌍</span>
                        <span>
                          {patient.medecinReferent.pays}
                          {patient.medecinReferent.ville && ` - ${patient.medecinReferent.ville}`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-600 italic">
                        Ce patient a été recommandé par ce médecin référent
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{rendezVous.length}</div>
                <div className="text-sm text-gray-600 mt-1">Rendez-vous</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{sejours.length}</div>
                <div className="text-sm text-gray-600 mt-1">Séjours</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{devis.length}</div>
                <div className="text-sm text-gray-600 mt-1">Devis</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{messages.length}</div>
                <div className="text-sm text-gray-600 mt-1">Messages</div>
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        {activeTab === "documents" && (
          <div className="p-6">
            <DocumentsManager patientId={patient.id} canEdit={true} />
          </div>
        )}

        {activeTab === "medical" && (
          <div className="p-6">
            <DossierMedicalManager
              patientId={patient.id}
              dossier={dossierMedical}
              canEdit={true} // true pour admin, coordinateur, médecin
              canDelete={true} // true uniquement pour admin
              onUpdate={loadPatientData}
            />
          </div>
        )}

        {/* Rendez-vous */}
        {activeTab === "rendez-vous" && (
          <div className="p-6">
            {rendezVous.length > 0 ? (
              <div className="space-y-4">
                {rendezVous.map((rdv) => (
                  <div key={rdv.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#4DB8A8] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            rdv.statut === "CONFIRME" ? "bg-green-100 text-green-800" :
                            rdv.statut === "PLANIFIE" ? "bg-blue-100 text-blue-800" :
                            rdv.statut === "TERMINE" ? "bg-gray-100 text-gray-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {rdv.statut}
                          </span>
                          <span className="text-xs text-gray-500">{rdv.type}</span>
                        </div>
                        <p className="font-medium text-gray-900">
                          📅 {new Date(rdv.datePrevue).toLocaleString("fr-FR")}
                        </p>
                        {rdv.medecin && (
                          <p className="text-sm text-gray-600">
                            👨‍⚕️ Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
                          </p>
                        )}
                        {rdv.clinique && (
                          <p className="text-sm text-gray-600">🏥 {rdv.clinique.nom}</p>
                        )}
                        {rdv.raison && (
                          <p className="text-sm text-gray-500 mt-2">{rdv.raison}</p>
                        )}
                      </div>
                      <Link
                        href={`/admin/rendez-vous/${rdv.id}`}
                        className="text-[#4DB8A8] hover:text-[#3DA391] text-sm font-medium"
                      >
                        Voir →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun rendez-vous</h3>
                <p className="text-gray-600 mb-6">Planifiez le premier rendez-vous</p>
                <Link
                  href={`/admin/rendez-vous/nouveau?patientId=${patient.id}`}
                  className="inline-block px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
                >
                  + Nouveau rendez-vous
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Séjours */}
        {activeTab === "sejours" && (
          <div className="p-6">
            {sejours.length > 0 ? (
              <div className="space-y-4">
                {sejours.map((sejour) => (
                  <div key={sejour.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#4DB8A8] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            sejour.statut === "EN_COURS" ? "bg-blue-100 text-blue-800" :
                            sejour.statut === "PLANIFIE" ? "bg-yellow-100 text-yellow-800" :
                            sejour.statut === "TERMINE" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {sejour.statut}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{sejour.typeTraitement}</h4>
                        <p className="text-sm text-gray-600">
                          ✈️ {new Date(sejour.dateArrivee).toLocaleDateString("fr-FR")} → {new Date(sejour.dateDepart).toLocaleDateString("fr-FR")}
                        </p>
                        <p className="text-sm text-gray-600">🏥 {sejour.clinique.nom}</p>
                        {sejour.medecin && (
                          <p className="text-sm text-gray-600">
                            👨‍⚕️ Dr. {sejour.medecin.prenom} {sejour.medecin.nom}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/admin/sejours/${sejour.id}`}
                        className="text-[#4DB8A8] hover:text-[#3DA391] text-sm font-medium"
                      >
                        Voir →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✈️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun séjour</h3>
                <p className="text-gray-600 mb-6">Organisez le premier séjour médical</p>
                <Link
                  href={`/admin/sejours/nouveau?patientId=${patient.id}`}
                  className="inline-block px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
                >
                  + Nouveau séjour
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Devis */}
        {activeTab === "devis" && (
          <div className="p-6">
            {devis.length > 0 ? (
              <div className="space-y-4">
                {devis.map((d) => (
                  <div key={d.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#4DB8A8] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            d.statutPaiement === "PAYE" ? "bg-green-100 text-green-800" :
                            d.statutPaiement === "PARTIEL" ? "bg-yellow-100 text-yellow-800" :
                            d.statutPaiement === "REMBOURSE" ? "bg-gray-100 text-gray-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {d.statutPaiement}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">Devis #{d.numeroDevis}</h4>
                        <p className="text-2xl font-bold text-[#4DB8A8] mb-2">
                          {d.total.toLocaleString("fr-FR")} {d.devise}
                        </p>
                        <p className="text-sm text-gray-500">
                          Créé le {new Date(d.dateCreation).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Link
                        href={`/admin/devis/${d.id}`}
                        className="text-[#4DB8A8] hover:text-[#3DA391] text-sm font-medium"
                      >
                        Voir →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun devis</h3>
                <p className="text-gray-600 mb-6">Créez le premier devis pour ce patient</p>
                <Link
                  href={`/admin/devis/nouveau?patientId=${patient.id}`}
                  className="inline-block px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
                >
                  + Nouveau devis
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {activeTab === "messages" && (
          <div className="p-6">
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`border rounded-lg p-4 ${
                    msg.estLu ? "border-gray-200" : "border-[#4DB8A8] bg-blue-50"
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {!msg.estLu && (
                          <span className="w-2 h-2 bg-[#4DB8A8] rounded-full"></span>
                        )}
                        {msg.expediteur && (
                          <span className="text-sm font-medium text-gray-900">
                            De: {msg.expediteur.prenom} {msg.expediteur.nom}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.dateCreation).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    {msg.sujet && (
                      <h4 className="font-semibold text-gray-900 mb-2">{msg.sujet}</h4>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.contenu}</p>
                  </div>
                ))}
                <div className="pt-4">
                  <Link
                    href={`/admin/messages/nouveau?patientId=${patient.id}`}
                    className="inline-block px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
                  >
                    ✉️ Envoyer un message
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun message</h3>
                <p className="text-gray-600 mb-6">Commencez une conversation</p>
                <Link
                  href={`/admin/messages/nouveau?patientId=${patient.id}`}
                  className="inline-block px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391]"
                >
                  ✉️ Envoyer un message
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}