import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-change-moi'
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = {
      userId: payload.userId as string,
      role: payload.role as string
    };

    if (user.role !== 'medecin') {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const params = await context.params;
    const { id: documentId } = await context.params;

    console.log('📥 Médecin Download - Document:', documentId);

    // Vérifier que le médecin a accès à ce document
    const { data: document, error } = await supabaseAdmin
      .from("documents")
      .select(`
        *,
        patient:patients!patientId(id)
      `)
      .eq("id", documentId)
      .single();

    if (error || !document) {
      console.error('❌ Document introuvable:', error);
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    // Vérifier que le médecin a un séjour avec ce patient
    const { data: sejour } = await supabaseAdmin
      .from("sejours")
      .select("id")
      .eq("patientId", document.patientId)
      .eq("medecinId", user.userId)
      .maybeSingle();

    // Ou que le document est explicitement partagé avec lui
    const hasAccess = 
      sejour || 
      document.partageAvecMedecin === true || 
      document.medecinPartageId === user.userId ||
      document.ajoutePar === 'medecin';

    if (!hasAccess) {
      console.error('❌ Accès refusé - Médecin:', user.userId, 'Document:', documentId);
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    console.log('✅ Accès autorisé - urlFichier:', document.urlFichier);

    // Extraire le path du fichier (même logique que patient)
    let filePath = document.urlFichier;

    // Si urlFichier contient une URL complète, extraire le chemin
    if (filePath && filePath.includes('http')) {
      try {
        const url = new URL(filePath);
        const pathParts = url.pathname.split('/');
        const documentsIndex = pathParts.findIndex(part => part === 'documents');
        
        if (documentsIndex !== -1) {
          filePath = pathParts.slice(documentsIndex + 1).join('/');
        }
      } catch (urlError) {
        console.error('Erreur parsing URL:', urlError);
      }
    }

    console.log('📁 File path dans storage:', filePath);

    if (!filePath) {
      return NextResponse.json({ error: 'Chemin du fichier invalide' }, { status: 400 });
    }

    // Télécharger le fichier depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('documents')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('❌ Erreur téléchargement:', downloadError);
      return NextResponse.json({ 
        error: 'Erreur lors du téléchargement du fichier',
        details: downloadError?.message 
      }, { status: 500 });
    }

    // Convertir le Blob en Buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    console.log('✅ Fichier téléchargé, taille:', buffer.length);

    // Retourner le fichier directement (proxy)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': document.typeMime || document.type_mime || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.nomFichier || document.nom_fichier || 'document')}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}