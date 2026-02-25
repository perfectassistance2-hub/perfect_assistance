"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/images/logo_perfect.jpeg"
                alt="Perfect Assistance"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="font-bold text-lg">PERFECT ASSISTANCE</span>
            </div>
            <p className="text-gray-400 text-sm">
              Votre sécurité, notre priorité.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Nos Services</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/tourisme-medical" className="hover:text-[#4DB8A8] transition-colors">
                  Evacuation médicale
                </Link>
              </li>
              {/*<li>
                <Link href="/representation-commerciale" className="hover:text-[#4DB8A8] transition-colors">
                  Représentation commerciale
                </Link>
              </li>
              <li>
                <Link href="/accompagnement-diaspora" className="hover:text-[#4DB8A8] transition-colors">
                  Accompagnement diaspora
                </Link>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#4DB8A8] transition-colors">
                  Nous contacter
                </a>
              </li>*/}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Entreprise</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-[#4DB8A8] transition-colors">
                  À propos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#4DB8A8] transition-colors">
                  Notre équipe
                </a>
              </li>
              <li>
                <a href="#temoignages" className="hover:text-[#4DB8A8] transition-colors">
                  Témoignages
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#4DB8A8] transition-colors">
                  Nos partenaires
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>📧 Mail : direction@perfectassistance.fr</li>
              <li>📞 +212 673-623053</li>
              <li>📍 Rabat, Maroc</li>
              <li className="pt-2">
                <div className="flex space-x-3">
                  {/*<a href="#" className="hover:text-[#4DB8A8] transition-colors">
                    LinkedIn
                  </a>*/}
                  <a href="https://www.facebook.com/PerfectAssistance" className="hover:text-[#4DB8A8] transition-colors">
                    Facebook
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Perfect Assistance. Tous droits réservés.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-[#4DB8A8] transition-colors text-sm">
              Confidentialité
            </a>
            <a href="#" className="text-gray-400 hover:text-[#4DB8A8] transition-colors text-sm">
              CGU
            </a>
            <a href="#" className="text-gray-400 hover:text-[#4DB8A8] transition-colors text-sm">
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}