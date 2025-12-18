import React, { useState, useCallback, memo } from 'react';
import { parseCSV, toGameFormData, type ParsedMatch } from '../utils/csvImport';
import type { GameFormData } from '../types';

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (matches: GameFormData[]) => void;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = memo(({ isOpen, onClose, onImport }) => {
    const [csvContent, setCsvContent] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string>('SENIOR M1');
    const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([]);
    const [errors, setErrors] = useState<{ line: number; content: string; error: string }[]>([]);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [isEnriching, setIsEnriching] = useState(false);

    // Parse from CSV/paste
    const handleParse = useCallback(() => {
        const result = parseCSV(csvContent, selectedTeam);
        setParsedMatches(result.success);
        setErrors(result.errors);
        if (result.success.length > 0) {
            setStep('preview');
        }
    }, [csvContent, selectedTeam]);

    // Enrich locations with Nominatim
    const handleEnrichLocations = useCallback(async () => {
        setIsEnriching(true);
        const updatedMatches = [...parsedMatches];
        const matchesToEnrich = updatedMatches
            .map((m, i) => ({ match: m, index: i }))
            .filter(({ match }) => !match.isHome && (match.location === 'Extérieur' || match.location.startsWith('Extérieur (')));

        const CHUNK_SIZE = 3;

        for (let i = 0; i < matchesToEnrich.length; i += CHUNK_SIZE) {
            const chunk = matchesToEnrich.slice(i, i + CHUNK_SIZE);

            await Promise.all(chunk.map(async ({ match, index }) => {
                let cityName = '';
                const cityMatch = match.location.match(/Extérieur \((.+)\)/i);

                if (cityMatch) cityName = cityMatch[1];
                else return;

                if (!cityName) return;

                const cityNameLower = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                try {
                    const queries = [
                        `gymnase ${cityName}`,
                        `salle polyvalente ${cityName}`,
                        `complexe sportif ${cityName}`,
                        `stade ${cityName}`,
                        `${cityName}` // Fallback generic
                    ];

                    const candidates: string[] = [];
                    const seenAddresses = new Set<string>();

                    for (const query of queries) {
                        try {
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/search?` +
                                `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=3&countrycodes=fr`,
                                { headers: { 'Accept-Language': 'fr' } }
                            );
                            const results = await response.json();

                            for (const result of results) {
                                const addr = result.address || {};
                                const resultCity = (addr.city || addr.town || addr.village || addr.municipality || '').toLowerCase();
                                const resultCityNorm = resultCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                                // Loose matching
                                if (resultCityNorm.includes(cityNameLower) || cityNameLower.includes(resultCityNorm)) {
                                    const name = result.name || 'Gymnase / Salle';
                                    const street = addr.road || addr.pedestrian || '';
                                    const houseNumber = addr.house_number || '';
                                    const postcode = addr.postcode || '';
                                    const city = addr.city || addr.town || addr.village || cityName;

                                    const fullAddress = [
                                        name,
                                        [houseNumber, street].filter(Boolean).join(' '),
                                        [postcode, city].filter(Boolean).join(' ')
                                    ].filter(Boolean).join(', ');

                                    if (!seenAddresses.has(fullAddress)) {
                                        seenAddresses.add(fullAddress);
                                        candidates.push(fullAddress);
                                    }
                                }
                            }
                        } catch (e) { /* ignore */ }
                    }

                    if (candidates.length > 0) {
                        // Default to first one BUT keep candidates for user choice
                        updatedMatches[index] = {
                            ...match,
                            location: candidates[0],
                            candidates: candidates
                        };
                    } else {
                        updatedMatches[index] = { ...match, location: `À ${cityName} (adresse introuvable)` };
                    }
                } catch (err) {
                    console.error("Failed to fetch address for", cityName, err);
                }
            }));

            setParsedMatches([...updatedMatches]);
            if (i + CHUNK_SIZE < matchesToEnrich.length) await new Promise(r => setTimeout(r, 600));
        }

        setIsEnriching(false);
    }, [parsedMatches]);

    const handleImport = useCallback(() => {
        const gameData = parsedMatches.map(toGameFormData);
        onImport(gameData);
        handleClose();
    }, [parsedMatches, onImport]);

    const handleClose = useCallback(() => {
        setCsvContent('');
        setParsedMatches([]);
        setErrors([]);
        setStep('input');
        setIsEnriching(false);
        onClose();
    }, [onClose]);

    if (!isOpen) return null;

    const teams = [
        "SENIOR M1", "SENIOR M2",
        "U18 M1", "U18 M2",
        "U15 M1", "U15 M2",
        "U13 M1",
        "U11 M1", "U11 M2",
        "U9 M1"
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        📥 Importer des matchs
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                        Copier-coller depuis le calendrier équipe FFBB
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {step === 'input' ? (
                        <>
                            {/* Team Selector */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Équipe concernée
                                </label>
                                <select
                                    value={selectedTeam}
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                    className="w-full p-2 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                                >
                                    {teams.map(team => (
                                        <option key={team} value={team}>{team}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Instructions */}
                            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-600 font-medium mb-2">📋 Instructions :</p>
                                <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                                    <li>Allez sur la page FFBB de l'équipe</li>
                                    <li>Sélectionnez le tableau des matchs (calendrier équipe)</li>
                                    <li>Copiez (Ctrl+C) et collez ci-dessous (Ctrl+V)</li>
                                </ul>
                            </div>

                            {/* Textarea */}
                            <textarea
                                value={csvContent}
                                onChange={(e) => setCsvContent(e.target.value)}
                                placeholder="Collez le tableau FFBB ici..."
                                className="w-full h-40 p-4 border-2 border-slate-200 rounded-xl font-mono text-sm
                                         focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                         resize-none"
                            />

                            {/* Errors */}
                            {errors.length > 0 && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Erreurs :</p>
                                    <ul className="text-xs text-red-600 space-y-1">
                                        {errors.map((err, i) => (
                                            <li key={i}>{err.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Preview */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-sm font-semibold text-slate-700">
                                        ✅ {parsedMatches.length} match(s) détecté(s)
                                    </p>

                                    <button
                                        onClick={handleEnrichLocations}
                                        disabled={isEnriching}
                                        className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg 
                                                 hover:bg-indigo-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {isEnriching ? <>⏳ Recherche...</> : <>🔍 Trouver les gymnases</>}
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {parsedMatches.map((match, i) => (
                                        <div
                                            key={i}
                                            className={`p-3 rounded-xl border ${match.isHome
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-blue-50 border-blue-200'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${match.isHome
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-blue-500 text-white'
                                                    }`}>
                                                    {match.isHome ? '🏠 DOM' : '🚗 EXT'}
                                                </span>
                                                <span className="ml-2 font-semibold text-slate-800">{match.team}</span>
                                                <span className="text-slate-500 mx-2">vs</span>
                                                <span className="font-medium text-slate-700">{match.opponent}</span>
                                            </div>
                                            <div className="mt-2 flex flex-col gap-1">
                                                <div className="text-xs text-slate-500">
                                                    📅 {match.date} à {match.time}
                                                </div>

                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-lg">📍</span>
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={match.location}
                                                            onChange={(e) => {
                                                                const newMatches = [...parsedMatches];
                                                                newMatches[i] = { ...match, location: e.target.value };
                                                                setParsedMatches(newMatches);
                                                            }}
                                                            className="w-full text-xs p-1.5 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                                                            placeholder="Adresse du match"
                                                        />

                                                        {match.candidates && match.candidates.length > 1 && (
                                                            <div className="flex gap-1 flex-wrap mt-1">
                                                                {match.candidates.map((cand, cIdx) => (
                                                                    <button
                                                                        key={cIdx}
                                                                        onClick={() => {
                                                                            const newMatches = [...parsedMatches];
                                                                            newMatches[i] = { ...match, location: cand };
                                                                            setParsedMatches(newMatches);
                                                                        }}
                                                                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors text-left truncate max-w-full
                                                                            ${match.location === cand
                                                                                ? 'bg-blue-100 border-blue-400 text-blue-800'
                                                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                                                        title={cand}
                                                                    >
                                                                        {cand.split(',')[0]}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    {step === 'preview' && (
                        <button
                            onClick={() => setStep('input')}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            ← Retour
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Annuler
                    </button>
                    {step === 'input' ? (
                        <button
                            onClick={handleParse}
                            disabled={!csvContent.trim()}
                            className="px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all
                                      disabled:opacity-50 disabled:cursor-not-allowed
                                      bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        >
                            Analyser →
                        </button>
                    ) : (
                        <button
                            onClick={handleImport}
                            className="px-6 py-2 text-sm font-bold text-white 
                                     bg-gradient-to-r from-green-500 to-emerald-500 
                                     hover:from-green-600 hover:to-emerald-600
                                     rounded-xl shadow-md hover:shadow-lg transition-all"
                        >
                            ✓ Importer {parsedMatches.length} match(s)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

ImportCSVModal.displayName = 'ImportCSVModal';

export default ImportCSVModal;
