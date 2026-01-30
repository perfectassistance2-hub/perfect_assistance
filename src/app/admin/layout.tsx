"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Footer from "@/components/Footer";

type Utilisateur = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: "SUPER_ADMIN" | "ADMIN" | "COORDINATEUR";
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    // Check authentication
    const userStr = localStorage.getItem("admin_user");
    if (!userStr) {
      router.push("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUtilisateur(user);
    } catch (error) {
      console.error("Erreur parsing user:", error);
      localStorage.removeItem("admin_user");
      router.push("/admin/login");
      return;
    }

    setLoading(false);
  }, [pathname, router]);

  // Si on est sur la page de login, afficher directement le contenu
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4DB8A8] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur, ne rien afficher (la redirection se fait)
  if (!utilisateur) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - sticky en haut */}
      <AdminHeader utilisateur={utilisateur} />

      {/* Main content - prend tout l'espace disponible */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full h-full">
          {children}
        </div>
      </main>

      {/* Footer - fixé en bas */}
      <Footer />
    </div>
  );
}