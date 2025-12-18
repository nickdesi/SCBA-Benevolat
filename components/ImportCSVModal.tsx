import React, { useState, useCallback, memo } from 'react';
import { parseCSV, toGameFormData, type ParsedMatch } from '../utils/csvImport';
import { parseFFBBTeamPage, isValidFFBBUrl } from '../utils/ffbbScraper';
import type { GameFormData } from '../types';

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (matches: GameFormData[]) => void;
}

type ImportMode = 'paste' | 'ffbb';

const ImportCSVModal: React.FC<ImportCSVModalProps> = memo(({ isOpen, onClose, onImport }) => {
    const [importMode, setImportMode] = useState<ImportMode>('paste');
    const [csvContent, setCsvContent] = useState('');
    const [ffbbUrl, setFfbbUrl] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string>('SENIOR M1');
    const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([]);
    const [errors, setErrors] = useState<{ line: number; content: string; error: string }[]>([]);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [isEnriching, setIsEnriching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

    // Parse from CSV/paste
    const handleParse = useCallback(() => {
        const result = parseCSV(csvContent, selectedTeam);
        setParsedMatches(result.success);
        setErrors(result.errors);
        if (result.success.length > 0) {
            setStep('preview');
        }
    }, [csvContent, selectedTeam]);

    // Parse from FFBB URL
    const handleFetchFFBB = useCallback(async () => {
        if (!isValidFFBBUrl(ffbbUrl)) {
            setErrors([{ line: 0, content: ffbbUrl, error: 'URL FFBB invalide' }]);
            return;
        }

        setIsLoading(true);
        setErrors([]);
        setLoadingProgress({ current: 0, total: 0 });

        try {
            const result = await parseFFBBTeamPage(
                ffbbUrl,
                selectedTeam,
                (current, total) => setLoadingProgress({ current, total })
            );

            setParsedMatches(result.success);
            if (result.errors.length > 0) {
                setErrors(result.errors.map((e, i) => ({ line: i, content: '', error: e })));
            }
            if (result.success.length > 0) {
                setStep('preview');
            }
        } catch (err) {
            setErrors([{ line: 0, content: '', error: `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [ffbbUrl, selectedTeam]);

    // Enrich locations with Nominatim (for paste mode)
    const handleEnrichLocations = useCallback(async () => {
        setIsEnriching(true);
        const updatedMatches = [...parsedMatches];

        for (let i = 0; i < updatedMatches.length; i++) {
            const match = updatedMatches[i];
            const cityMatch = match.location.match(/Extérieur \((.+)\)/i);

            if (!match.isHome && cityMatch) {
                const cityName = cityMatch[1];
                const cityNameLower = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                try {
                    const queries = [
                        `palais des sports ${cityName}`,
                        `basket ${cityName}`,
                        `gymnase ${cityName}`,
                        `salle de sport ${cityName}`,
                        `complexe sportif ${cityName}`
                    ];

                    let bestResult = null;

                    for (const query of queries) {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/search?` +
                            `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=fr`,
                            { headers: { 'Accept-Language': 'fr' } }
                        );
                        const results = await response.json();

                        for (const result of results) {
                            const addr = result.address || {};
                            const resultCity = (addr.city || addr.town || addr.village || addr.municipality || '').toLowerCase();
                            const resultCityNorm = resultCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            const isMatch = resultCityNorm.startsWith(cityNameLower) ||
                                cityNameLower.startsWith(resultCityNorm) ||
                                resultCityNorm === cityNameLower;

                            if (isMatch && resultCityNorm.length > 0) {
                                bestResult = result;
                                break;
                            }
                        }

                        if (bestResult) break;
                        await new Promise(r => setTimeout(r, 300));
                    }

                    if (bestResult) {
                        const addr = bestResult.address;
                        const street = addr.road || addr.pedestrian || '';
                        const houseNumber = addr.house_number || '';
                        const postcode = addr.postcode || '';
                        const city = addr.city || addr.town || addr.village || cityName;
                        const name = bestResult.name || 'Gymnase';

                        const fullAddress = [
                            name,
                            [houseNumber, street].filter(Boolean).join(' '),
                            [postcode, city].filter(Boolean).join(' ')
                        ].filter(Boolean).join(', ');

                        updatedMatches[i] = { ...match, location: fullAddress };
                    } else {
                        updatedMatches[i] = { ...match, location: `À ${cityName} (adresse à confirmer)` };
                    }
                } catch (err) {
                    console.error("Failed to fetch address for", cityName, err);
                }
            }
        }

        setParsedMatches(updatedMatches);
        setIsEnriching(false);
    }, [parsedMatches]);

    const handleImport = useCallback(() => {
        const gameData = parsedMatches.map(toGameFormData);
        onImport(gameData);
        handleClose();
    }, [parsedMatches, onImport]);

    const handleClose = useCallback(() => {
        setCsvContent('');
        setFfbbUrl('');
        setParsedMatches([]);
        setErrors([]);
        setStep('input');
        setIsEnriching(false);
        setIsLoading(false);
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
                        Depuis FFBB ou copier-coller
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {step === 'input' ? (
                        <>
                            {/* Mode Tabs */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setImportMode('ffbb')}
                                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${importMode === 'ffbb'
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    🌐 URL FFBB (recommandé)
                                </button>
                                <button
                                    onClick={() => setImportMode('paste')}
                                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${importMode === 'paste'
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    📋 Copier-Coller
                                </button>
                            </div>

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

                            {/* FFBB URL Mode */}
                            {importMode === 'ffbb' && (
                                <>
                                    <div className="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                                        <p className="text-sm text-orange-700 font-medium mb-2">🔗 Import automatique :</p>
                                        <ul className="text-xs text-orange-600 list-disc list-inside space-y-1">
                                            <li>Collez l'URL de la page équipe FFBB</li>
                                            <li>L'app récupère automatiquement tous les matchs</li>
                                            <li>Les salles exactes sont extraites directement</li>
                                        </ul>
                                    </div>

                                    <input
                                        type="url"
                                        value={ffbbUrl}
                                        onChange={(e) => setFfbbUrl(e.target.value)}
                                        placeholder="https://competitions.ffbb.com/competitions/..."
                                        className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm
                                                 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                    />

                                    {isLoading && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                            <div className="flex items-center gap-3">
                                                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                                <span className="text-sm text-blue-700">
                                                    {loadingProgress.total > 0
                                                        ? `Récupération match ${loadingProgress.current}/${loadingProgress.total}...`
                                                        : 'Chargement de la page équipe...'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Paste Mode */}
                            {importMode === 'paste' && (
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
                    ) : (
                        <>
                            {/* Preview */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-sm font-semibold text-slate-700">
                                        ✅ {parsedMatches.length} match(s) détecté(s)
                                    </p>

                                    {importMode === 'paste' && (
                                        <button
                                            onClick={handleEnrichLocations}
                                            disabled={isEnriching}
                                            className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg 
                                                     hover:bg-indigo-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {isEnriching ? <>⏳ Recherche...</> : <>🔍 Trouver les gymnases</>}
                                        </button>
                                    )}
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
                                            <div className="mt-1 text-xs text-slate-500">
                                                📅 {match.date} à {match.time} • 📍 {match.location}
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
                            onClick={importMode === 'ffbb' ? handleFetchFFBB : handleParse}
                            disabled={importMode === 'ffbb' ? (!ffbbUrl.trim() || isLoading) : !csvContent.trim()}
                            className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all
                                      disabled:opacity-50 disabled:cursor-not-allowed
                                      ${importMode === 'ffbb'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                                }`}
                        >
                            {isLoading ? '⏳ Chargement...' : 'Récupérer les matchs →'}
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
