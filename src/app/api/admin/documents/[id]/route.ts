import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// POST - Créer un nouveau document
export async function POST(request: NextRequest) {
  try {
    const documentData = await request.json();

    // Générer un UUID pour l'ID
    const documentId = uuidv4();
    const now = new Date().toISOString();

    // Préparer les données avec tous les champs requis
    const insertData = {
      id: documentId,
      patientId: documentData.patientId,
      categorie: documentData.categorie,
      titre: documentData.titre,
      description: documentData.description,
      urlFichier: documentData.urlFichier,
      nomFichier: documentData.nomFichier,
      tailleFichier: documentData.tailleFichier,
      typeFichier: documentData.typeFichier,
      dateCreation: now,
      dateMiseAJour: now, // ← Assurez-vous que c'est bien défini
      // Ajoutez d'autres champs si nécessaire
    };

    console.log("Données à insérer:", insertData); // Pour déboguer

    const { data: newDocument, error } = await supabaseAdmin
      .from('documents')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Erreur Supabase:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      document: newDocument,
    });
  } catch (error) {
    console.error("Erreur création document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du document" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer le document pour avoir l'URL du fichier
    const { data: document } = await supabaseAdmin
      .from('documents')
      .select('urlFichier')
      .eq('id', id)
      .single();

    if (document && document.urlFichier) {
      // Extraire le path du fichier depuis l'URL Supabase
      const url = new URL(document.urlFichier);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('documents') + 1).join('/');

      // Supprimer le fichier du storage Supabase
      await supabaseAdmin.storage
        .from('documents')
        .remove([filePath]);
    }

    // Supprimer l'entrée de la base de données
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Document supprimé",
    });
  } catch (error) {
    console.error("Erreur suppression document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

// PATCH - Partager avec médecin
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const { data: updatedDocument, error } = await supabaseAdmin
      .from('documents')
      .update({
        ...updates,
        dateMiseAJour: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Erreur mise à jour document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}