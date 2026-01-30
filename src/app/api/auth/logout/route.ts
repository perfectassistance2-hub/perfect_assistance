import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Déconnexion réussie",
      redirect: "app/page.tsx" // Indiquer au client où rediriger
    });

    // Supprimer le cookie
    response.cookies.delete('auth-token');

    return response;
  } catch (error: any) {
    console.error("Erreur lors de la déconnexion:", error);
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion" },
      { status: 500 }
    );
  }
}