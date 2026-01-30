import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    console.log("🔍 Recherche document ID:", id);

    // Récupérer les infos du document - ADAPTEZ LES NOMS DE COLONNES
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*') // Sélectionner tout pour debug
      .eq('id', id)
      .single();

    console.log("📄 Document trouvé:", document);
    console.log("❌ Erreur:", docError);

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document non trouvé", details: docError },
        { status: 404 }
      );
    }

    // ADAPTEZ CES NOMS selon votre schéma de base de données
    const urlFichier = document.urlFichier || document.url_fichier;
    const nomFichier = document.nomFichier || document.nom_fichier;
    const typeFichier = document.typeFichier || document.type_fichier || document.typeMime || document.type_mime;

    console.log("🔗 URL Fichier:", urlFichier);
    console.log("📝 Nom Fichier:", nomFichier);
    console.log("📋 Type Fichier:", typeFichier);

    if (!urlFichier) {
      return NextResponse.json(
        { error: "URL du fichier non trouvée" },
        { status: 404 }
      );
    }

    // Extraire le path du fichier depuis l'URL Supabase
    const url = new URL(urlFichier);
    const pathParts = url.pathname.split('/');
    
    console.log("🛤️ Path parts:", pathParts);
    
    // Trouver l'index de 'documents' dans le path
    const documentsIndex = pathParts.findIndex(part => part === 'documents');
    
    if (documentsIndex === -1) {
      return NextResponse.json(
        { error: "Format d'URL invalide" },
        { status: 400 }
      );
    }
    
    const filePath = pathParts.slice(documentsIndex + 1).join('/');
    
    console.log("📁 File path dans storage:", filePath);

    // Télécharger le fichier depuis Supabase Storage
    const { data: fileData, error: fileError } = await supabaseAdmin.storage
      .from('documents')
      .download(filePath);

    console.log("✅ Fichier téléchargé:", !!fileData);
    console.log("❌ Erreur download:", fileError);

    if (fileError || !fileData) {
      return NextResponse.json(
        { 
          error: "Fichier non trouvé dans le storage", 
          details: fileError,
          filePath: filePath 
        },
        { status: 404 }
      );
    }

    // Convertir le blob en buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    console.log("💾 Taille du buffer:", buffer.length);

    // Créer la réponse avec le fichier
    const response = new NextResponse(buffer);
    
    // Définir les headers appropriés
    response.headers.set('Content-Type', typeFichier || 'application/octet-stream');
    response.headers.set('Content-Length', buffer.length.toString());
    
    if (download) {
      response.headers.set(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(nomFichier || 'document')}"`
      );
    } else {
      response.headers.set(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(nomFichier || 'document')}"`
      );
    }

    response.headers.set('Cache-Control', 'private, max-age=3600');

    return response;
  } catch (error) {
    console.error("💥 Erreur récupération fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du fichier", details: String(error) },
      { status: 500 }
    );
  }
}