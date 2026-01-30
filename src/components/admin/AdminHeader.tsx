// components/AdminHeader.tsx ou app/admin/components/AdminHeader.tsx

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Utilisateur = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: "SUPER_ADMIN" | "ADMIN" | "COORDINATEUR";
};

type AdminHeaderProps = {
  utilisateur: Utilisateur;
};

export default function AdminHeader({ utilisateur }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { name: "Patients", href: "/admin/patients", icon: "👥" },
    { name: "Médecins Référents", href: "/admin/medecins-referents", icon: "👨‍⚕️" },
    { name: "Rendez-vous", href: "/admin/rendez-vous", icon: "📅" },
    { name: "Séjours", href: "/admin/sejours", icon: "✈️" },
    { name: "Cliniques", href: "/admin/cliniques", icon: "🏥" },
    { name: "Médecins", href: "/admin/medecins", icon: "👨‍⚕️" },
    { name: "Visioconférence", href: "/admin/consultations-video", icon: "🎥" },
    { name: "Comptabilité", href: "/admin/comptabilite", icon: "💰" }, // ✅ AJOUT
    { name: "Devis", href: "/admin/devis", icon: "💼" },
    { name: "Messages", href: "/admin/messages", icon: "💬" },
  ];

  // Ajouter la gestion des utilisateurs pour Super Admin
  if (utilisateur.role === "SUPER_ADMIN") {
    navigation.push({
      name: "Utilisateurs",
      href: "/admin/utilisateurs",
      icon: "👨‍💼",
    });
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      {/* Top bar avec logo et user */}
      <div className="border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et titre */}
            <Link href="/admin/dashboard" className="flex items-center space-x-3">
              <Image
                src="/images/logo_perfect.jpeg"
                alt="Perfect Assistance"
                width={50}
                height={50}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-[#4DB8A8]">
                  PERFECT ASSISTANCE
                </h1>
                <p className="text-xs text-gray-600">Administration</p>
              </div>
            </Link>

            {/* User info et menu */}
            <div className="flex items-center space-x-4">
              {/* User info - masqué sur mobile */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {utilisateur.prenom} {utilisateur.nom}
                </p>
                <p className="text-xs text-gray-600">
                  {utilisateur.role === "SUPER_ADMIN"
                    ? "Super Administrateur"
                    : utilisateur.role === "ADMIN"
                    ? "Administrateur"
                    : "Coordinateur"}
                </p>
              </div>

              {/* Menu dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#4DB8A8] text-white flex items-center justify-center font-bold text-sm">
                    {utilisateur.prenom[0]}
                    {utilisateur.nom[0]}
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      {/* Info utilisateur sur mobile */}
                      <div className="md:hidden px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {utilisateur.prenom} {utilisateur.nom}
                        </p>
                        <p className="text-xs text-gray-600">{utilisateur.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {utilisateur.role === "SUPER_ADMIN"
                            ? "Super Administrateur"
                            : utilisateur.role === "ADMIN"
                            ? "Administrateur"
                            : "Coordinateur"}
                        </p>
                      </div>

                      <Link
                        href="/admin/profil"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setMenuOpen(false)}
                      >
                        👤 Mon profil
                      </Link>
                      <Link
                        href="/admin/parametres"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setMenuOpen(false)}
                      >
                        ⚙️ Paramètres
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🚪 Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href} // ✅ CORRECTION: Utiliser href comme key (plus unique que name)
                href={item.href}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    isActive
                      ? "bg-[#4DB8A8] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </header>
  );
}