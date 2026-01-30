import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard API - Début');

    // Vérifier l'authentification
    const user = await getAuthUser(request);
    
    console.log('User:', user);

    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const patientId = user.userId;

    console.log('PatientId:', patientId);

    // 1. Récupérer les informations du patient
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, prenom, nom, email, telephone, statut')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient non trouvé' },
        { status: 404 }
      );
    }

    // Calculer le % de profil complet (simplifié)
    let profilComplet = 50; // Base
    if (patient.telephone) profilComplet += 10;
    // Ajouter d'autres vérifications selon les champs remplis

    // 2. Récupérer le séjour actif
    const { data: sejourActif } = await supabaseAdmin
      .from('sejours')
      .select(`
        id,
        typeTraitement,
        dateArrivee,
        dateDepart,
        statut,
        clinique:cliniques(nom, ville, adresse, telephone),
        medecin:medecins(prenom, nom, specialite)
      `)
      .eq('patientId', patientId)
      .in('statut', ['PLANIFIE', 'EN_COURS'])
      .order('dateArrivee', { ascending: true })
      .limit(1)
      .single();

    // 3. Récupérer les prochains rendez-vous (3 prochains)
    const { data: prochainsRendezVous } = await supabaseAdmin
      .from('rendez_vous')
      .select(`
        id,
        type,
        datePrevue,
        duree,
        statut,
        raison,
        urlReunion,
        medecin:medecins(prenom, nom, specialite),
        clinique:cliniques(nom, ville)
      `)
      .eq('patientId', patientId)
      .in('statut', ['PLANIFIE', 'CONFIRME'])
      .gte('datePrevue', new Date().toISOString())
      .order('datePrevue', { ascending: true })
      .limit(3);

    // 4. Récupérer le devis actif
    const { data: devisActif } = await supabaseAdmin
      .from('devis')
      .select('id, numeroDevis, total, montantPaye, statutPaiement, articles')
      .eq('patientId', patientId)
      .in('statutPaiement', ['EN_ATTENTE', 'PARTIEL'])
      .order('dateCreation', { ascending: false })
      .limit(1)
      .single();

    // 5. Récupérer les documents récents (5 derniers)
    const { data: documentsRecents } = await supabaseAdmin
      .from('documents')
      .select('id, titre, type, dateTeleversement, ajoutePar')
      .eq('patientId', patientId)
      .order('dateTeleversement', { ascending: false })
      .limit(5);

    // 6. Compter les messages non lus
    const { count: messagesNonLus } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('destinataireId', patientId)
      .eq('estLu', false);

    // 7. Compter les notifications non lues (si table existe)
    // const { count: notificationsNonLues } = await supabaseAdmin
    //   .from('notifications')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('utilisateurId', patientId)
    //   .eq('lue', false);
    const notificationsNonLues = 0; // Placeholder

    // 8. Créer la timeline d'activités récentes
    const activitesRecentes = [];

    // Ajouter les rendez-vous récents
    if (prochainsRendezVous && prochainsRendezVous.length > 0) {
      activitesRecentes.push({
        id: `rdv-${prochainsRendezVous[0].id}`,
        type: 'rendez-vous',
        titre: 'Rendez-vous planifié',
        description: `${prochainsRendezVous[0].type === 'VISIO_PRELIMINAIRE' ? 'Consultation vidéo' : 'Consultation en clinique'} avec ${prochainsRendezVous[0].medecin ? 'Dr. ' + prochainsRendezVous[0].medecin.nom : 'un médecin'}`,
        date: prochainsRendezVous[0].datePrevue,
        icon: '📅'
      });
    }

    // Ajouter les documents récents
    if (documentsRecents && documentsRecents.length > 0) {
      documentsRecents.slice(0, 2).forEach(doc => {
        activitesRecentes.push({
          id: `doc-${doc.id}`,
          type: 'document',
          titre: 'Nouveau document',
          description: `${doc.titre} ajouté par ${doc.ajoutePar === 'medecin' ? 'le médecin' : doc.ajoutePar === 'admin' ? 'l\'admin' : 'vous'}`,
          date: doc.dateTeleversement,
          icon: '📄'
        });
      });
    }

    // Ajouter le séjour si actif
    if (sejourActif) {
      activitesRecentes.push({
        id: `sejour-${sejourActif.id}`,
        type: 'sejour',
        titre: 'Séjour programmé',
        description: `${sejourActif.typeTraitement} à ${sejourActif.clinique?.nom}`,
        date: sejourActif.dateArrivee,
        icon: '🏥'
      });
    }

    // Ajouter le devis si actif
    if (devisActif) {
      activitesRecentes.push({
        id: `devis-${devisActif.id}`,
        type: 'devis',
        titre: 'Devis en attente',
        description: `Devis #${devisActif.numeroDevis} - ${devisActif.total.toLocaleString()} MAD`,
        date: new Date().toISOString(),
        icon: '💰'
      });
    }

    // Trier par date décroissante
    activitesRecentes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Retourner toutes les données avec le format success: true
    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        prenom: patient.prenom,
        nom: patient.nom,
        email: patient.email,
        telephone: patient.telephone,
        statut: patient.statut,
        role: 'patient',
        profilComplet
      },
      sejourActif: sejourActif || null,
      prochainsRendezVous: prochainsRendezVous || [],
      devisActif: devisActif || null,
      documentsRecents: documentsRecents || [],
      messagesNonLus: messagesNonLus || 0,
      notificationsNonLues: notificationsNonLues || 0,
      activitesRecentes: activitesRecentes.slice(0, 10)
    });

  } catch (error: any) {
    console.error('💥 Erreur dashboard patient:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}