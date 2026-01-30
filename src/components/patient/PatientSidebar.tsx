// ========================================
// FICHIER: /components/patient/PatientSidebar.tsx
// AVEC COMPTEUR DYNAMIQUE + NOTIFICATION ADMIN
// ========================================
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Patient {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  photoUrl?: string;
}

interface PatientSidebarProps {
  patient: Patient | null;
  notificationsNonLues?: number;
}

export default function PatientSidebar({ 
  patient, 
  notificationsNonLues = 0 
}: PatientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [messagesNonLus, setMessagesNonLus] = useState(0);
  const [latestMessageFrom, setLatestMessageFrom] = useState<string | null>(null);

  // Récupérer le compteur de messages non lus
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/patient/messages/unread-count');
        if (response.ok) {
          const data = await response.json();
          setMessagesNonLus(data.count || 0);
        }
      } catch (error) {
        console.error('Erreur chargement compteur:', error);
      }
    };

    // Récupérer le dernier message non lu avec le nom de l'admin
    const fetchLatestMessage = async () => {
      try {
        const response = await fetch('/api/patient/messages');
        if (response.ok) {
          const result = await response.json();
          const unreadMessages = result.messages.filter((msg: any) => 
            !msg.estLu && msg.expediteur
          );
          
          if (unreadMessages.length > 0) {
            const latest = unreadMessages[unreadMessages.length - 1];
            setLatestMessageFrom(`${latest.expediteur.prenom} ${latest.expediteur.nom}`);
          } else {
            setLatestMessageFrom(null);
          }
        }
      } catch (error) {
        console.error('Erreur chargement dernier message:', error);
      }
    };

    if (patient?.id) {
      fetchUnreadCount();
      fetchLatestMessage();
      
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchLatestMessage();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [patient]);

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', href: '/patient/dashboard' },
    { icon: '🏥', label: 'Mon Séjour', href: '/patient/sejour' },
    { icon: '📅', label: 'Mes Rendez-vous', href: '/patient/rendez-vous' },
    { icon: '📋', label: 'Mon Devis', href: '/patient/devis' },
    { icon: '💳', label: 'Suivi Paiements', href: '/patient/paiements' },
    { icon: '📄', label: 'Mes Documents', href: '/patient/documents' },
    { icon: '💬', label: 'Messages', href: '/patient/messages', badge: messagesNonLus },
    { icon: '🔔', label: 'Notifications', href: '/patient/notifications', badge: notificationsNonLues },
    { icon: '👤', label: 'Mon Profil', href: '/patient/profil' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      router.push('/');
    }
  };

  if (!patient) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex items-center justify-center shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Header avec Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-xl font-bold">PA</span>
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Perfect Assistance
          </h1>
        </div>
        
        {/* Profil Patient */}
        <div className="flex items-center space-x-3">
          {patient.photoUrl ? (
            <Image 
              src={patient.photoUrl} 
              alt={patient.prenom}
              width={48}
              height={48}
              className="rounded-full ring-2 ring-teal-100"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-xl text-white font-bold">
                {patient.prenom[0]}{patient.nom[0]}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-sm truncate">
              {patient.prenom} {patient.nom}
            </h2>
            <p className="text-xs text-gray-500 truncate">{patient.email}</p>
          </div>
        </div>

        {/* Notification nouveau message */}
        {messagesNonLus > 0 && latestMessageFrom && (
          <div className="mt-3 p-2 bg-teal-50 border border-teal-200 rounded-lg animate-pulse">
            <p className="text-xs text-teal-800 font-medium">
              💬 Nouveau message de <span className="font-bold">{latestMessageFrom}</span>
            </p>
          </div>
        )}
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <div
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer group ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-xl transition-transform group-hover:scale-110 ${
                      isActive(item.href) ? 'text-white' : ''
                    }`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isActive(item.href) 
                        ? 'bg-white/20 text-white' 
                        : 'bg-red-500 text-white animate-bounce'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Page d'accueil + Déconnexion */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link href="/">
          <button className="w-full px-4 py-3 text-sm text-teal-600 hover:bg-teal-50 rounded-xl transition-all font-medium flex items-center justify-center space-x-2 border border-teal-200">
            <span>🌐</span>
            <span>Page d'accueil</span>
          </button>
        </Link>

        <button 
          onClick={handleLogout}
          className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium flex items-center justify-center space-x-2"
        >
          <span>🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}