import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST - Upload un fichier vers Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const type = formData.get('type') as string;

    console.log("📤 Début upload:", { 
      fileName: file?.name, 
      fileSize: file?.size,
      patientId, 
      type 
    });

    if (!file || !patientId || !type) {
      return NextResponse.json(
        { error: "Fichier, patient ID et type requis" },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier (max 10 MB)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 10 MB" },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.]/g, '_')
      .substring(0, 100);
    const fileName = `${patientId}/${type}/${timestamp}_${sanitizedFileName}`;

    console.log("📁 Nom du fichier:", fileName);

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("💾 Buffer créé, taille:", buffer.length);

    // Upload vers Supabase Storage avec retry
    let uploadAttempts = 0;
    const maxAttempts = 3;
    let uploadData = null;
    let uploadError = null;

    while (uploadAttempts < maxAttempts && !uploadData) {
      uploadAttempts++;
      console.log(`⏳ Tentative d'upload ${uploadAttempts}/${maxAttempts}`);

      try {
        const result = await supabaseAdmin.storage
          .from('documents')
          .upload(fileName, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });

        uploadData = result.data;
        uploadError = result.error;

        if (uploadError) {
          console.error(`❌ Erreur tentative ${uploadAttempts}:`, uploadError);
          if (uploadAttempts < maxAttempts) {
            // Attendre avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          }
        } else {
          console.log("✅ Upload réussi:", uploadData);
        }
      } catch (err) {
        console.error(`💥 Exception tentative ${uploadAttempts}:`, err);
        uploadError = err;
        if (uploadAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
        }
      }
    }

    if (uploadError || !uploadData) {
      console.error("❌ Échec de l'upload après", maxAttempts, "tentatives");
      throw uploadError || new Error("Upload failed after retries");
    }

    // Obtenir l'URL publique du fichier
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName);

    console.log("🔗 URL publique:", publicUrl);

    return NextResponse.json({
      success: true,
      urlFichier: publicUrl,
      nomFichier: file.name,
      tailleFichier: file.size,
      typeMime: file.type || 'application/octet-stream',
    });
  } catch (error: any) {
    console.error("💥 Erreur upload document:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de l'upload du document",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}