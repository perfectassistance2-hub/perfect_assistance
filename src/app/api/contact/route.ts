import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, prenom, email, telephone, pays, sujet, message } = body;

    // Validation
    if (!nom || !prenom || !email || !telephone || !sujet || !message) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true pour port 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER, // Email d'envoi
        pass: process.env.SMTP_PASS  // Mot de passe ou App Password
      }
    });

    // Contenu de l'email
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4DB8A8 0%, #3DA391 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-row { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #4DB8A8; }
          .label { font-weight: bold; color: #4DB8A8; margin-bottom: 5px; }
          .value { color: #333; }
          .message-box { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #e0e0e0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Nouveau Message de Contact</h1>
            <p>Perfect Assistance - Tourisme Médical</p>
          </div>
          
          <div class="content">
            <div class="info-row">
              <div class="label">👤 Nom complet</div>
              <div class="value">${prenom} ${nom}</div>
            </div>
            
            <div class="info-row">
              <div class="label">📧 Email</div>
              <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            
            <div class="info-row">
              <div class="label">📞 Téléphone</div>
              <div class="value"><a href="tel:${telephone}">${telephone}</a></div>
            </div>
            
            ${pays ? `
            <div class="info-row">
              <div class="label">🌍 Pays</div>
              <div class="value">${pays}</div>
            </div>
            ` : ''}
            
            <div class="info-row">
              <div class="label">📋 Sujet</div>
              <div class="value"><strong>${sujet}</strong></div>
            </div>
            
            <div class="message-box">
              <div class="label">💬 Message</div>
              <div class="value" style="white-space: pre-wrap;">${message}</div>
            </div>
            
            <div class="footer">
              <p><strong>Reçu le :</strong> ${new Date().toLocaleString('fr-FR', { 
                dateStyle: 'full', 
                timeStyle: 'short',
                timeZone: 'Africa/Casablanca'
              })}</p>
              <p style="margin-top: 10px; font-size: 12px; color: #999;">
                Ce message a été envoyé depuis le formulaire de contact de Perfect Assistance
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Nouveau Message de Contact - Perfect Assistance

Nom complet: ${prenom} ${nom}
Email: ${email}
Téléphone: ${telephone}
${pays ? `Pays: ${pays}` : ''}
Sujet: ${sujet}

Message:
${message}

---
Reçu le: ${new Date().toLocaleString('fr-FR', { 
  dateStyle: 'full', 
  timeStyle: 'short',
  timeZone: 'Africa/Casablanca'
})}
    `;

    // Envoyer l'email aux deux destinataires
    const mailOptions = {
      from: `"Perfect Assistance Contact" <${process.env.SMTP_USER}>`,
      to: [
        'contact@perfectassistance.ma',
        'perfectassistance2@gmail.com'
      ].join(', '),
      subject: `📧 Nouveau message : ${sujet} - ${prenom} ${nom}`,
      text: emailText,
      html: emailHTML,
      replyTo: email // Permet de répondre directement au client
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);

    console.log('✅ Email envoyé avec succès à:', mailOptions.to);

    // Email de confirmation au client (optionnel)
    const confirmationEmail = {
      from: `"Perfect Assistance" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '✅ Votre message a bien été reçu - Perfect Assistance',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4DB8A8 0%, #3DA391 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #4DB8A8 0%, #3DA391 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Message bien reçu !</h1>
            </div>
            
            <div class="content">
              <p>Bonjour ${prenom},</p>
              
              <p>Nous avons bien reçu votre message concernant : <strong>${sujet}</strong></p>
              
              <p>Notre équipe vous répondra dans les plus brefs délais, généralement sous 24 heures.</p>
              
              <p>En attendant, vous pouvez nous contacter directement :</p>
              <ul>
                <li>📞 Téléphone : <a href="tel:+212673623053">+212 6 73 62 30 53</a></li>
                <li>💬 WhatsApp : <a href="https://wa.me/212673623053">Discuter maintenant</a></li>
              </ul>
              
              <center>
                <a href="https://wa.me/212673623053" class="button">💬 Discuter sur WhatsApp</a>
              </center>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #666; font-size: 14px;">
                Cordialement,<br>
                <strong>L'équipe Perfect Assistance</strong><br>
                Tourisme Médical & Hébergement
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Envoyer l'email de confirmation (ne pas bloquer si ça échoue)
    try {
      await transporter.sendMail(confirmationEmail);
      console.log('✅ Email de confirmation envoyé au client');
    } catch (error) {
      console.error('⚠️ Erreur envoi confirmation:', error);
      // Ne pas faire échouer la requête si la confirmation échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès'
    });

  } catch (error: any) {
    console.error('💥 Erreur API contact:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}