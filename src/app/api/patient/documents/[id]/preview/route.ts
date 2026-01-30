import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    console.log('👁️ Preview Document API - Début (GET)', documentId);

    const user = await getAuthUser(request);
    
    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;

    // Récupérer le document
    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('patientId', patientId)
      .single();

    if (error || !document) {
      console.error('❌ Document non trouvé:', error);
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    console.log('📄 Document trouvé:', document);
    console.log('🔗 URL Fichier:', document.urlFichier);

    // Extraire le path du fichier (même logique que l'admin)
    let filePath = document.urlFichier;

    // Si urlFichier contient une URL complète Supabase, extraire juste le chemin
    if (filePath && filePath.includes('http')) {
      try {
        const url = new URL(filePath);
        const pathParts = url.pathname.split('/');
        
        // Trouver l'index de 'documents' dans le path
        const documentsIndex = pathParts.findIndex(part => part === 'documents');
        
        if (documentsIndex !== -1) {
          // Extraire tout après 'documents/'
          filePath = pathParts.slice(documentsIndex + 1).join('/');
        }
      } catch (urlError) {
        console.error('Erreur parsing URL:', urlError);
      }
    }

    console.log('📁 File path dans storage:', filePath);

    if (!filePath) {
      return NextResponse.json(
        { error: 'Chemin du fichier invalide' },
        { status: 400 }
      );
    }

    // Télécharger le fichier depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('documents')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('❌ Erreur téléchargement:', downloadError);
      console.error('File path utilisé:', filePath);
      return NextResponse.json(
        { 
          error: 'Erreur lors du chargement de l\'aperçu',
          details: downloadError?.message,
          filePath: filePath
        },
        { status: 500 }
      );
    }

    // Convertir le Blob en Buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    console.log('✅ Fichier chargé pour aperçu, taille:', buffer.length);

    // Retourner le fichier directement pour l'aperçu (inline, pas attachment)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': document.typeMime || document.type_mime || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(document.nomFichier || document.nom_fichier || 'document')}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error: any) {
    console.error('💥 Erreur Preview Document:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}