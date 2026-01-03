import React, { useState, useCallback, memo } from 'react';
import { parseCSV, toGameFormData, type ParsedMatch } from '../utils/csvImport';
import { scrapeFFBBUrl, isDuplicateMatch } from '../utils/ffbbImport';
import type { GameFormData, Game } from '../types';

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (matches: GameFormData[]) => void;
    existingGames: Game[];
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = memo(({ isOpen, onClose, onImport, existingGames = [] }) => {
    const [mode, setMode] = useState<'text' | 'url'>('text');
    const [csvContent, setCsvContent] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string>('SENIOR M1');
    const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([]);
    const [duplicatesCount, setDuplicatesCount] = useState(0);
    const [errors, setErrors] = useState<{ line: number; content: string; error: string }[]>([]);
    const [step, setStep] = useState<'selection' | 'input' | 'preview'>('selection');
    const [isEnriching, setIsEnriching] = useState(false);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);

    // Initial Selection Handlers
    const handleSelectMode = (selectedMode: 'text' | 'url') => {
        setMode(selectedMode);
        setStep('input');
        setErrors([]);
    };

    // Parse from CSV/paste with Deduplication
    const handleParseText = useCallback(() => {
        const result = parseCSV(csvContent, selectedTeam);

        const newMatches: ParsedMatch[] = [];
        let dupCount = 0;

        result.success.forEach(match => {
            if (isDuplicateMatch(match, existingGames)) {
                dupCount++;
            } else {
                newMatches.push(match);
            }
        });

        setParsedMatches(newMatches);
        setDuplicatesCount(dupCount);
        setErrors(result.errors);

        if (newMatches.length > 0 || dupCount > 0) {
            setStep('preview');
        }
    }, [csvContent, selectedTeam, existingGames]);

    // Scrape from URL
    const handleParseUrl = useCallback(async () => {
        setIsLoadingUrl(true);
        setErrors([]);
        try {
            const { matches, duplicates } = await scrapeFFBBUrl(urlInput, selectedTeam, existingGames);
            setParsedMatches(matches);
            setDuplicatesCount(duplicates);
            if (matches.length > 0 || duplicates > 0) {
                setStep('preview');
            } else {
                setErrors([{ line: 0, content: urlInput, error: "Aucun match trouvé ou format non reconnu." }]);
            }
        } catch (err: any) {
            setErrors([{ line: 0, content: urlInput, error: err.message || "Erreur lors de l'import URL." }]);
        } finally {
            setIsLoadingUrl(false);
        }
    }, [urlInput, selectedTeam, existingGames]);

    // Enrich locations with Nominatim + Data ES
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

                // Parallel fetch from multiple sources
                const fetchNominatim = async () => {
                    const results: string[] = [];
                    const queries = [
                        `gymnase ${cityName}`,
                        `salle polyvalente ${cityName}`,
                        `complexe sportif ${cityName}`,
                        `stade ${cityName}`,
                        `${cityName}`
                    ];

                    for (const query of queries) {
                        try {
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/search?` +
                                `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=3&countrycodes=fr`,
                                { headers: { 'Accept-Language': 'fr' } }
                            );
                            const data = await response.json();

                            for (const result of data) {
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

                                    results.push(fullAddress);
                                }
                            }
                        } catch (e) { /* ignore */ }
                        if (results.length > 0 && queries.indexOf(query) < 2) break;
                    }
                    return results;
                };

                const fetchDataES = async () => {
                    const results: string[] = [];
                    try {
                        // API Data ES: search for "Gymnase" + City Name
                        const response = await fetch(
                            `https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records?` +
                            `where=search(inst_nom, "${encodeURIComponent(cityName)}")` +
                            `%20OR%20search(equip_nom, "${encodeURIComponent(cityName)}")` +
                            `%20OR%20search(com_nom, "${encodeURIComponent(cityName)}")` +
                            `&limit=8`
                        );
                        const data = await response.json();

                        if (data.results) {
                            for (const record of data.results) {
                                const sports = record.aps_name || [];
                                const isBasket = sports.some((s: string) => s && s.toLowerCase().includes('basket'));

                                const recCity = (record.com_nom || record.lib_bdv || '').toLowerCase();
                                const recCityNorm = recCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                                if (recCityNorm.includes(cityNameLower) && (isBasket || record.equip_type_name?.includes('Gymnase') || record.equip_type_name?.includes('Salle multisports'))) {
                                    const name = record.equip_nom || record.inst_nom || 'Gymnase';
                                    const address = record.inst_adresse || '';
                                    const zip = record.inst_cp || '';
                                    const city = record.lib_bdv || record.com_nom || cityName;

                                    const fullAddress = [name, address, `${zip} ${city}`].filter(Boolean).join(', ');
                                    results.push(fullAddress);
                                }
                            }
                        }
                    } catch (e) { console.error('Data ES error', e); }
                    return results;
                };

                const [nominatimResults, dataEsResults] = await Promise.all([
                    fetchNominatim(),
                    fetchDataES()
                ]);

                // Merge and dedup
                const candidates = Array.from(new Set([...dataEsResults, ...nominatimResults]));

                if (candidates.length > 0) {
                    updatedMatches[index] = {
                        ...match,
                        location: candidates[0],
                        candidates: candidates
                    };
                } else {
                    updatedMatches[index] = { ...match, location: `À ${cityName} (adresse introuvable)` };
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
        setUrlInput('');
        setParsedMatches([]);
        setErrors([]);
        setDuplicatesCount(0);
        setStep('selection'); // Reset to selection
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in-up flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        📥 Importer des matchs
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                        {step === 'selection' ? 'Choisissez une méthode d\'import' :
                            step === 'input' ? 'Saisissez les données' : 'Vérifiez les matchs détectés'}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'selection' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                            <button
                                onClick={() => handleSelectMode('text')}
                                className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-slate-200 rounded-2xl 
                                         hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg transition-all group"
                            >
                                <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="text-3xl">📋</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Copier-Coller</h3>
                                <p className="text-sm text-slate-500 text-center">
                                    Copiez le tableau depuis le site FFBB et collez-le ici.
                                </p>
                            </button>

                            <button
                                onClick={() => handleSelectMode('url')}
                                className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-slate-200 rounded-2xl 
                                         hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg transition-all group"
                            >
                                <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="text-3xl">🔗</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Lien URL</h3>
                                <p className="text-sm text-slate-500 text-center">
                                    Collez simplement l'URL du calendrier de l'équipe.
                                </p>
                            </button>
                        </div>
                    )}

                    {step === 'input' && (
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

                            {/* Input Area */}
                            {mode === 'url' ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <label className="block text-sm font-medium text-blue-800 mb-1">
                                            Lien du calendrier FFBB
                                        </label>
                                        <input
                                            type="url"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            placeholder="https://competitions.ffbb.com/..."
                                            className="w-full p-3 border border-blue-200 rounded-xl text-sm focus:border-blue-500 outline-none bg-white"
                                        />
                                        <p className="text-xs text-blue-600 mt-2">
                                            ℹ️ Copiez l'URL de la page "Rencontres" ou "Calendrier" de l'équipe sur le site competitions.ffbb.com
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-sm text-slate-600 font-medium mb-2">📋 Instructions :</p>
                                        <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                                            <li>Allez sur la page FFBB de l'équipe</li>
                                            <li>Sélectionnez le tableau des matchs</li>
                                            <li>Copiez (Ctrl+C) et collez ci-dessous (Ctrl+V)</li>
                                        </ul>
                                    </div>
                                    <textarea
                                        value={csvContent}
                                        onChange={(e) => setCsvContent(e.target.value)}
                                        placeholder="Collez le tableau FFBB ici..."
                                        className="w-full h-40 p-4 border-2 border-slate-200 rounded-xl font-mono text-sm
                                             focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                             resize-none"
                                    />
                                </>
                            )}

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
                    )}

                    {step === 'preview' && (
                        <>
                            {/* Preview */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                                    <div className="text-sm font-semibold text-slate-700">
                                        <span className="text-emerald-600">✅ {parsedMatches.length} nouveau(x)</span>
                                        {duplicatesCount > 0 && (
                                            <span className="text-amber-500 ml-2">
                                                (⚠️ {duplicatesCount} doublon{duplicatesCount > 1 ? 's' : ''} ignoré{duplicatesCount > 1 ? 's' : ''})
                                            </span>
                                        )}
                                    </div>

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
                                    {parsedMatches.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 italic">
                                            Aucun nouveau match à importer.
                                        </div>
                                    )}
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
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
                    {(step === 'input' || step === 'preview') && (
                        <button
                            onClick={() => setStep('selection')}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            ← Accueil Import
                        </button>
                    )}
                    {step !== 'selection' && step === 'preview' && (
                        <button
                            onClick={() => setStep('input')}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            ← Modifier
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Annuler
                    </button>
                    {step === 'input' && (
                        <button
                            onClick={mode === 'text' ? handleParseText : handleParseUrl}
                            disabled={mode === 'text' ? !csvContent.trim() : !urlInput.trim() || isLoadingUrl}
                            className="px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all
                                      disabled:opacity-50 disabled:cursor-not-allowed
                                      bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600
                                      flex items-center gap-2"
                        >
                            {isLoadingUrl ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Chargement...
                                </>
                            ) : (
                                <>Analyser →</>
                            )}
                        </button>
                    )}
                    {step === 'preview' && (
                        <button
                            onClick={handleImport}
                            disabled={parsedMatches.length === 0}
                            className="px-6 py-2 text-sm font-bold text-white 
                                     bg-gradient-to-r from-green-500 to-emerald-500 
                                     hover:from-green-600 hover:to-emerald-600
                                     rounded-xl shadow-md hover:shadow-lg transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
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
