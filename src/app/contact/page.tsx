'use client';

import React, { useState } from 'react';
import HomeHeader from '@/components/HomeHeader';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    pays: '',
    sujet: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          pays: '',
          sujet: '',
          message: ''
        });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError('Erreur lors de l\'envoi. Veuillez réessayer.');
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: '📧',
      title: 'Email',
      value: 'support@perfectassistance.fr',
      link: 'mailto:support@perfectassistance.fr'
    },
    {
      icon: '📞',
      title: 'Téléphone',
      value: '+212 6 73 62 30 53',
      link: 'tel:+212673623053'
    },
    {
      icon: '💬',
      title: 'WhatsApp',
      value: '+212 6 73 62 30 53',
      link: 'https://wa.me/212673623053'
    },
    {
      icon: '📍',
      title: 'Adresse',
      value: 'Casablanca, Maroc',
      link: null
    }
  ];

  const sujets = [
    'Demande de devis',
    'Prise de rendez-vous',
    'Information sur les services',
    'Hébergement',
    'Transport',
    'Suivi médical',
    'Autre'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <HomeHeader 
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full mb-6 shadow-md">
            <span className="text-xl">📞</span>
            <span className="text-sm font-medium text-[#4DB8A8]">Nous contacter</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Parlons de votre projet
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Notre équipe est à votre écoute pour répondre à toutes vos questions et vous accompagner dans votre parcours de soins
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:scale-105">
                <div className="text-4xl mb-4">{info.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{info.title}</h3>
                {info.link ? (
                  <a 
                    href={info.link}
                    className="text-[#4DB8A8] hover:text-[#3DA391] font-medium transition-colors"
                    target={info.link.startsWith('http') ? '_blank' : undefined}
                    rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-gray-600">{info.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Map Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Formulaire */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Envoyez-nous un message
              </h2>
              <p className="text-gray-600 mb-8">
                Remplissez ce formulaire et nous vous répondrons dans les plus brefs délais
              </p>

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-800 font-medium flex items-center">
                    <span className="mr-2">✅</span>
                    Message envoyé avec succès ! Nous vous répondrons bientôt.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 font-medium flex items-center">
                    <span className="mr-2">❌</span>
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Mohammed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Alami"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                    placeholder="mohammed@email.com"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="+212 6 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays
                    </label>
                    <input
                      type="text"
                      name="pays"
                      value={formData.pays}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                      placeholder="Maroc"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet *
                  </label>
                  <select
                    name="sujet"
                    value={formData.sujet}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    {sujets.map((sujet, index) => (
                      <option key={index} value={sujet}>{sujet}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4DB8A8] focus:border-transparent transition-all resize-none"
                    placeholder="Décrivez votre demande en détail..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">📧</span>
                      Envoyer le message
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Info + Horaires */}
            <div className="space-y-8">
              {/* Horaires */}
              <div className="bg-gradient-to-br from-[#4DB8A8] to-[#3DA391] rounded-3xl shadow-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="mr-3">🕐</span>
                  Horaires d'ouverture
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/20">
                    <span className="font-medium">Lundi - Vendredi</span>
                    <span className="font-bold">9h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/20">
                    <span className="font-medium">Samedi</span>
                    <span className="font-bold">9h00 - 13h00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Dimanche</span>
                    <span className="font-bold">Fermé</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white/10 rounded-xl">
                  <p className="text-sm">
                    <span className="font-bold">Service d'urgence :</span> Disponible 24h/7j via WhatsApp
                  </p>
                </div>
              </div>

              {/* Pourquoi nous choisir */}
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-3">⭐</span>
                  Pourquoi nous choisir ?
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: '🏆', text: 'Plus de 10 ans d\'expérience' },
                    { icon: '🌍', text: 'Réseau international de cliniques' },
                    { icon: '👨‍⚕️', text: 'Médecins certifiés et reconnus' },
                    { icon: '💼', text: 'Accompagnement personnalisé' },
                    { icon: '🔒', text: 'Confidentialité garantie' },
                    { icon: '💯', text: '98% de satisfaction client' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-gray-700 font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Rapide */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Trouvez rapidement des réponses à vos questions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: 'Combien de temps à l\'avance dois-je vous contacter ?',
                r: 'Nous recommandons de nous contacter au moins 2-3 semaines avant la date souhaitée pour organiser au mieux votre séjour médical.'
              },
              {
                q: 'Proposez-vous des devis gratuits ?',
                r: 'Oui, tous nos devis sont gratuits et sans engagement. Nous vous fournirons une estimation détaillée sous 24-48h.'
              },
              {
                q: 'Quelles langues parlez-vous ?',
                r: 'Notre équipe parle français, arabe, anglais et espagnol pour mieux vous accompagner.'
              },
              {
                q: 'Comment se déroule le paiement ?',
                r: 'Nous acceptons les virements bancaires, cartes de crédit et paiements en plusieurs fois. Paiement sécurisé garanti.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">{faq.q}</h4>
                <p className="text-gray-600">{faq.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#4DB8A8] to-[#3DA391] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Besoin d'une réponse immédiate ?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Contactez-nous directement sur WhatsApp pour une assistance rapide
          </p>
          <a
            href="https://wa.me/212673623053"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-3 px-10 py-4 bg-white text-[#4DB8A8] font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>Discuter sur WhatsApp</span>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}