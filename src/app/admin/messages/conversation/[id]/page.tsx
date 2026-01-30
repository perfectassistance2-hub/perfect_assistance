// ========================================
// FICHIER: /app/admin/messages/conversation/[id]/page.tsx
// AVEC SÉLECTION MULTIPLE + SUPPRESSION EN MASSE
// ========================================
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

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

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<EnrichedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    type: UserType;
  } | null>(null);

  const [replyContent, setReplyContent] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // États pour sélection multiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("admin_user") || "{}");
    console.log("👤 Admin connecté:", user);

    if (user?.id) {
      setCurrentUser({
        id: user.id,
        type: "utilisateur",
      });
    }

    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      console.log("📋 Chargement conversation:", conversationId);

      const parts = conversationId.split("-");
      if (parts.length < 2) {
        console.error("❌ Format conversationId invalide");
        return;
      }

      const userId = parts.slice(0, -1).join("-");
      const userType = parts[parts.length - 1] as UserType;

      console.log("📊 UserId:", userId, "UserType:", userType);

      const admin = JSON.parse(localStorage.getItem("admin_user") || "{}");
      
      if (!admin.id) {
        console.error("❌ Admin non connecté");
        return;
      }

      const response = await fetch(`/api/admin/messages?adminId=${admin.id}`);

      if (!response.ok) {
        throw new Error("Erreur chargement messages");
      }

      const allMessages: Message[] = await response.json();
      console.log(`✅ ${allMessages.length} messages chargés`);

      const currentUserId = admin.id;
      const currentUserType = "utilisateur" as UserType;

      const conversationMessages = allMessages.filter(
        (msg) =>
          (msg.expediteurId === userId &&
            msg.expediteurType === userType &&
            msg.destinataireId === currentUserId &&
            msg.destinataireType === currentUserType) ||
          (msg.expediteurId === currentUserId &&
            msg.expediteurType === currentUserType &&
            msg.destinataireId === userId &&
            msg.destinataireType === userType)
      );

      console.log(
        `✅ ${conversationMessages.length} messages dans la conversation`
      );

      conversationMessages.sort(
        (a, b) =>
          new Date(a.dateCreation).getTime() -
          new Date(b.dateCreation).getTime()
      );

      setMessages(conversationMessages);

      if (conversationMessages.length > 0) {
        const firstMsg = conversationMessages[0];
        const other =
          firstMsg.expediteurId === userId &&
          firstMsg.expediteurType === userType
            ? firstMsg.expediteur
            : firstMsg.destinataire;

        setOtherUser(other);
        console.log("👤 Autre utilisateur:", other);
      }

      const unreadMessages = conversationMessages.filter(
        (msg) =>
          !msg.estLu &&
          msg.destinataireId === currentUserId &&
          msg.destinataireType === currentUserType
      );

      if (unreadMessages.length > 0) {
        console.log(
          `📬 Marquage de ${unreadMessages.length} messages comme lus`
        );
        await Promise.all(
          unreadMessages.map((msg) =>
            fetch(`/api/admin/messages/${msg.id}`, { method: "PATCH" })
          )
        );
      }
    } catch (error) {
      console.error("❌ Erreur chargement conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim() || !otherUser || !currentUser) {
      setError("Veuillez entrer un message");
      return;
    }

    try {
      setReplySending(true);
      setError("");
      setSuccess("");

      const admin = JSON.parse(localStorage.getItem("admin_user") || "{}");

      const payload = {
        adminId: admin.id,
        expediteurId: currentUser.id,
        expediteurType: currentUser.type,
        destinataireId: otherUser.id,
        destinataireType: otherUser.type,
        contenu: replyContent,
      };

      console.log("📤 Envoi réponse:", payload);

      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      console.log("✅ Réponse envoyée");
      setSuccess("✅ Message envoyé avec succès !");
      setReplyContent("");

      setTimeout(() => {
        setSuccess("");
        loadConversation();
      }, 1500);
    } catch (err: any) {
      console.error("❌ Erreur envoi:", err);
      setError(err.message);
    } finally {
      setReplySending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Supprimer ce message ?")) return;

    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        console.log("✅ Message supprimé");
        setSuccess('Message supprimé !');
        setTimeout(() => setSuccess(''), 2000);
        loadConversation();
      }
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      setError('Erreur lors de la suppression');
    }
  };

  // Gestion sélection multiple
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedMessages(new Set());
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelection = new Set(selectedMessages);
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId);
    } else {
      newSelection.add(messageId);
    }
    setSelectedMessages(newSelection);
  };

  const selectAllMessages = () => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(messages.map(m => m.id)));
    }
  };

  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    
    if (!confirm(`Supprimer ${selectedMessages.size} message(s) ?`)) return;

    try {
      setDeleting(true);
      
      await Promise.all(
        Array.from(selectedMessages).map(messageId =>
          fetch(`/api/admin/messages/${messageId}`, {
            method: "DELETE",
          })
        )
      );

      console.log(`✅ ${selectedMessages.size} messages supprimés`);
      setSuccess(`${selectedMessages.size} message(s) supprimé(s) !`);
      setSelectedMessages(new Set());
      setSelectionMode(false);
      
      setTimeout(() => {
        setSuccess('');
        loadConversation();
      }, 2000);
    } catch (error) {
      console.error("❌ Erreur suppression multiple:", error);
      setError('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const getMessageDirection = (message: Message) => {
    if (!currentUser) return "received";
    return message.expediteurId === currentUser.id &&
      message.expediteurType === currentUser.type
      ? "sent"
      : "received";
  };

  const getTypeIcon = (type: UserType) => {
    switch (type) {
      case "medecin": return "👨‍⚕️";
      case "patient": return "👤";
      case "utilisateur": return "👔";
      default: return "❓";
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
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.style}`}>
        {config.label}
      </span>
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#4DB8A8] border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <Link
            href="/admin/messages"
            className="text-[#4DB8A8] hover:text-[#3DA391] inline-flex items-center"
          >
            ← Retour aux messages
          </Link>
        </div>
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Conversation introuvable
          </h3>
          <p className="text-gray-600">
            Impossible de charger cette conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/20 p-8">
      <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/messages"
            className="text-[#4DB8A8] hover:text-[#3DA391] inline-flex items-center mb-4"
          >
            ← Retour aux messages
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Conversation</h1>
              <p className="text-gray-600 mt-2">
                {messages.length} message{messages.length > 1 ? 's' : ''}
                {selectionMode && selectedMessages.size > 0 && (
                  <span className="ml-2 text-[#4DB8A8] font-medium">
                    • {selectedMessages.size} sélectionné{selectedMessages.size > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            
            {/* Boutons mode sélection */}
            <div className="flex items-center space-x-3">
              {selectionMode ? (
                <>
                  <button
                    onClick={selectAllMessages}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    {selectedMessages.size === messages.length ? '❌ Tout désélectionner' : '✅ Tout sélectionner'}
                  </button>
                  
                  <button
                    onClick={deleteSelectedMessages}
                    disabled={selectedMessages.size === 0 || deleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Suppression...' : `🗑️ Supprimer (${selectedMessages.size})`}
                  </button>
                  
                  <button
                    onClick={toggleSelectionMode}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleSelectionMode}
                  className="px-4 py-2 bg-[#4DB8A8] text-white rounded-lg hover:bg-[#3DA391] transition-colors text-sm font-medium"
                >
                  📋 Sélectionner
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Zone de conversation */}
        <div className="flex-1 bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
          {/* Header conversation */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">{getTypeIcon(otherUser.type)}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {otherUser.prenom} {otherUser.nom}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-teal-100">
                  <span>{getTypeBadge(otherUser.type)}</span>
                  {otherUser.specialite && (
                    <span>• {otherUser.specialite}</span>
                  )}
                  <span>• {otherUser.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length > 0 ? (
              <>
                {messages.map((message) => {
                  const direction = getMessageDirection(message);
                  const isSent = direction === "sent";
                  const isSelected = selectedMessages.has(message.id);

                  return (
                    <div
                      key={message.id}
                      className={`flex items-start ${isSent ? "justify-end" : "justify-start"}`}
                    >
                      {/* Checkbox mode sélection */}
                      {selectionMode && (
                        <div className={`flex items-center ${isSent ? 'order-2 ml-3' : 'order-1 mr-3'}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMessageSelection(message.id)}
                            className="w-5 h-5 text-[#4DB8A8] rounded focus:ring-[#4DB8A8] cursor-pointer"
                          />
                        </div>
                      )}

                      <div className={`max-w-[70%] ${isSent ? 'order-1' : 'order-2'} ${isSelected ? 'ring-2 ring-[#4DB8A8] rounded-2xl' : ''}`}>
                        {!isSent && message.expediteur && (
                          <div className="flex items-center mb-1 ml-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#4DB8A8] to-[#3DA391] rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">
                                {message.expediteur.prenom[0]}{message.expediteur.nom[0]}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {message.expediteur.prenom} {message.expediteur.nom}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatTime(message.dateCreation)}
                            </span>
                          </div>
                        )}

                        <div className={`rounded-2xl px-4 py-3 ${
                          isSent
                            ? "bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white"
                            : "bg-white border border-gray-200 ml-4"
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.contenu}
                          </p>
                        </div>

                        {/* Actions individuelles (hors mode sélection) */}
                        {!selectionMode && (
                          <div className={`flex items-center mt-1 space-x-2 ${isSent ? 'justify-end mr-4' : 'justify-start ml-4'}`}>
                            <p className="text-xs text-gray-500">
                              {isSent && formatTime(message.dateCreation)}
                            </p>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-xs text-red-600 hover:text-red-800 hover:underline transition-colors"
                              title="Supprimer ce message"
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <p>Aucun message dans cette conversation</p>
                <p className="text-sm mt-2">Envoyez le premier message ci-dessous</p>
              </div>
            )}
          </div>

          {/* Messages de statut */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}
          {success && (
            <div className="px-6 py-3 bg-green-50 border-t border-green-200">
              <p className="text-sm text-green-700">✅ {success}</p>
            </div>
          )}

          {/* Formulaire de réponse */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSendReply} className="flex items-center space-x-3">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !replySending && handleSendReply(e)}
                placeholder="Écrivez votre message..."
                disabled={replySending}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:border-[#4DB8A8] focus:ring-2 focus:ring-[#4DB8A8]/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              />
              
              <button
                type="submit"
                disabled={replySending || !replyContent.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] hover:from-[#3DA391] hover:to-[#2D8B7D] text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {replySending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📤</span>
                    Envoyer
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}