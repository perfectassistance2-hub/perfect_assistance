'use client';

import { ReactNode } from 'react';
import PatientSidebar from '@/components/patient/PatientSidebar';
import Footer from '@/components/Footer';

interface PatientLayoutWrapperProps {
  patient: any;
  messagesNonLus?: number;
  notificationsNonLues?: number;
  children: ReactNode;
}

export default function PatientLayoutWrapper({
  patient,
  messagesNonLus = 0,
  notificationsNonLues = 0,
  children
}: PatientLayoutWrapperProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <PatientSidebar 
        patient={patient}
        messagesNonLus={messagesNonLus}
        notificationsNonLues={notificationsNonLues}
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