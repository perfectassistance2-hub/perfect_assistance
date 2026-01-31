// ========================================
// FICHIER: /app/medecin/messages/page.tsx
// VERSION AVEC FILTRAGE PAR ADMIN
// ========================================
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/medecin/Sidebar';

interface Admin {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  email: string;
}

interface Message {
  id: string;
  expediteur?: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  } | null;
  expediteurId?: string;
  expediteurType?: string;
  destinataire?: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
  } | null;
  destinataireId?: string;
  destinataireType?: string;
  contenu: string;
  sujet?: string;
  estLu: boolean;
  dateCreation: string;
}

export default function MessagesMedecin() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [medecin, setMedecin] = useState<any>(null);
  const [allMessages, setAllMessages] = useState<Message[]>([]); // TOUS les messages
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]); // Messages filtrés
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [showAdminSelector, setShowAdminSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Compter messages non lus (TOUS les admins)
  const messagesNonLus = allMessages.filter(msg => 
    !msg.estLu && msg.expediteurType === 'utilisateur'
  ).length;

  useEffect(() => {
    fetchAdmins();
    fetchMessages();
  }, []);

  // Filtrer les messages quand l'admin change
  useEffect(() => {
    filterMessagesByAdmin();
  }, [selectedAdminId, allMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  const filterMessagesByAdmin = () => {
    if (!selectedAdminId || allMessages.length === 0) {
      setFilteredMessages(allMessages);
      return;
    }

    // Filtrer : messages AVEC cet admin (envoyés par lui OU envoyés à lui)
    const filtered = allMessages.filter(msg => {
      const isFromAdmin = msg.expediteurId === selectedAdminId && msg.expediteurType === 'utilisateur';
      const isToAdmin = msg.destinataireId === selectedAdminId && msg.destinataireType === 'utilisateur';
      return isFromAdmin || isToAdmin;
    });

    console.log(`📊 Messages filtrés pour admin ${selectedAdminId}:`, filtered.length);
    setFilteredMessages(filtered);
  };

  const fetchAdmins = async () => {
    try {
      // Récupérer les infos du médecin
      const medecinResponse = await fetch('/api/medecin/dashboard');
      if (medecinResponse.ok) {
        const medecinResult = await medecinResponse.json();
        if (medecinResult.success && medecinResult.medecin) {
          setMedecin(medecinResult.medecin);
        }
      }

      console.log('🔄 Chargement des admins...');
      
      // Récupérer la liste des admins/coordinateurs
      const response = await fetch('/api/medecin/messages/destinataires');
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Admins reçus:', result);
      
      if (result.success && result.destinataires && result.destinataires.length > 0) {
        setAdmins(result.destinataires);
        
        // Sélectionner le premier admin par défaut
        const defaultAdmin = result.destinataires[0];
        if (defaultAdmin) {
          console.log('👤 Admin par défaut sélectionné:', defaultAdmin.nom);
          setSelectedAdminId(defaultAdmin.id);
        }
      } else {
        console.warn('⚠️ Aucun admin trouvé');
        setAdmins([]);
      }
    } catch (err) {
      console.error('💥 Erreur chargement admins:', err);
      setError('Impossible de charger la liste des coordinateurs');
      setAdmins([]);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/medecin/messages');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/connexion');
          return;
        }
        throw new Error('Erreur lors du chargement des messages');
      }

      const result = await response.json();
      
      if (result.success) {
        setAllMessages(result.messages); // Stocker TOUS les messages
        
        // Marquer les messages non lus comme lus
        result.messages
          .filter((msg: Message) => !msg.estLu && msg.expediteurType === 'utilisateur')
          .forEach((msg: Message) => markAsRead(msg.id));
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/medecin/messages/${messageId}`, {
        method: 'PATCH'
      });
      
      // Mettre à jour localement
      setAllMessages(allMessages.map(msg => 
        msg.id === messageId ? { ...msg, estLu: true } : msg
      ));
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    setError('');
    
    try {
      const response = await fetch('/api/medecin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinataireId: selectedAdminId || null,
          destinataireType: 'utilisateur',
          contenu: newMessage,
          sujet: null
        })
      });

      if (response.ok) {
        setNewMessage('');
        setSuccess('Message envoyé !');
        setTimeout(() => setSuccess(''), 3000);
        fetchMessages();
      } else {
        throw new Error('Erreur envoi');
      }
    } catch (err: any) {
      console.error('Erreur envoi:', err);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;
    
    try {
      const response = await fetch(`/api/medecin/messages?messageId=${messageId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('Message supprimé avec succès !');
        setTimeout(() => setSuccess(''), 3000);
        fetchMessages();
      } else {
        throw new Error('Impossible de supprimer le message');
      }
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression du message');
    }
  };

  const handleQuickAction = (action: string) => {
    let template = '';
    
    switch (action) {
      case 'patient':
        template = 'Bonjour, j\'ai une question concernant l\'un de mes patients. ';
        break;
      case 'planning':
        template = 'Bonjour, je souhaiterais discuter de mon planning. ';
        break;
      case 'technique':
        template = 'Bonjour, je rencontre un problème technique avec ';
        break;
    }
    
    setNewMessage(template);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const currentAdmin = admins.find(a => a.id === selectedAdminId);

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar medecin={{ prenom: '', nom: '', specialite: '' }} messagesNonLus={0} />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20">
      <Sidebar medecin={medecin || { id: '', prenom: '', nom: '', email: '', specialite: '' }} messagesNonLus={messagesNonLus} />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              💬 Messages
              {messagesNonLus > 0 && (
                <span className="ml-3 px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                  {messagesNonLus} nouveau{messagesNonLus > 1 ? 'x' : ''}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Communiquez avec l'administration
              {currentAdmin && filteredMessages.length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  • {filteredMessages.length} message{filteredMessages.length > 1 ? 's' : ''} avec {currentAdmin.nom}
                </span>
              )}
            </p>
          </div>

          {/* Zone de conversation */}
          <div className="flex-1 bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
            {/* Header conversation */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">
                      {currentAdmin ? `${currentAdmin.prenom[0]}${currentAdmin.nom[0]}` : '👥'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">
                      {currentAdmin ? currentAdmin.nom : 'Administration'}
                    </h2>
                    <p className="text-sm text-blue-100">
                      {currentAdmin?.role || 'Équipe administrative'}
                    </p>
                  </div>
                </div>
                
                {admins.length > 1 && (
                  <button
                    onClick={() => setShowAdminSelector(!showAdminSelector)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                  >
                    👥 Changer d'interlocuteur
                  </button>
                )}
              </div>
            </div>

            {/* Modal sélection admin */}
            {showAdminSelector && (
              <div className="bg-blue-50 border-b border-blue-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">Choisir votre interlocuteur</h3>
                  <button
                    onClick={() => setShowAdminSelector(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {admins.map(admin => {
                    // Compter messages avec cet admin
                    const messagesCount = allMessages.filter(msg => {
                      const isFromAdmin = msg.expediteurId === admin.id && msg.expediteurType === 'utilisateur';
                      const isToAdmin = msg.destinataireId === admin.id && msg.destinataireType === 'utilisateur';
                      return isFromAdmin || isToAdmin;
                    }).length;

                    return (
                      <div
                        key={admin.id}
                        onClick={() => {
                          setSelectedAdminId(admin.id);
                          setShowAdminSelector(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          admin.id === selectedAdminId
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-white border border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{admin.nom}</p>
                            <p className="text-sm text-gray-600">{admin.role}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{admin.email}</p>
                          </div>
                          <div className="text-right">
                            {messagesCount > 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {messagesCount} msg
                              </span>
                            )}
                            {admin.id === selectedAdminId && (
                              <span className="text-blue-600 text-xl ml-2">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun message</h3>
                  <p className="text-gray-600 mb-6">
                    {currentAdmin 
                      ? `Commencez une conversation avec ${currentAdmin.nom}`
                      : 'Sélectionnez un interlocuteur pour commencer'}
                  </p>
                </div>
              ) : (
                <>
                  {filteredMessages.map(msg => {
                    const isFromMe = msg.expediteurType === 'medecin';
                    const isNewMessage = !msg.estLu && !isFromMe;
                    
                    return (
                      <div 
                        key={msg.id}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isFromMe ? 'order-1' : 'order-2'}`}>
                          {!isFromMe && msg.expediteur && (
                            <div className="flex items-center mb-1 ml-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-2">
                                <span className="text-white text-xs font-bold">
                                  {msg.expediteur.prenom[0]}{msg.expediteur.nom[0]}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {msg.expediteur.prenom} {msg.expediteur.nom}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatTime(msg.dateCreation)}
                              </span>
                              {isNewMessage && (
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                  NOUVEAU
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className={`rounded-2xl px-4 py-3 ${
                            isFromMe
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                              : 'bg-white border border-gray-200 ml-4'
                          }`}>
                            {msg.sujet && (
                              <p className={`text-sm font-bold mb-1 ${
                                isFromMe ? 'text-white' : 'text-gray-900'
                              }`}>
                                {msg.sujet}
                              </p>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.contenu}
                            </p>
                          </div>
                          
                          {isFromMe && (
                            <div className="flex items-center justify-end mt-1 mr-4 space-x-2">
                              <p className="text-xs text-gray-500">
                                {formatTime(msg.dateCreation)}
                              </p>
                              <button
                                onClick={() => deleteMessage(msg.id)}
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

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <button
                  onClick={() => handleQuickAction('patient')}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-lg transition-colors"
                >
                  👤 Question patient
                </button>
                <button
                  onClick={() => handleQuickAction('planning')}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-lg transition-colors"
                >
                  📅 Planning
                </button>
                <button
                  onClick={() => handleQuickAction('technique')}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-lg transition-colors"
                >
                  ❓ Problème technique
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                  placeholder={`Message à ${currentAdmin?.nom || 'l\'administration'}...`}
                  disabled={sending}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100"
                />
                
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {sending ? (
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
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}