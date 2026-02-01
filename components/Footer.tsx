import React, { useState, memo } from 'react';

const APP_VERSION = 'v2.3.1';
// Changelog data
const CHANGELOG = [
    {
        version: "v2.3.1",
        date: "01/02/2026",
        changes: [
            "🐛 Fix : Affichage Timeline (Animation)",
            "🚀 Perf : Bundle optimisé (-27%)"
        ]
    },
    {
        version: "v2.3.0",
        date: "01/02/2026",
        changes: [
            "🚗 Matching Covoiturage : Demande de place & Acceptation",
            "✨ UI Premium : Animations Framer Motion",
            "🔔 Suggestions automatiques de conducteurs"
        ]
    },
    {
        version: "v2.2.1",
        date: "27/01/2026",
        changes: [
            "🔧 Maintenance : Conformité LTS (Node 24 Types)"
        ]
    },
    {
        version: "v2.2.0",
        date: "27/01/2026",
        changes: [
            "⚡ Core : Mise à jour Node.js v24 LTS",
            "📦 Deps : Refresh complet des dépendances",
            "🔒 Security : Audit validé (0 vulnérabilité)"
        ]
    },
    {
        version: "v2.1.0",
        date: "22/01/2026",
        changes: [
            "🔒 Security : Audit validé & clés sécurisées",
            "🎨 UI : Icônes SVG & bouton Annuler compact",
            "🚀 Deploy : Configuration Coolify optimisée"
        ]
    },
    { version: 'v2.0.0', date: '18/01/2026', changes: ['🚀 Major Update : UI/UX Pro Max', '📢 Broadcast : Système d\'annonces', '🙋‍♂️ Dashboard : Espace bénévole modernisé'] },
    { version: 'v1.11.0', date: '17/01/2026', changes: ['✨ UI : Restauration du design "Pilule" centré', '📱 UX : Bouton "Aujourd\'hui" large et accessible', '💎 Design : Effets de flou et ombres optimisés'] },
    { version: 'v1.10.5', date: '17/01/2026', changes: ['📱 Mobile UX : Flèches de navigation agrandies', '📝 Lisibilité : Bouton "Aujourd\'hui" toujours visible'] },
    { version: 'v1.10.4', date: '17/01/2026', changes: ['📉 UI : Navigation compacte (Gain espace vertical)', '✨ Design minimaliste'] },
    { version: 'v1.10.3', date: '17/01/2026', changes: ['🚗 Covoiturage Intelligent : Badges de statut (Urgence/Dispo)', '👀 Visibilité immédiate des demandes'] },
    { version: 'v1.10.2', date: '17/01/2026', changes: ['🚀 Perf : Optimisation chargement polices (-50% poids)', '📱 Meilleure réactivité réseau'] },
    { version: 'v1.10.1', date: '17/01/2026', changes: ['✨ Badge COMPLET flashy', '🎨 Overlay bordures robuste', '🌔 Filigranes visibles Dark Mode'] },
    { version: 'v1.10.0', date: '17/01/2026', changes: ['🎨 Dark mode amélioré', '🏠 Filigranes maison/avion', '🔲 Badge matchs centré'] },
    { version: 'v1.9.9', date: '17/01/2026', changes: ['⚡ React 18 startTransition : changement de vue non-bloquant'] },
    { version: 'v1.9.8', date: '17/01/2026', changes: ['⚡ Interface snappy : animations réduites, transitions instantanées'] },
    { version: 'v1.9.7', date: '17/01/2026', changes: ['📅 Vue semaine par défaut', '🔘 Bouton Liste/Semaine clair', '🕒 Matchs passés masqués'] },
    { version: 'v1.9.6', date: '16/01/2026', changes: ['✨ Badge "Complet" célébration : gradient vert, animation shine'] },
    { version: 'v1.9.5', date: '16/01/2026', changes: ['📊 Dashboard Admin : Section urgences, filtres, détail des rôles manquants'] },
    { version: 'v1.9.4', date: '09/01/2026', changes: ['🧮 Amélioration : Compteur bénévoles "utile" (Postes pourvus)'] },
    { version: 'v1.9.3', date: '09/01/2026', changes: ['🔍 SEO : Google Analytics & Sitemap'] },
    { version: 'v1.9.2', date: '09/01/2026', changes: ['📅 Correctif : Affichage date calendrier mobile'] },
    { version: 'v1.9.1', date: '09/01/2026', changes: ['🦟 Correctif : Fond blanc en mode sombre fixé'] },
    { version: 'v1.9.0', date: '09/01/2026', changes: ['🎨 UI/UX Premium (Refonte GameCard)', '🖱️ Drag-to-Scroll Desktop', '🏎️ Tri Intelligent & Indicateur Urgence'] },
    { version: 'v1.8.0', date: '08/01/2026', changes: ['📅 Vue Planning interactive complète (Inscriptions, Covoiturage, Calendrier)', '🚗 Badge covoiturage détaillé (Conducteurs/Passagers)', '🗑️ Icônes de suppression uniformisées', '✨ Correctifs de notifications en doublon'] },
    { version: 'v1.7.0', date: '08/01/2026', changes: ['🎨 Refonte visuelle de la vue Planning (Dark Mode premium)', '📍 Intégration liens Waze pour les matchs à l\'extérieur', '⏱️ Affichage des horaires et lieux complets dans le calendrier'] },
    { version: 'v1.6.0', date: '01/01/2025', changes: ['🚗 Gestion complète du covoiturage dans "Mon Espace Bénévole"', '💡 Affichage des opportunités de covoiturage', '📞 Bouton "Contacter" le conducteur'] },
];

const Footer: React.FC = memo(() => {
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);

    return (
        <footer className="mt-20 py-10 border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto px-4">
                {/* Main Footer Content */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left: Copyright */}
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                        Fait avec <span className="text-red-500 animate-pulse">❤️</span> pour le Stade Clermontois Basket Auvergne - 2025
                    </p>

                    {/* Right: Version & Links */}
                    <div className="flex items-center gap-4">
                        {/* Version Badge with Changelog Toggle */}
                        <button
                            onClick={() => setIsChangelogOpen(!isChangelogOpen)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 
                                     text-slate-600 text-xs font-mono font-bold rounded-full transition-colors group"
                            title="Voir le changelog"
                        >
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {APP_VERSION}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className={`w-3 h-3 transition-transform ${isChangelogOpen ? 'rotate-180' : ''}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {/* GitHub Link */}
                        <a
                            href="https://github.com/nickdesi/SCBA-Benevolat"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 
                                     text-white text-xs font-bold rounded-full transition-all hover:scale-105 shadow-md"
                            title="Voir sur GitHub"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                            </svg>
                            GitHub
                        </a>
                    </div>
                </div>

                {/* Changelog Dropdown */}
                {isChangelogOpen && (
                    <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in-up max-w-xl mx-auto">
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <span>📋</span> Changelog
                        </h4>
                        <div className="space-y-3">
                            {CHANGELOG.map((release) => (
                                <div key={release.version} className="text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono font-bold text-slate-700">{release.version}</span>
                                        <span className="text-slate-400 text-xs">• {release.date}</span>
                                    </div>
                                    <ul className="text-slate-500 text-xs space-y-0.5 ml-4">
                                        {release.changes.map((change, idx) => (
                                            <li key={idx}>{change}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </footer>
    );
});

Footer.displayName = 'Footer';

export default Footer;
