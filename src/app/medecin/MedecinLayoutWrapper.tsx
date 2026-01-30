'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/medecin/Sidebar';
import Footer from '@/components/Footer';

interface MedecinLayoutWrapperProps {
  medecin: any;
  messagesNonLus?: number;
  children: ReactNode;
}

export default function MedecinLayoutWrapper({
  medecin,
  messagesNonLus = 0,
  children
}: MedecinLayoutWrapperProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        medecin={medecin}
        messagesNonLus={messagesNonLus}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}