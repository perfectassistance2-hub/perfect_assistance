// ========================================
// FICHIER: /app/admin/messages/page.tsx
// AVEC SUPPRESSION - CODE ORIGINAL INTACT
// ========================================
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserType = "patient" | "medecin" | "utilisateur";

type EnrichedUser = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  type: UserType;
  specialite?: string;
};

type Message = {
  id: string;
  sujet: string | null;
  contenu: string;
  estLu: boolean;
  dateCreation: string;
  dateLecture: string | null;
  expediteurId: string | null;
  expediteurType: UserType | null;
  destinataireId: string;
  destinataireType: UserType;
  expediteur: EnrichedUser | null;
  destinataire: EnrichedUser | null;
};

type Conversation = {
  userId: string;
  userType: UserType;
  userName: string;
  userEmail: string;
  userRole: string;
  userSpecialite?: string;
  lastMessage: Message;
  unreadCount: number;
  totalMessages: number;
  messages: Message[];
};

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"TOUS" | UserType>("TOUS");
  const [filterNonLus, setFilterNonLus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const conversationsPerPage = 12;
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    type: UserType;
  } | null>(null);
  // ✅ AJOUT: État pour la suppression
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer l'utilisateur connecté (admin = utilisateur)
    const user = JSON.parse(localStorage.getItem("admin_user") || "{}");
    console.log("👤 Admin connecté:", user);
    
    if (user?.id) {
      setCurrentUser({
        id: user.id,
        type: "utilisateur", // Les admins sont dans la table utilisateurs
      });
    }
    
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      console.log("📋 Chargement des messages...");
      
      // ✅ CORRECTION: Récupérer l'admin depuis localStorage
      const admin = JSON.parse(localStorage.getItem("admin_user") || "{}");
      
      if (!admin.id) {
        console.error("❌ Admin non connecté");
        setLoading(false);
        return;
      }
      
      console.log("👤 Envoi requête avec adminId:", admin.id);
      
      // ✅ CORRECTION: Ajouter adminId en paramètre
      const response = await fetch(`/api/admin/messages?adminId=${admin.id}`);
      
      if (response.ok) {
        const messages: Message[] = await response.json();
        console.log(`✅ ${messages.length} messages chargés`);
        
        // ✅ CORRECTION: Utiliser admin.id directement
        const adminUser = {
          id: admin.id,
          type: "utilisateur" as UserType
        };
        
        const groupedConversations = groupMessagesByUserWithAdmin(messages, adminUser);
        console.log(`📊 ${groupedConversations.length} conversations`);
        setConversations(groupedConversations);
      } else {
        console.error("❌ Erreur HTTP:", response.status);
        const errorData = await response.json();
        console.error("❌ Détails:", errorData);
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupMessagesByUserWithAdmin = (messages: Message[], admin: { id: string; type: UserType }): Conversation[] => {
    const conversationMap = new Map<string, Conversation>();

    messages.forEach((message) => {
      // Déterminer l'autre utilisateur (celui avec qui on converse)
      const isExpediteeur =
        message.expediteurId === admin.id &&
        message.expediteurType === admin.type;
      
      const otherUser = isExpediteeur ? message.destinataire : message.expediteur;

      if (!otherUser) {
        console.warn("⚠️ Message sans autre utilisateur:", message.id);
        return; // Ignorer les messages système
      }

      const conversationKey = `${otherUser.id}-${otherUser.type}`;

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          userId: otherUser.id,
          userType: otherUser.type,
          userName: `${otherUser.prenom} ${otherUser.nom}`,
          userEmail: otherUser.email,
          userRole: otherUser.role,
          userSpecialite: otherUser.specialite,
          lastMessage: message,
          unreadCount: 0,
          totalMessages: 0,
          messages: [],
        });
      }

      const conversation = conversationMap.get(conversationKey)!;
      conversation.messages.push(message);
      conversation.totalMessages++;

      // Compter les messages non lus reçus
      if (
        !message.estLu &&
        message.destinataireId === admin.id &&
        message.destinataireType === admin.type
      ) {
        conversation.unreadCount++;
      }

      // Mettre à jour le dernier message si plus récent
      if (
        new Date(message.dateCreation) >
        new Date(conversation.lastMessage.dateCreation)
      ) {
        conversation.lastMessage = message;
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.dateCreation).getTime() -
        new Date(a.lastMessage.dateCreation).getTime()
    );
  };

  const groupMessagesByUser = (messages: Message[]): Conversation[] => {
    if (!currentUser) return [];

    const conversationMap = new Map<string, Conversation>();

    messages.forEach((message) => {
      // Déterminer l'autre utilisateur (celui avec qui on converse)
      const isExpediteeur =
        message.expediteurId === currentUser.id &&
        message.expediteurType === currentUser.type;
      
      const otherUser = isExpediteeur ? message.destinataire : message.expediteur;

      if (!otherUser) return; // Ignorer les messages système

      const conversationKey = `${otherUser.id}-${otherUser.type}`;

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          userId: otherUser.id,
          userType: otherUser.type,
          userName: `${otherUser.prenom} ${otherUser.nom}`,
          userEmail: otherUser.email,
          userRole: otherUser.role,
          userSpecialite: otherUser.specialite,
          lastMessage: message,
          unreadCount: 0,
          totalMessages: 0,
          messages: [],
        });
      }

      const conversation = conversationMap.get(conversationKey)!;
      conversation.messages.push(message);
      conversation.totalMessages++;

      // Compter les messages non lus reçus
      if (
        !message.estLu &&
        message.destinataireId === currentUser.id &&
        message.destinataireType === currentUser.type
      ) {
        conversation.unreadCount++;
      }

      // Mettre à jour le dernier message si plus récent
      if (
        new Date(message.dateCreation) >
        new Date(conversation.lastMessage.dateCreation)
      ) {
        conversation.lastMessage = message;
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.dateCreation).getTime() -
        new Date(a.lastMessage.dateCreation).getTime()
    );
  };

  const handleMarkConversationAsRead = async (conversation: Conversation) => {
    if (!currentUser) return;

    try {
      const unreadMessages = conversation.messages.filter(
        (m) =>
          !m.estLu &&
          m.destinataireId === currentUser.id &&
          m.destinataireType === currentUser.type
      );

      await Promise.all(
        unreadMessages.map((msg) =>
          fetch(`/api/admin/messages/${msg.id}`, { method: "PATCH" })
        )
      );

      loadMessages();
    } catch (error) {
      console.error("❌ Erreur:", error);
    }
  };

  // ✅ AJOUT: Fonction pour supprimer une conversation
  const handleDeleteConversation = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer toute la conversation avec ${conversation.userName} ?\n\n` +
      `Cette action supprimera définitivement ${conversation.totalMessages} message(s) et ne peut pas être annulée.`
    );

    if (!confirmDelete) return;

    setDeletingConversation(`${conversation.userId}-${conversation.userType}`);

    try {
      // Supprimer tous les messages de la conversation
      const deletePromises = conversation.messages.map((message) =>
        fetch(`/api/admin/messages/${message.id}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.all(deletePromises);
      
      const allDeleted = results.every((res) => res.ok);

      if (allDeleted) {
        console.log(`✅ Conversation avec ${conversation.userName} supprimée`);
        // Recharger la liste
        await loadMessages();
      } else {
        console.error("❌ Erreur lors de la suppression");
        alert("Une erreur est survenue lors de la suppression de la conversation.");
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert("Une erreur est survenue lors de la suppression.");
    } finally {
      setDeletingConversation(null);
    }
  };

  // Filtrage
  const filteredConversations = conversations.filter((conv) => {
    const matchType = filterType === "TOUS" || conv.userType === filterType;
    const matchNonLus = !filterNonLus || conv.unreadCount > 0;
    const matchSearch =
      conv.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.contenu.toLowerCase().includes(searchTerm.toLowerCase());

    return matchType && matchNonLus && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(
    filteredConversations.length / conversationsPerPage
  );
  const indexOfLastConv = currentPage * conversationsPerPage;
  const indexOfFirstConv = indexOfLastConv - conversationsPerPage;
  const currentConversations = filteredConversations.slice(
    indexOfFirstConv,
    indexOfLastConv
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterNonLus, searchTerm]);

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
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

  const getTypeBadge = (type: UserType) => {
    const configs = {
      medecin: { style: "bg-blue-100 text-blue-800", label: "Médecin" },
      patient: { style: "bg-purple-100 text-purple-800", label: "Patient" },
      utilisateur: { style: "bg-gray-100 text-gray-800", label: "Admin" },
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

  const getMessageDirection = (message: Message) => {
    if (!currentUser) return "received";
    return message.expediteurId === currentUser.id &&
      message.expediteurType === currentUser.type
      ? "sent"
      : "received";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8]"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messagerie</h1>
          <p className="text-gray-600 mt-2">
            {filteredConversations.length} conversation
            {filteredConversations.length > 1 ? "s" : ""}
            {totalUnread > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold">
                {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/messages/nouveau"
          className="bg-[#4DB8A8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3DA391] transition-colors inline-flex items-center justify-center"
        >
          ✉️ Nouveau message
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="TOUS">Tous les contacts</option>
            <option value="patient">Patients</option>
            <option value="medecin">Médecins</option>
            <option value="utilisateur">Admins</option>
          </select>

          <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filterNonLus}
              onChange={(e) => setFilterNonLus(e.target.checked)}
              className="w-4 h-4 text-[#4DB8A8] rounded focus:ring-[#4DB8A8]"
            />
            <span className="text-sm text-gray-700">Non lus uniquement</span>
          </label>
        </div>
      </div>

      {/* Liste des conversations */}
      {currentConversations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentConversations.map((conversation) => {
              // ✅ AJOUT: Variables pour gérer la suppression
              const conversationKey = `${conversation.userId}-${conversation.userType}`;
              const isDeleting = deletingConversation === conversationKey;
              
              return (
                <div
                  key={conversationKey}
                  className={`bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer ${
                    conversation.unreadCount > 0
                      ? "border-l-4 border-[#4DB8A8]"
                      : ""
                  } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() =>
                    router.push(
                      `/admin/messages/conversation/${conversationKey}`
                    )
                  }
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4DB8A8] to-[#3DA391] text-white flex items-center justify-center font-bold text-lg">
                          {getTypeIcon(conversation.userType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {conversation.userName}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTypeBadge(conversation.userType)}
                            {conversation.userSpecialite && (
                              <span className="text-xs text-gray-500 truncate">
                                {conversation.userSpecialite}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dernier message */}
                    <div className="mb-3">
                      {conversation.lastMessage.sujet && (
                        <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                          {conversation.lastMessage.sujet}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {getMessageDirection(conversation.lastMessage) ===
                          "sent" && (
                          <span className="text-[#4DB8A8] font-medium">
                            Vous :{" "}
                          </span>
                        )}
                        {conversation.lastMessage.contenu}
                      </p>
                    </div>

                    {/* Infos */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <span>
                        {new Date(
                          conversation.lastMessage.dateCreation
                        ).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>
                        {conversation.totalMessages} message
                        {conversation.totalMessages > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 px-4 pb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/admin/messages/conversation/${conversationKey}`
                        );
                      }}
                      className="flex-1 bg-[#4DB8A8] text-white text-center py-2 rounded-lg hover:bg-[#3DA391] transition-colors text-xs font-medium"
                    >
                      Voir conversation
                    </button>
                    {conversation.unreadCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkConversationAsRead(conversation);
                        }}
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                        title="Marquer comme lu"
                      >
                        ✓
                      </button>
                    )}
                    {/* ✅ AJOUT: Bouton supprimer */}
                    <button
                      onClick={(e) => handleDeleteConversation(conversation, e)}
                      disabled={isDeleting}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Supprimer la conversation"
                    >
                      {isDeleting ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            currentPage === page
                              ? "bg-[#4DB8A8] text-white"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 py-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune conversation trouvée
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterNonLus || filterType !== "TOUS"
              ? "Essayez de modifier vos filtres"
              : "Commencez par envoyer un message"}
          </p>
        </div>
      )}
    </div>
  );
}