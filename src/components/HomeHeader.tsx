'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  userId: string;
  email: string;
  role: 'patient' | 'medecin' | 'admin';
  prenom?: string;
  nom?: string;
}

interface HomeHeaderProps {
  scrolled: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function HomeHeader({ scrolled, mobileMenuOpen, setMobileMenuOpen }: HomeHeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
      // 401 = normal si non connecté, pas besoin de logger
    } catch (error) {
      // Erreur réseau uniquement
      console.error('Erreur réseau auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardUrl = () => {
    if (!user) return '/connexion';
    
    switch (user.role) {
      case 'patient':
        return '/patient/dashboard';
      case 'medecin':
        return '/medecin/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/connexion';
    }
  };

  const getRoleLabel = () => {
    if (!user) return '';
    
    switch (user.role) {
      case 'patient':
        return 'Patient';
      case 'medecin':
        return 'Médecin';
      case 'admin':
        return 'Administrateur';
      default:
        return '';
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
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
              <p className="text-xs text-gray-600">Evacuation Médical & Hébergement</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/#services" className="text-gray-700 hover:text-[#4DB8A8] font-medium transition-colors">
              Services Médicaux
            </Link>
            <Link href="/#hebergement" className="text-gray-700 hover:text-[#4DB8A8] font-medium transition-colors">
              Hébergement
            </Link>
            <Link href="/#temoignages" className="text-gray-700 hover:text-[#4DB8A8] font-medium transition-colors">
              Témoignages
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-[#4DB8A8] font-medium transition-colors">
              Contact
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 border-2 border-[#4DB8A8] border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              // ✅ Utilisateur connecté
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email}
                  </p>
                  <p className="text-xs text-[#4DB8A8]">{getRoleLabel()}</p>
                </div>
                <Link href={getDashboardUrl()}>
                  <button className="px-6 py-2.5 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all">
                    📊 Mon Compte
                  </button>
                </Link>
              </div>
            ) : (
              // ❌ Utilisateur non connecté
              <>
                <Link href="/connexion">
                  <button className="px-6 py-2.5 text-[#4DB8A8] font-medium hover:bg-[#4DB8A8]/10 rounded-xl transition-colors">
                    Connexion
                  </button>
                </Link>
                <Link href="/inscription">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all">
                    Inscription
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <nav className="flex flex-col space-y-4">
              <Link href="/#services" className="text-gray-700 hover:text-[#4DB8A8] font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Services Médicaux
              </Link>
              <Link href="/#hebergement" className="text-gray-700 hover:text-[#4DB8A8] font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Hébergement
              </Link>
              <Link href="/#temoignages" className="text-gray-700 hover:text-[#4DB8A8] font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Témoignages
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-[#4DB8A8] font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Contact
              </Link>
              
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {loading ? (
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-[#4DB8A8] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : user ? (
                  // Mobile - Utilisateur connecté
                  <>
                    <div className="px-4 py-2 bg-[#4DB8A8]/10 rounded-xl">
                      <p className="text-sm font-medium text-gray-900">
                        {user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email}
                      </p>
                      <p className="text-xs text-[#4DB8A8]">{getRoleLabel()}</p>
                    </div>
                    <Link href={getDashboardUrl()}>
                      <button className="w-full px-4 py-3 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-bold rounded-xl hover:shadow-xl transition-all">
                        📊 Mon Compte
                      </button>
                    </Link>
                  </>
                ) : (
                  // Mobile - Utilisateur non connecté
                  <>
                    <Link href="/connexion">
                      <button className="w-full px-4 py-3 text-[#4DB8A8] font-medium border-2 border-[#4DB8A8] rounded-xl hover:bg-[#4DB8A8]/10 transition-colors">
                        Connexion
                      </button>
                    </Link>
                    <Link href="/inscription">
                      <button className="w-full px-4 py-3 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-bold rounded-xl hover:shadow-xl transition-all">
                        Inscription
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}