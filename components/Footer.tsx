import React, { useState, memo } from 'react';

const APP_VERSION = 'v1.5.0';

const CHANGELOG = [
    { version: 'v1.5.0', date: '31/12/2025', changes: ['📊 Dashboard Admin avec stats de remplissage', '🔔 Système de notifications PWA', '🔍 SEO Événementiel (JSON-LD)'] },
    { version: 'v1.4.0', date: '31/12/2025', changes: ['🔄 Transactions Firestore pour une fiabilité maximale', '📱 Navigation mobile avec bouton Planning direct'] },
    { version: 'v1.3.0', date: '27/12/2025', changes: ['👤 Mon Espace Bénévole (Modale profil)', '🔑 Authentification Email & Google'] },
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
                    <div className="mt-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-lg animate-fade-in-up max-w-xl mx-auto">
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
