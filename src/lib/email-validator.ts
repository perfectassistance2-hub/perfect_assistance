// lib/email-validator.ts

import { supabaseAdmin } from '@/lib/supabase';

export async function isEmailAlreadyUsed(
  email: string, 
  excludeId?: string, 
  excludeTable?: 'patients' | 'medecins' | 'medecins_referents' | 'utilisateurs'
): Promise<{
  isUsed: boolean;
  usedIn?: 'patients' | 'medecins' | 'medecins_referents' | 'utilisateurs';
  message?: string;
}> {
  const emailLower = email.toLowerCase().trim();

  // Vérifier dans patients
  if (excludeTable !== 'patients') { // ✅ Ne vérifier QUE si ce n'est PAS la table à exclure
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id, email')
      .eq('email', emailLower)
      .maybeSingle();

    if (patient) {
      return {
        isUsed: true,
        usedIn: 'patients',
        message: 'Cet email est déjà utilisé par un patient'
      };
    }
  } else if (excludeId) { // ✅ Si c'est la table à exclure, vérifier quand même SAUF pour l'ID exclu
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id, email')
      .eq('email', emailLower)
      .neq('id', excludeId)
      .maybeSingle();

    if (patient) {
      return {
        isUsed: true,
        usedIn: 'patients',
        message: 'Cet email est déjà utilisé par un patient'
      };
    }
  }

  // Vérifier dans medecins
  if (excludeTable !== 'medecins') {
    const { data: medecin } = await supabaseAdmin
      .from('medecins')
      .select('id, email')
      .eq('email', emailLower)
      .maybeSingle();

    if (medecin) {
      return {
        isUsed: true,
        usedIn: 'medecins',
        message: 'Cet email est déjà utilisé par un médecin'
      };
    }
  } else if (excludeId) {
    const { data: medecin } = await supabaseAdmin
      .from('medecins')
      .select('id, email')
      .eq('email', emailLower)
      .neq('id', excludeId)
      .maybeSingle();

    if (medecin) {
      return {
        isUsed: true,
        usedIn: 'medecins',
        message: 'Cet email est déjà utilisé par un médecin'
      };
    }
  }

  // Vérifier dans medecins_referents
  if (excludeTable !== 'medecins_referents') {
    const { data: medecinReferent } = await supabaseAdmin
      .from('medecins_referents')
      .select('id, email')
      .eq('email', emailLower)
      .maybeSingle();

    if (medecinReferent) {
      return {
        isUsed: true,
        usedIn: 'medecins_referents',
        message: 'Cet email est déjà utilisé par un médecin référent'
      };
    }
  } else if (excludeId) {
    const { data: medecinReferent } = await supabaseAdmin
      .from('medecins_referents')
      .select('id, email')
      .eq('email', emailLower)
      .neq('id', excludeId)
      .maybeSingle();

    if (medecinReferent) {
      return {
        isUsed: true,
        usedIn: 'medecins_referents',
        message: 'Cet email est déjà utilisé par un médecin référent'
      };
    }
  }

  // Vérifier dans utilisateurs (admin)
  if (excludeTable !== 'utilisateurs') {
    const { data: utilisateur } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, email')
      .eq('email', emailLower)
      .maybeSingle();

    if (utilisateur) {
      return {
        isUsed: true,
        usedIn: 'utilisateurs',
        message: 'Cet email est déjà utilisé par un utilisateur admin'
      };
    }
  } else if (excludeId) {
    const { data: utilisateur } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, email')
      .eq('email', emailLower)
      .neq('id', excludeId)
      .maybeSingle();

    if (utilisateur) {
      return {
        isUsed: true,
        usedIn: 'utilisateurs',
        message: 'Cet email est déjà utilisé par un utilisateur admin'
      };
    }
  }

  return { isUsed: false };
}