"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import HomeHeader from '@/components/HomeHeader';

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoScroll, setVideoScroll] = useState(0);

  

  // Images médicales du Maroc (hôpitaux, cliniques modernes)
  const backgroundImages = [
    "https://images.unsplash.com/photo-1710074213379-2a9c2653046a?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Hôpital moderne
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1920&q=80", // Équipe médicale
    "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1920&q=80", // Salle d'opération moderne
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1920&q=80", // Clinique contemporaine
    "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1920&q=80", // Centre médical
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Change d'image toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const medicalServices = [
    {
      icon: "🩺",
      title: "Consultations Médicales",
      description: "Accédez aux meilleurs spécialistes internationaux pour tous vos besoins médicaux"
    },
    {
      icon: "🎥",
      title: "Téléconsultation",
      description: "Consultez vos médecins à distance en visioconférence sécurisée avant votre voyage"
    },
    {
      icon: "✈️",
      title: "Organisation Voyage",
      description: "Billets d'avion, transferts aéroport et tous les déplacements organisés"
    },
    {
      icon: "📅",
      title: "Suivi Personnalisé",
      description: "Accompagnement avant, pendant et après vos soins médicaux"
    }
  ];

  const accommodationTypes = [
    {
      icon: "🏨",
      title: "Hôtels Partenaires",
      description: "Sélection d'hôtels 3 à 5 étoiles proches des cliniques",
      features: ["Petit-déjeuner inclus", "Wifi gratuit", "Service 24h/24"]
    },
    {
      icon: "🏠",
      title: "Appartements Meublés",
      description: "Appartements tout équipés pour plus d'autonomie",
      features: ["Cuisine équipée", "Espace de vie", "Idéal famille"]
    },
    {
      icon: "🏡",
      title: "Résidences Médicalisées",
      description: "Hébergement avec assistance médicale sur place",
      features: ["Infirmière disponible", "Suivi post-opératoire", "Sécurisé"]
    }
  ];

  const stats = [
    { number: "5000+", label: "Patients Accompagnés" },
    { number: "330+", label: "Médecins Partenaires" },
    { number: "30+", label: "Cliniques d'Excellence" },
    { number: "99%", label: "Taux de Satisfaction" }
  ];

  const testimonials = [
    {
      name: "Vicky Mahamba",
      location: "RD. Congo",
      rating: 5,
      text: "Perfect Assistance a vraiment été un pilier pour nous tout au long de notre parcours médical. Dès les premières démarches de notre voyage jusqu’à la fin de notre séjour, nous avons bénéficié d’un accompagnement sérieux, rassurant, efficace et parfaitement organisé. Leur professionnalisme, leur disponibilité et la qualité de leur orientation vers des médecins compétents et qualifiés nous ont immédiatement mis en confiance. Nous avons particulièrement apprécié la qualité de l’assistance, la disponibilité et le sens du détail dont l’équipe a fait preuve. Chaque étape a été gérée avec rigueur et attention, ce qui a rendu notre expérience fluide et sans stress.",
      treatment: ""
    },
    {
      name: "Mamie Masikini",
      location: "RD. Congo",
      rating: 5,
      text: "Bonjour la famille. Moi ,sans l'assistance de perfect; il n'y aurait Pas de vie au maroc✌️ Du point de vu accompagnement, coût, rendez vous, honnêteté,visite... Pour moi il n'y a pas deux comme perfect assistance dans tout le territoire Marocaine. Merci de tout cœur Pour tout vos services rendus. 🙏🙏 Avec perfect assistance rien n'est impossible .👌",
      treatment: ""
    },
    {
      name: "Candide Olakouara",
      location: "Congo Brazzaville",
      rating: 5,
      text: "Très bonne association, l’accompagnement est totale de la recommandation des médecins, la consultation jusqu’à la prise en charge du malade. Ma mère s’est faite opérer d’une arthrose du genou gauche il y a quelques semaines. Rien à signaler.",
      treatment: "Arthrose du genou gauche"
    }
  ];

  // Vidéos YouTube - Remplacez les IDs par vos vraies vidéos
  const youtubeVideos = [
    { id: "SVb02T4hNSY", title: "Infertilité Masculine" },
    { id: "aPgQmka_z-M", title: "Calcul Rénal" },
    { id: "1Vypwdi_vI", title: "Prise en charge des Patientes du Cancer du Sein" },
    { id: "uENzi9QAAZY", title: "Arthrose" }
  ];

  const scrollVideos = (direction: 'left' | 'right') => {
  const container = document.getElementById('videos-container');
  if (!container) return;
  
  const scrollAmount = 400; // Largeur approximative d'une vidéo
  const newScroll = direction === 'left' 
    ? Math.max(0, videoScroll - scrollAmount)
    : Math.min(container.scrollWidth - container.clientWidth, videoScroll + scrollAmount);
  
  container.scrollTo({
    left: newScroll,
    behavior: 'smooth'
  });
  
  setVideoScroll(newScroll);
};

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader 
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden min-h-screen">
      {/* Fond avec images défilantes */}
      <div className="absolute inset-0 z-0">
        {backgroundImages.map((image, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Medical background ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Overlay gradient léger pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-[#4DB8A8]/20 z-10" />
      
      {/* Dégradé vertical */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/40 z-10" />
      
      {/* Bulles décoratives */}
      <div className="absolute top-40 left-10 w-72 h-72 bg-[#4DB8A8]/15 rounded-full blur-3xl z-10 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl z-10 animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Indicateurs de slides */}
      <div className="absolute top-24 right-8 flex flex-col gap-2 z-30">
        {backgroundImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentImageIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentImageIndex 
                ? 'bg-white h-8 shadow-lg' 
                : 'bg-white/60 hover:bg-white/90'
            }`}
            aria-label={`Aller à l'image ${idx + 1}`}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-20">
        <div className="text-center space-y-8 mb-16">
          

          <h1 className="text-5xl lg:text-6xl font-bold leading-tight drop-shadow-lg">
            <span className="text-gray-900">Votre santé mérite</span>
            <span className="block bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] bg-clip-text text-transparent drop-shadow-sm">
              les meilleurs soins
            </span>
          </h1>

          <p className="text-xl text-gray-900 leading-relaxed max-w-3xl mx-auto backdrop-blur-md bg-white/80 p-6 rounded-2xl shadow-xl border border-white/50">
            Accédez aux meilleurs établissements médicaux internationaux avec un accompagnement complet : 
            <span className="font-semibold text-[#4DB8A8]"> soins médicaux, hébergement, transport</span> et suivi personnalisé.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription">
              <button className="group px-8 py-4 bg-gradient-to-r from-[#4DB8A8] to-[#3DA391] text-white font-medium rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center space-x-2 shadow-lg">
                <span>Commencer maintenant</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </Link>
            <a href="#services">
              <button className="px-8 py-4 border-2 border-white bg-white/90 backdrop-blur-md text-[#4DB8A8] font-medium rounded-xl hover:bg-white hover:shadow-2xl transition-all flex items-center justify-center space-x-2 shadow-lg">
                <span>Découvrir nos services</span>
              </button>
            </a>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all border border-white/50">
                <div className="text-3xl font-bold text-[#4DB8A8] mb-2">{stat.number}</div>
                <div className="text-sm text-gray-800 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

      {/* Medical Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-[#4DB8A8]/10 px-4 py-2 rounded-full mb-4">
              <span className="text-xl">❤️</span>
              <span className="text-sm font-medium text-[#4DB8A8]">Services Médicaux</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Un accompagnement médical complet
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              De la consultation initiale au suivi post-opératoire, nous gérons chaque étape de votre parcours médical
            </p>
          </div>

          {/* Section Vidéos YouTube */}
          <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full mb-4 shadow-md">
                  <span className="text-xl">🎥</span>
                  <span className="text-sm font-medium text-[#4DB8A8]">Nos Vidéos</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Découvrez nos services en vidéo
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Visionnez nos témoignages et présentations
                </p>
              </div>

              {/* Container avec navigation */}
              <div className="relative">
                {/* Bouton Gauche */}
                <button
                  onClick={() => scrollVideos('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={videoScroll === 0}
                >
                  <svg className="w-6 h-6 text-[#4DB8A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Bouton Droite */}
                <button
                  onClick={() => scrollVideos('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6 text-[#4DB8A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Container vidéos - SANS barre de défilement */}
                <div 
                  id="videos-container"
                  className="overflow-x-auto scrollbar-hide scroll-smooth px-12"
                  style={{ 
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none' // IE/Edge
                  }}
                >
                  <div className="flex space-x-6">
                    {youtubeVideos.map((video, index) => (
                      <div 
                        key={index}
                        className="flex-none w-[380px]"
                      >
                        <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                          <div className="aspect-video relative group">
                            <iframe
                              src={`https://www.youtube.com/embed/${video.id}`}
                              title={video.title}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none"></div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-gray-900">{video.title}</h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Indicateurs de position (optionnel) */}
              <div className="flex justify-center space-x-2 mt-8">
                {youtubeVideos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      Math.floor(videoScroll / 400) === idx 
                        ? 'w-8 bg-[#4DB8A8]' 
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {medicalServices.map((service, idx) => (
              <div key={idx} className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </section>

      {/* Accommodation Section - HIGHLIGHT */}
      <section id="hebergement" className="py-20 bg-gradient-to-br from-[#4DB8A8]/5 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full mb-4 shadow-md">
              <span className="text-xl">🏠</span>
              <span className="text-sm font-medium text-[#4DB8A8]">Hébergement Tout Compris</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Votre confort, notre priorité
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Nous gérons votre hébergement pendant toute la durée de vos soins médicaux
            </p>
            <div className="inline-flex items-center space-x-6 bg-white px-8 py-4 rounded-2xl shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4DB8A8]">📅 Court séjour</div>
                <div className="text-sm text-gray-600 mt-1">Location journalière</div>
              </div>
              <div className="h-12 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4DB8A8]">🏡 Long séjour</div>
                <div className="text-sm text-gray-600 mt-1">Jusqu'à plusieurs mois</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {accommodationTypes.map((type, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className="text-6xl mb-6">{type.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{type.title}</h3>
                <p className="text-gray-600 mb-6">{type.description}</p>
                <div className="space-y-3">
                  {type.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-center space-x-2">
                      <span className="text-[#4DB8A8]">✓</span>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Pourquoi choisir nos hébergements ?
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "📍", title: "Proximité", desc: "À 5-10 min des cliniques" },
                { icon: "💰", title: "Prix inclus", desc: "Pas de frais cachés" },
                { icon: "🔒", title: "Sécurisé", desc: "Quartiers sûrs et surveillés" },
                { icon: "🧳", title: "Clé en main", desc: "Tout est prêt à votre arrivée" },
                { icon: "🍳", title: "Équipé", desc: "Cuisine, wifi, literie" },
                { icon: "🚖", title: "Transport", desc: "Transferts inclus" },
                { icon: "🌟", title: "Confort", desc: "Standards internationaux" },
                { icon: "📞", title: "Assistance", desc: "Support 24/7" }
              ].map((benefit, idx) => (
                <div key={idx} className="text-center p-4">
                  <div className="text-4xl mb-3">{benefit.icon}</div>
                  <div className="font-bold text-gray-900 mb-1">{benefit.title}</div>
                  <div className="text-sm text-gray-600">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Complete Journey Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Votre parcours en 5 étapes
            </h2>
            <p className="text-xl text-gray-600">
              De la première consultation à votre retour, nous sommes à vos côtés
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { step: "1", icon: "📋", title: "Consultation", desc: "Évaluation de vos besoins médicaux" },
              { step: "2", icon: "🏠", title: "Hébergement", desc: "Réservation de votre logement" },
              { step: "3", icon: "✈️", title: "Voyage", desc: "Organisation des transferts" },
              { step: "4", icon: "🏥", title: "Soins", desc: "Accompagnement médical" },
              { step: "5", icon: "📊", title: "Suivi", desc: "Suivi post-opératoire" }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-gradient-to-br from-[#4DB8A8]/10 to-blue-50 rounded-2xl p-6 text-center hover:shadow-xl transition-all">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#4DB8A8] text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div className="text-4xl mb-4 mt-2">{item.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                {idx < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-[#4DB8A8]/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="temoignages" className="py-20 bg-gradient-to-br from-[#4DB8A8]/10 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full mb-4 shadow-md">
              <span className="text-xl">⭐</span>
              <span className="text-sm font-medium text-[#4DB8A8]">Témoignages</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez les expériences de nos patients satisfaits
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-12">
              <div className="flex items-start space-x-2 mb-6">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <span key={i} className="text-2xl text-yellow-400">⭐</span>
                ))}
              </div>
              
              <p className="text-2xl text-gray-800 leading-relaxed mb-8 italic">
                "{testimonials[activeTestimonial].text}"
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-gray-900">
                    {testimonials[activeTestimonial].name}
                  </div>
                  <div className="text-gray-600">
                    {testimonials[activeTestimonial].location}
                  </div>
                  <div className="text-sm text-[#4DB8A8] mt-1">
                    {testimonials[activeTestimonial].treatment}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTestimonial(idx)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        idx === activeTestimonial ? 'bg-[#4DB8A8] w-8' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
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
            Prêt à commencer votre parcours santé ?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Rejoignez des milliers de patients qui nous font confiance pour leurs soins médicaux à l'étranger
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription">
              <button className="px-10 py-4 bg-white text-[#4DB8A8] font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all">
                Créer mon compte
              </button>
            </Link>
            <a href="#contact">
              <button className="px-10 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                Nous contacter
              </button>
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Bouton WhatsApp Fixe */}
      <a
        href="https://wa.me/212673623053"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Contactez-nous sur WhatsApp"
      >
        <div className="relative">
          {/* Effet de pulsation */}
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
          
          {/* Bouton principal */}
          <div className="relative bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </div>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
            Contactez-nous sur WhatsApp
            <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </a>
    </div>
  );
}