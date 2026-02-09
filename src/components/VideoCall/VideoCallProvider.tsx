// components/VideoCall/VideoCallProvider.tsx

"use client";

import DailyVideoCall from "./DailyVideoCall";
import ZegoCloudVideoCall from "./ZegoCloudVideoCall";

type Consultation = {
  id: string;
  titre: string;
  description: string | null;
  date_debut: string;
  date_fin: string;
  duree: number;
  statut: string;
  daily_room_url?: string;
  daily_room_name?: string;
  zego_room_id?: string;
  lien_patient: string;
  lien_medecin: string;
  enregistrement_autorise: boolean;
  enregistrement_demarre: boolean;
  plateforme: "DAILY" | "ZEGOCLOUD";
  patient: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string | null;
  };
  medecin: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
    email: string | null;
  } | null;
  rendez_vous: {
    id: string;
    datePrevue: string;
    raison: string;
    type: string;
  } | null;
  createur: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
  };
};

type VideoCallProviderProps = {
  consultation: Consultation;
  isPiPMode: boolean;
  onTogglePiP: () => void;
  onLeave: () => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  onUpdateStatut: (statut: string) => void;
  onParticipantsChange: (participants: any[]) => void;
};

export default function VideoCallProvider({
  consultation,
  isPiPMode,
  onTogglePiP,
  onLeave,
  onError,
  onSuccess,
  onUpdateStatut,
  onParticipantsChange,
}: VideoCallProviderProps) {
  if (consultation.plateforme === "DAILY") {
    return (
      <DailyVideoCall
        consultation={consultation}
        isPiPMode={isPiPMode}
        onTogglePiP={onTogglePiP}
        onLeave={onLeave}
        onError={onError}
        onSuccess={onSuccess}
        onUpdateStatut={onUpdateStatut}
        onParticipantsChange={onParticipantsChange}
      />
    );
  }

  if (consultation.plateforme === "ZEGOCLOUD") {
    return (
      <ZegoCloudVideoCall
        consultation={consultation}
        isPiPMode={isPiPMode}
        onTogglePiP={onTogglePiP}
        onLeave={onLeave}
        onError={onError}
        onSuccess={onSuccess}
        onUpdateStatut={onUpdateStatut}
        onParticipantsChange={onParticipantsChange}
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center">
        <p className="text-red-600 font-semibold">
          Plateforme de visioconférence non supportée : {consultation.plateforme}
        </p>
      </div>
    </div>
  );
}