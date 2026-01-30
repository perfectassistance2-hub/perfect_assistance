// Fichier: components/medecin/Sidebar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  medecin: {
    prenom: string;
    nom: string;
    specialite: string;
  } | null;
  messagesNonLus?: number;
}

export default function Sidebar({ medecin, messagesNonLus = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/medecin/dashboard' },
    { icon: '👥', label: 'Mes Patients', href: '/medecin/patients' },
    { icon: '📅', label: 'Rendez-vous', href: '/medecin/rendez-vous' },
    { icon: '💬', label: 'Messages', href: '/medecin/messages', badge: messagesNonLus },
    { icon: '👤', label: 'Mon Profil', href: '/medecin/profil' },
  ];

  const isActive = (href: string) => {
    if (href === '/medecin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      // Appeler l'API de déconnexion
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Rediriger vers la page d'accueil
      router.push('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      // Rediriger quand même
      router.push('/');
    }
  };

  // Protection si medecin est null
  if (!medecin) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-xl text-white">👨‍⚕️</span>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-sm">Dr. {medecin.prenom} {medecin.nom}</h2>
            <p className="text-xs text-gray-600">{medecin.specialite}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <div
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {/* Lien vers l'accueil (sans déconnexion) */}
        <Link href="/">
          <button className="w-full px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-medium flex items-center justify-center space-x-2">
            <span>🏠</span>
            <span>Page d'accueil</span>
          </button>
        </Link>

        {/* Déconnexion */}
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