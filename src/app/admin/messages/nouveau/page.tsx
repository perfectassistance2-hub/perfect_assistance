"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type UserType = "patient" | "medecin" | "utilisateur";

type Contact = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  type: UserType;
  specialite?: string;
  telephone?: string;
  role?: string;
};

export default function NouveauMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get("userId");
  const preselectedUserType = searchParams.get("userType") as UserType | null;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterType, setFilterType] = useState<"TOUS" | UserType>(
    preselectedUserType || "TOUS"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    type: UserType;
  } | null>(null);

  const [formData, setFormData] = useState({
    destinataireId: preselectedUserId || "",
    destinataireType: preselectedUserType || ("patient" as UserType),
    sujet: "",
    contenu: "",
  });

  useEffect(() => {
    // Récupérer l'utilisateur connecté (admin = utilisateur)
    const user = JSON.parse(localStorage.getItem("admin_user") || "{}");
    console.log("👤 Utilisateur connecté:", user);

    if (user?.id) {
      setCurrentUser({
        id: user.id,
        type: "utilisateur",
      });
    }

    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      console.log("📋 Chargement des contacts...");

      // Charger les patients
      const patientsRes = await fetch("/api/admin/patients");
      const patients = patientsRes.ok ? await patientsRes.json() : [];
      console.log(`✅ ${patients.length} patients chargés`);

      // Charger les médecins
      const medecinsRes = await fetch("/api/admin/medecins");
      const medecins = medecinsRes.ok ? await medecinsRes.json() : [];
      console.log(`✅ ${medecins.length} médecins chargés`);

      // Combiner et formater (uniquement patients et médecins)
      const allContacts: Contact[] = [
        ...patients.map((p: any) => ({
          id: p.id,
          prenom: p.prenom,
          nom: p.nom,
          email: p.email,
          telephone: p.telephone,
          type: "patient" as UserType,
          role: "Patient",
        })),
        ...medecins.map((m: any) => ({
          id: m.id,
          prenom: m.prenom,
          nom: m.nom,
          email: m.email,
          telephone: m.telephone,
          specialite: m.specialite,
          type: "medecin" as UserType,
          role: "Médecin",
        })),
      ];

      console.log(`✅ Total: ${allContacts.length} contacts`);
      setContacts(allContacts);
    } catch (err) {
      console.error("❌ Erreur chargement contacts:", err);
      setError("Erreur lors du chargement des contacts");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.destinataireId) {
      setError("Veuillez sélectionner un destinataire");
      return;
    }

    if (!currentUser?.id) {
      setError("Utilisateur non connecté");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        expediteurId: currentUser.id,
        expediteurType: currentUser.type,
        destinataireId: formData.destinataireId,
        destinataireType: formData.destinataireType,
        sujet: formData.sujet.trim() || null,
        contenu: formData.contenu,
      };

      console.log("📤 Envoi message:", payload);

      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📥 Réponse:", data);

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setSuccess("✅ Message envoyé avec succès !");
      setTimeout(() => router.push("/admin/messages"), 1500);
    } catch (err: any) {
      console.error("❌ Erreur envoi:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    console.log("👤 Contact sélectionné:", contact);
    setFormData({
      ...formData,
      destinataireId: contact.id,
      destinataireType: contact.type,
    });
  };

  // Filtrer les contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchType = filterType === "TOUS" || contact.type === filterType;
    const matchSearch =
      contact.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchType && matchSearch;
  });

  const selectedContact = contacts.find(
    (c) => c.id === formData.destinataireId && c.type === formData.destinataireType
  );

  const getTypeIcon = (type: UserType) => {
    switch (type) {
      case "medecin":
        return "👨‍⚕️";
      case "patient":
        return "👤";
      case "utilisateur":
        return "👔";
      default:
        return "❓";
    }
  };

  const getTypeBadge = (type: UserType, role?: string) => {
    const configs = {
      medecin: { style: "bg-blue-100 text-blue-800", label: "Médecin" },
      patient: { style: "bg-purple-100 text-purple-800", label: "Patient" },
      utilisateur: { style: "bg-gray-100 text-gray-800", label: role || "Admin" },
    };

    const config = configs[type];

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.style}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/messages"
          className="text-[#4DB8A8] hover:text-[#3DA391]"
        >
          ← Retour aux messages
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Nouveau message
        </h1>
      </div>

      {/* Messages d'état */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des contacts */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Destinataires ({filteredContacts.length})
            </h2>

            {/* Filtres */}
            <div className="space-y-3 mb-4">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8] text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="TOUS">Tous ({contacts.length})</option>
                <option value="patient">
                  Patients ({contacts.filter((c) => c.type === "patient").length})
                </option>
                <option value="medecin">
                  Médecins ({contacts.filter((c) => c.type === "medecin").length})
                </option>
              </select>

              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8] text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Liste */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div
                  key={`${contact.id}-${contact.type}`}
                  onClick={() => handleContactSelect(contact)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.destinataireId === contact.id &&
                    formData.destinataireType === contact.type
                      ? "bg-[#4DB8A8] text-white border-[#4DB8A8]"
                      : "bg-white hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(contact.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {contact.prenom} {contact.nom}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          formData.destinataireId === contact.id &&
                          formData.destinataireType === contact.type
                            ? "text-white/90"
                            : "text-gray-500"
                        }`}
                      >
                        {contact.type === "medecin" && contact.specialite
                          ? contact.specialite
                          : contact.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredContacts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun contact trouvé
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire de message */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow rounded-lg p-6 space-y-4"
          >
            {/* Destinataire sélectionné */}
            {selectedContact && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Destinataire :</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#4DB8A8] text-white flex items-center justify-center">
                    {getTypeIcon(selectedContact.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedContact.prenom} {selectedContact.nom}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getTypeBadge(selectedContact.type, selectedContact.role)}
                      {selectedContact.specialite && (
                        <span className="text-xs text-gray-500">
                          {selectedContact.specialite}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedContact.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!selectedContact && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                ⚠️ Veuillez sélectionner un destinataire dans la liste
              </div>
            )}

            {/* Sujet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sujet (optionnel)
              </label>
              <input
                type="text"
                placeholder="Sujet du message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                value={formData.sujet}
                onChange={(e) =>
                  setFormData({ ...formData, sujet: e.target.value })
                }
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                required
                rows={10}
                placeholder="Écrivez votre message ici..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8] resize-none"
                value={formData.contenu}
                onChange={(e) =>
                  setFormData({ ...formData, contenu: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.contenu.length} caractères
              </p>
            </div>

            {/* Boutons */}
            <div className="flex space-x-3 pt-4">
              <Link
                href="/admin/messages"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.destinataireId}
                className="flex-1 px-6 py-3 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "Envoi en cours..." : "✉️ Envoyer le message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}