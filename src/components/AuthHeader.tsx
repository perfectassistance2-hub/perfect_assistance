"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type UserRole = 'patient' | 'medecin' | null;

interface User {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
}

interface AuthHeaderProps {
  user: User | null;
}

export default function AuthHeader({ user }: AuthHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const endpoint = user?.role === 'medecin' 
        ? '/api/auth/medecin/logout'
        : '/api/auth/patient/logout';
      
      await fetch(endpoint, { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Navigation pour les utilisateurs connectés
  const getNavLinks = () => {
    if (!user) {
      return [
        { href: "#services", label: "Services Médicaux" },
        { href: "#hebergement", label: "Hébergement" },
        { href: "#temoignages", label: "Témoignages" },
        { href: "#contact", label: "Contact" }
      ];
    }

    if (user.role === 'patient') {
      return [
        { href: "/patient/dashboard", label: "📊 Tableau de bord" },
        { href: "/patient/rendez-vous", label: "📅 Mes rendez-vous" },
        { href: "/patient/sejours", label: "✈️ Mes séjours" },
        { href: "/patient/documents", label: "📄 Documents" },
        { href: "/patient/messages", label: "💬 Messages" }
      ];
    }

    if (user.role === 'medecin') {
      return [
        { href: "/medecin/dashboard", label: "📊 Tableau de bord" },
        { href: "/medecin/patients", label: "👥 Mes patients" },
        { href: "/medecin/consultations", label: "🎥 Consultations" },
        { href: "/medecin/planning", label: "📅 Planning" },
        { href: "/medecin/messages", label: "💬 Messages" }
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={user ? (user.role === 'medecin' ? '/medecin/dashboard' : '/patient/dashboard') : '/'} className="flex items-center space-x-3">
            <Image
              src="/images/logo_perfect.jpeg"
              alt="Perfect Assistance"
              width={50}
              height={50}
              className="rounded-xl shadow-lg"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] bg-clip-text text-transparent">
                PERFECT ASSISTANCE
              </h1>
              <p className="text-xs text-gray-600">
                {user?.role === 'medecin' ? 'Espace Médecin' : user?.role === 'patient' ? 'Espace Patient' : 'Tourisme Médical & Hébergement'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="text-gray-700 hover:text-[#4DB8A8] font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Menu or Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {user.photoUrl ? (
                    <Image
                      src={user.photoUrl}
                      alt={`${user.prenom} ${user.nom}`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] flex items-center justify-center text-white font-bold">
                      {user.prenom[0]}{user.nom[0]}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.prenom} {user.nom}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.role === 'medecin' ? 'Médecin' : 'Patient'}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.prenom} {user.nom}</p>
                      <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                    </div>
                    
                    <Link
                      href={user.role === 'medecin' ? '/medecin/profil' : '/patient/profil'}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg">👤</span>
                      <span className="text-sm text-gray-700">Mon profil</span>
                    </Link>
                    
                    <Link
                      href={user.role === 'medecin' ? '/medecin/parametres' : '/patient/parametres'}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg">⚙️</span>
                      <span className="text-sm text-gray-700">Paramètres</span>
                    </Link>

                    {user.role === 'patient' && (
                      <Link
                        href="/patient/aide"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-lg">❓</span>
                        <span className="text-sm text-gray-700">Aide & Support</span>
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <span className="text-lg">🚪</span>
                        <span className="text-sm text-red-600 font-medium">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/connexion">
                  <button className="px-6 py-2.5 text-[#4DB8A8] font-medium hover:bg-[#4DB8A8]/10 rounded-xl transition-colors">
                    Connexion
                  </button>
                </Link>
                <Link href="/inscription">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-medium rounded-xl hover:shadow-lg hover:scale-105 transition-all">
                    Inscription
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="block py-2 text-gray-700 hover:text-[#4DB8A8] font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <Link
                  href={user.role === 'medecin' ? '/medecin/profil' : '/patient/profil'}
                  className="block py-2 text-gray-700 hover:text-[#4DB8A8] font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👤 Mon profil
                </Link>
                <Link
                  href={user.role === 'medecin' ? '/medecin/parametres' : '/patient/parametres'}
                  className="block py-2 text-gray-700 hover:text-[#4DB8A8] font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ⚙️ Paramètres
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left py-2 text-red-600 font-medium"
                >
                  🚪 Déconnexion
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <Link href="/connexion" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-6 py-3 text-[#4DB8A8] font-medium hover:bg-[#4DB8A8]/10 rounded-xl transition-colors">
                    Connexion
                  </button>
                </Link>
                <Link href="/inscription" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-medium rounded-xl">
                    Inscription
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}