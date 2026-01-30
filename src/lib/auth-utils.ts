// Fichier: app/lib/auth-utils.ts
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-change-moi'
);

export async function getAuthUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      prenom: payload.prenom as string,
      nom: payload.nom as string
    };
  } catch (error) {
    console.error('Erreur vérification JWT:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest, allowedRoles?: string[]) {
  const user = await getAuthUser(request);

  if (!user) {
    throw new Error('Non authentifié');
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('Non autorisé');
  }

  return user;
}

export async function requirePatient(request: NextRequest) {
  return requireAuth(request, ['patient']);
}

export async function requireMedecin(request: NextRequest) {
  return requireAuth(request, ['medecin']);
}