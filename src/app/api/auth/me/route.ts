import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Récupérer l'utilisateur depuis le token
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Récupérer les infos supplémentaires selon le rôle
    let userData = null;

    if (user.role === 'patient') {
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('id, prenom, nom, email')
        .eq('id', user.userId)
        .single();
      
      userData = patient;
    } else if (user.role === 'medecin') {
      const { data: medecin } = await supabaseAdmin
        .from('medecins')
        .select('id, prenom, nom, email, specialite')
        .eq('id', user.userId)
        .single();
      
      userData = medecin;
    } else if (user.role === 'admin') {
      const { data: admin } = await supabaseAdmin
        .from('utilisateurs')
        .select('id, prenom, nom, email')
        .eq('id', user.userId)
        .single();
      
      userData = admin;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        ...userData
      }
    });

  } catch (error: any) {
    console.error('Erreur vérification auth:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}