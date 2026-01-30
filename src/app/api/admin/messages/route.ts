// ========================================
// FICHIER: /app/api/admin/messages/route.ts
// CORRECTION: Filtrer par admin connecté (via localStorage)
// ========================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Types
type UserType = "patient" | "medecin" | "utilisateur";

type EnrichedUser = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  type: UserType;
  specialite?: string;
};

// Interfaces pour les données de chaque table
interface PatientData {
  id: string;
  prenom: string;
  nom: string;
  email: string;
}

interface MedecinData {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  specialite?: string;
}

interface UtilisateurData {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
}

// Fonction utilitaire pour récupérer un utilisateur par ID et type
async function getUserByIdAndType(
  userId: string,
  userType: UserType
): Promise<EnrichedUser | null> {
  try {
    if (!userId || !userType) {
      return null;
    }

    let table = "";
    let selectFields = "";
    let defaultRole = "";

    switch (userType) {
      case "patient":
        table = "patients";
        selectFields = "id, prenom, nom, email";
        defaultRole = "patient";
        break;
      case "medecin":
        table = "medecins";
        selectFields = "id, prenom, nom, email, specialite";
        defaultRole = "medecin";
        break;
      case "utilisateur":
        table = "utilisateurs";
        selectFields = "id, prenom, nom, email, role";
        defaultRole = "utilisateur";
        break;
      default:
        console.warn(`⚠️ Type d'utilisateur invalide: ${userType}`);
        return null;
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .select(selectFields)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(`❌ Erreur lors de la recherche dans ${table}:`, error);
      return null;
    }

    if (!data) {
      console.warn(`⚠️ Utilisateur non trouvé: ${userId} dans ${table}`);
      return null;
    }

    // Typage correct selon le type d'utilisateur
    if (userType === "patient") {
      const patientData = data as unknown as PatientData;
      return {
        id: patientData.id,
        prenom: patientData.prenom,
        nom: patientData.nom,
        email: patientData.email,
        role: defaultRole,
        type: userType,
      };
    } else if (userType === "medecin") {
      const medecinData = data as unknown as MedecinData;
      return {
        id: medecinData.id,
        prenom: medecinData.prenom,
        nom: medecinData.nom,
        email: medecinData.email,
        role: defaultRole,
        type: userType,
        specialite: medecinData.specialite,
      };
    } else if (userType === "utilisateur") {
      const utilisateurData = data as unknown as UtilisateurData;
      return {
        id: utilisateurData.id,
        prenom: utilisateurData.prenom,
        nom: utilisateurData.nom,
        email: utilisateurData.email,
        role: utilisateurData.role,
        type: userType,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Erreur getUserByIdAndType:", error);
    return null;
  }
}

// GET - Liste tous les messages de l'admin connecté
export async function GET(request: NextRequest) {
  try {
    console.log("📋 GET /api/admin/messages - Chargement messages");

    // ✅ Récupérer l'adminId depuis les paramètres
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const nonLus = searchParams.get("nonLus") === "true";

    if (!adminId) {
      console.error("❌ adminId manquant");
      return NextResponse.json(
        { error: "adminId requis" },
        { status: 400 }
      );
    }

    console.log('👤 Admin:', adminId);

    // ✅ Récupérer les messages OÙ l'admin est expéditeur OU destinataire
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .or(`and(expediteurId.eq.${adminId},expediteurType.eq.utilisateur),and(destinataireId.eq.${adminId},destinataireType.eq.utilisateur)`)
      .order("dateCreation", { ascending: true }); // ✅ Plus anciens en haut

    if (error) {
      console.error("❌ Erreur Supabase messages:", error);
      throw error;
    }

    console.log(`✅ ${messages?.length || 0} messages chargés`);

    // Filtrer non lus si demandé
    let filteredMessages = messages || [];
    if (nonLus) {
      filteredMessages = filteredMessages.filter(msg => !msg.estLu);
    }

    // Debug: Afficher un échantillon des messages
    if (filteredMessages.length > 0) {
      console.log('📋 Premier message:', {
        id: filteredMessages[0].id,
        expediteurId: filteredMessages[0].expediteurId,
        expediteurType: filteredMessages[0].expediteurType,
        destinataireId: filteredMessages[0].destinataireId,
        destinataireType: filteredMessages[0].destinataireType
      });
    }

    // Enrichir avec les infos utilisateurs
    const enrichedMessages = await Promise.all(
      filteredMessages.map(async (msg) => {
        let expediteur: EnrichedUser | null = null;
        let destinataire: EnrichedUser | null = null;

        // Récupérer l'expéditeur
        if (msg.expediteurId && msg.expediteurType) {
          expediteur = await getUserByIdAndType(
            msg.expediteurId,
            msg.expediteurType as UserType
          );
        }

        // Récupérer le destinataire
        if (msg.destinataireId && msg.destinataireType) {
          destinataire = await getUserByIdAndType(
            msg.destinataireId,
            msg.destinataireType as UserType
          );
        }

        return {
          ...msg,
          expediteur,
          destinataire,
        };
      })
    );

    console.log(`📤 Retour de ${enrichedMessages.length} messages enrichis`);

    return NextResponse.json(enrichedMessages);
  } catch (error) {
    console.error("❌ Erreur chargement messages:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des messages" },
      { status: 500 }
    );
  }
}

// POST - Envoyer un nouveau message
export async function POST(request: NextRequest) {
  try {
    console.log("📤 POST /api/admin/messages - Envoi message");

    const body = await request.json();
    console.log("📦 Body reçu:", JSON.stringify(body, null, 2));

    const {
      adminId, // ✅ Ajouté
      destinataireId,
      destinataireType,
      sujet,
      contenu,
      urlPieceJointe,
      nomPieceJointe,
    } = body;

    // Validation
    if (!adminId) {
      return NextResponse.json(
        { error: "adminId requis" },
        { status: 400 }
      );
    }

    if (!destinataireId || !destinataireType || !contenu) {
      console.error("❌ Validation échouée:", {
        destinataireId,
        destinataireType,
        contenu,
      });
      return NextResponse.json(
        { error: "Destinataire, type de destinataire et contenu requis" },
        { status: 400 }
      );
    }

    // Valider les types
    const validTypes: UserType[] = ["patient", "medecin", "utilisateur"];
    if (!validTypes.includes(destinataireType as UserType)) {
      return NextResponse.json(
        { error: `Type de destinataire invalide: ${destinataireType}` },
        { status: 400 }
      );
    }

    // Vérifier que le destinataire existe
    console.log(`🔍 Vérification destinataire ${destinataireType}:`, destinataireId);
    const destinataireExists = await getUserByIdAndType(
      destinataireId,
      destinataireType as UserType
    );

    if (!destinataireExists) {
      console.error("❌ Destinataire non trouvé");
      return NextResponse.json(
        { error: `Destinataire non trouvé dans ${destinataireType}s` },
        { status: 404 }
      );
    }

    console.log("✅ Destinataire trouvé:", destinataireExists);

    // Créer le message (l'admin est toujours l'expéditeur)
    const messageData = {
      expediteurId: adminId, // ✅ Admin connecté
      expediteurType: 'utilisateur',
      destinataireId,
      destinataireType,
      sujet: sujet || null,
      contenu,
      urlPieceJointe: urlPieceJointe || null,
      nomPieceJointe: nomPieceJointe || null,
      estLu: false,
    };

    console.log("💾 Insertion message:", JSON.stringify(messageData, null, 2));

    const { data: newMessage, error } = await supabaseAdmin
      .from("messages")
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error("❌ Erreur insertion:", error);
      throw error;
    }

    console.log("✅ Message créé:", newMessage.id);

    // Enrichir le message créé
    const expediteurData = await getUserByIdAndType(adminId, 'utilisateur');
    const destinataireData = await getUserByIdAndType(
      newMessage.destinataireId,
      newMessage.destinataireType as UserType
    );

    return NextResponse.json({
      success: true,
      message: {
        ...newMessage,
        expediteur: expediteurData,
        destinataire: destinataireData,
      },
    });
  } catch (error: any) {
    console.error("❌ Erreur envoi message:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}