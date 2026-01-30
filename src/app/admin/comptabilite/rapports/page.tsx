// app/admin/comptabilite/rapports/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";

type TypeRapport = "mensuel" | "trimestriel" | "annuel" | "personnalise";

export default function RapportsPage() {
  const [typeRapport, setTypeRapport] = useState<TypeRapport>("mensuel");
  const [mois, setMois] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [trimestre, setTrimestre] = useState("1");
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeGraphiques, setIncludeGraphiques] = useState(true);

  const handleGenererRapport = async () => {
    setLoading(true);

    try {
      let params = new URLSearchParams();
      params.append("type", typeRapport);
      params.append("includeDetails", includeDetails.toString());
      params.append("includeGraphiques", includeGraphiques.toString());

      switch (typeRapport) {
        case "mensuel":
          params.append("mois", mois);
          break;
        case "trimestriel":
          params.append("trimestre", trimestre);
          params.append("annee", annee);
          break;
        case "annuel":
          params.append("annee", annee);
          break;
        case "personnalise":
          if (!dateDebut || !dateFin) {
            alert("Veuillez sélectionner une période");
            setLoading(false);
            return;
          }
          params.append("dateDebut", dateDebut);
          params.append("dateFin", dateFin);
          break;
      }

      // Appel API pour générer le rapport
      const response = await fetch(`/api/admin/comptabilite/rapports?${params.toString()}`);
      
      if (!response.ok) throw new Error("Erreur génération rapport");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-${typeRapport}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("✅ Rapport généré avec succès !");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);

    try {
      let params = new URLSearchParams();
      params.append("format", "excel");
      params.append("type", typeRapport);

      switch (typeRapport) {
        case "mensuel":
          params.append("mois", mois);
          break;
        case "trimestriel":
          params.append("trimestre", trimestre);
          params.append("annee", annee);
          break;
        case "annuel":
          params.append("annee", annee);
          break;
        case "personnalise":
          if (!dateDebut || !dateFin) {
            alert("Veuillez sélectionner une période");
            setLoading(false);
            return;
          }
          params.append("dateDebut", dateDebut);
          params.append("dateFin", dateFin);
          break;
      }

      const response = await fetch(`/api/admin/comptabilite/rapports?${params.toString()}`);
      
      if (!response.ok) throw new Error("Erreur export Excel");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-${typeRapport}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("✅ Export Excel généré avec succès !");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/admin/comptabilite" className="hover:text-[#4DB8A8]">
            Comptabilité
          </Link>
          <span>/</span>
          <span className="text-gray-900">Rapports</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Génération de rapports</h1>
        <p className="text-gray-600 mt-2">
          Créez des rapports détaillés au format PDF ou Excel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Type de rapport */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📅 Type de rapport</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setTypeRapport("mensuel")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  typeRapport === "mensuel"
                    ? "border-[#4DB8A8] bg-[#4DB8A8] text-white"
                    : "border-gray-200 hover:border-[#4DB8A8]"
                }`}
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="font-semibold text-sm">Mensuel</div>
              </button>

              <button
                onClick={() => setTypeRapport("trimestriel")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  typeRapport === "trimestriel"
                    ? "border-[#4DB8A8] bg-[#4DB8A8] text-white"
                    : "border-gray-200 hover:border-[#4DB8A8]"
                }`}
              >
                <div className="text-2xl mb-2">📆</div>
                <div className="font-semibold text-sm">Trimestriel</div>
              </button>

              <button
                onClick={() => setTypeRapport("annuel")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  typeRapport === "annuel"
                    ? "border-[#4DB8A8] bg-[#4DB8A8] text-white"
                    : "border-gray-200 hover:border-[#4DB8A8]"
                }`}
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold text-sm">Annuel</div>
              </button>

              <button
                onClick={() => setTypeRapport("personnalise")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  typeRapport === "personnalise"
                    ? "border-[#4DB8A8] bg-[#4DB8A8] text-white"
                    : "border-gray-200 hover:border-[#4DB8A8]"
                }`}
              >
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-semibold text-sm">Personnalisé</div>
              </button>
            </div>
          </div>

          {/* Sélection période */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⏰ Période</h2>

            {typeRapport === "mensuel" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner le mois
                </label>
                <input
                  type="month"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={mois}
                  onChange={(e) => setMois(e.target.value)}
                />
              </div>
            )}

            {typeRapport === "trimestriel" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trimestre
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                    value={trimestre}
                    onChange={(e) => setTrimestre(e.target.value)}
                  >
                    <option value="1">T1 (Jan - Mar)</option>
                    <option value="2">T2 (Avr - Juin)</option>
                    <option value="3">T3 (Juil - Sep)</option>
                    <option value="4">T4 (Oct - Déc)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                    value={annee}
                    onChange={(e) => setAnnee(e.target.value)}
                  />
                </div>
              </div>
            )}

            {typeRapport === "annuel" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                />
              </div>
            )}

            {typeRapport === "personnalise" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DB8A8]"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Options du rapport</h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-[#4DB8A8] border-gray-300 rounded focus:ring-[#4DB8A8]"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                />
                <div>
                  <div className="font-medium text-gray-900">Détails des transactions</div>
                  <div className="text-sm text-gray-600">
                    Inclure la liste complète des paiements
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-[#4DB8A8] border-gray-300 rounded focus:ring-[#4DB8A8]"
                  checked={includeGraphiques}
                  onChange={(e) => setIncludeGraphiques(e.target.checked)}
                />
                <div>
                  <div className="font-medium text-gray-900">Graphiques et statistiques</div>
                  <div className="text-sm text-gray-600">
                    Inclure les graphiques d'évolution et répartition
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Colonne droite - Aperçu et actions */}
        <div className="space-y-6">
          {/* Aperçu */}
          <div className="bg-gradient-to-br from-[#4DB8A8] to-[#3DA391] rounded-lg shadow-lg p-6 text-white sticky top-6">
            <h3 className="text-xl font-bold mb-4">📄 Aperçu du rapport</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Type:</span>
                <span className="font-semibold capitalize">{typeRapport}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Période:</span>
                <span className="font-semibold">
                  {typeRapport === "mensuel" && new Date(mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  {typeRapport === "trimestriel" && `T${trimestre} ${annee}`}
                  {typeRapport === "annuel" && annee}
                  {typeRapport === "personnalise" && dateDebut && dateFin && `${new Date(dateDebut).toLocaleDateString("fr-FR")} - ${new Date(dateFin).toLocaleDateString("fr-FR")}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Détails:</span>
                <span className="font-semibold">{includeDetails ? "Oui" : "Non"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Graphiques:</span>
                <span className="font-semibold">{includeGraphiques ? "Oui" : "Non"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGenererRapport}
                disabled={loading}
                className="w-full bg-white text-[#4DB8A8] py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Génération..." : "📥 Générer PDF"}
              </button>

              <button
                onClick={handleExportExcel}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Export..." : "📊 Exporter Excel"}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Informations</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Les rapports incluent tous les paiements de la période</li>
              <li>• Les commissions sont calculées automatiquement</li>
              <li>• Les graphiques sont générés en temps réel</li>
              <li>• Format PDF optimisé pour impression</li>
              <li>• Export Excel pour analyse approfondie</li>
            </ul>
          </div>

          {/* Rapports rapides */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">⚡ Rapports rapides</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setTypeRapport("mensuel");
                  setMois(new Date().toISOString().substring(0, 7));
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                📅 Mois en cours
              </button>
              <button
                onClick={() => {
                  setTypeRapport("annuel");
                  setAnnee(new Date().getFullYear().toString());
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                📊 Année en cours
              </button>
              <button
                onClick={() => {
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  setTypeRapport("mensuel");
                  setMois(lastMonth.toISOString().substring(0, 7));
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                📆 Mois dernier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}