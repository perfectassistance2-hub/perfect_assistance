import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client public (pour le frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client admin (pour les API routes - bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Types personnalisés pour votre base de données
export type Utilisateur = {
  id: string
  email: string
  motDePasse: string
  prenom: string
  nom: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'COORDINATEUR'
  telephone: string | null
  estActif: boolean
  dateCreation: string
  dateMiseAJour: string
  derniereConnexion: string | null
}

export type Patient = {
  id: string
  email: string
  prenom: string
  nom: string
  dateNaissance: string
  sexe: string
  telephone: string
  whatsapp: string | null
  pays: string
  ville: string | null
  adresse: string | null
  codePostal: string | null
  numeroPasseport: string | null
  dateExpirationPasseport: string | null
  nationalite: string
  statut: 'EN_ATTENTE' | 'ACTIF' | 'TERMINE' | 'ANNULE'
  estActif: boolean
  langue: string
  dateCreation: string
  dateMiseAJour: string
  derniereConnexion: string | null
}

export type RendezVous = {
  id: string
  patientId: string
  medecinId: string | null
  cliniqueId: string | null
  creePar: string
  type: 'EN_LIGNE' | 'SUR_PLACE' | 'PRE_ARRIVEE' | 'SUIVI_POST_TRAITEMENT'
  statut: 'PLANIFIE' | 'CONFIRME' | 'TERMINE' | 'ANNULE' | 'ABSENT'
  datePrevue: string
  duree: number
  urlReunion: string | null
  motDePasseReunion: string | null
  raison: string | null
  notes: string | null
  dateCreation: string
  dateMiseAJour: string
}

export type Sejour = {
  id: string
  patientId: string
  coordinateurId: string
  cliniqueId: string
  medecinId: string | null
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
  dateArrivee: string
  dateDepart: string
  dateTraitement: string | null
  typeTraitement: string
  descriptionTraitement: string | null
  hebergementNecessaire: boolean
  detailsHebergement: string | null
  transportNecessaire: boolean
  detailsTransport: string | null
  notes: string | null
  dateCreation: string
  dateMiseAJour: string
}

export type Clinique = {
  id: string
  nom: string
  adresse: string
  ville: string
  pays: string
  telephone: string
  email: string | null
  siteWeb: string | null
  specialites: string | null
  estActif: boolean
  dateCreation: string
  dateMiseAJour: string
}