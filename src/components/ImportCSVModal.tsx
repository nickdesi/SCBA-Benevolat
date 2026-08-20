import React, { useState, useCallback, memo } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { parseCSV, toGameFormData, findMatchingGame, type ParsedMatch } from '../utils/csvImport';
import type { GameFormData, Game } from '../types';
import useScrollLock from '../hooks/useScrollLock';
import { CustomSelect } from './ui/CustomSelect';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (matches: GameFormData[]) => void;
  existingGames: Game[];
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = memo(
  ({ isOpen, onClose, onImport, existingGames = [] }) => {
    useScrollLock(isOpen);
    const [activeTab, setActiveTab] = useState<'ffbb' | 'manual'>('ffbb');
    const [csvContent, setCsvContent] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
    const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([]);
    const [duplicatesCount, setDuplicatesCount] = useState(0);
    const [errors, setErrors] = useState<{ line: number; content: string; error: string }[]>([]);
    const [ffbbError, setFfbbError] = useState<string | null>(null);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [isEnriching, setIsEnriching] = useState(false);
    const [isFetchingFFBB, setIsFetchingFFBB] = useState(false);

    // ⚡ 1-Click Automated Import from FFBB (via ffbb-data-client)
    const handleFetchFFBB = useCallback(async () => {
      setIsFetchingFFBB(true);
      setFfbbError(null);

      try {
        let fetchedMatches: ParsedMatch[] = [];
        let localError: string | null = null;

        // 1. Essai via l'API locale /api/ffbb-matches (ffbb-data-client)
        try {
          const queryParam =
            selectedTeam === 'ALL' ? '' : `?team=${encodeURIComponent(selectedTeam)}`;
          const localRes = await fetch(`/api/ffbb-matches${queryParam}`);
          if (localRes.ok) {
            const data = await localRes.json();
            if (Array.isArray(data?.matches)) {
              fetchedMatches = data.matches;
            }
            if (data?.error && fetchedMatches.length === 0) {
              localError = data.error;
            }
          }
        } catch {
          // Fallback sur Cloud Function si l'endpoint local n'est pas dispo
        }

        // 2. Si non récupéré en local, appel de la Cloud Function
        if (fetchedMatches.length === 0 && !localError) {
          try {
            const fetchFn = httpsCallable<
              { team?: string },
              { matches: ParsedMatch[]; count: number }
            >(functions, 'fetchFFBBMatches');
            const res = await fetchFn({ team: selectedTeam === 'ALL' ? undefined : selectedTeam });
            fetchedMatches = res.data?.matches || [];
          } catch (cloudErr: any) {
            console.warn('Fallback Cloud Function échoué:', cloudErr);
            // Si on est en dev et que la Cloud Function n'est pas déployée
            if (
              cloudErr?.code === 'functions/not-found' ||
              cloudErr?.code === 'functions/internal' ||
              cloudErr?.message?.includes('internal')
            ) {
              throw new Error(
                'Impossible de joindre le service FFBB. Veuillez vérifier votre connexion ou réessayer.',
                { cause: cloudErr },
              );
            }
            throw cloudErr;
          }
        }

        if (fetchedMatches.length === 0) {
          if (localError) {
            setFfbbError(`Erreur API FFBB : ${localError}`);
          } else {
            setFfbbError(
              selectedTeam === 'ALL'
                ? 'Aucune rencontre trouvée sur la FFBB pour le SCBA actuellement (poules pas encore publiées).'
                : `Aucune rencontre trouvée sur la FFBB pour l'équipe ${selectedTeam}.`,
            );
          }
          setIsFetchingFFBB(false);
          return;
        }

        const newMatches: ParsedMatch[] = [];
        let updateCount = 0;

        fetchedMatches.forEach((match) => {
          const existing = findMatchingGame(match, existingGames);
          if (existing) {
            newMatches.push({ ...match, id: existing.id });
            updateCount++;
          } else {
            newMatches.push(match);
          }
        });

        setParsedMatches(newMatches);
        setDuplicatesCount(updateCount);
        setErrors([]);
        setStep('preview');
      } catch (err: any) {
        console.error('Erreur lors de la récupération FFBB:', err);
        const msg =
          err?.message === 'internal'
            ? 'Erreur interne lors de la communication avec la FFBB. Veuillez réessayer.'
            : err?.message || 'Erreur lors de la récupération des matchs depuis la FFBB.';
        setFfbbError(msg);
      } finally {
        setIsFetchingFFBB(false);
      }
    }, [selectedTeam, existingGames]);

    // Parse from CSV/paste with Deduplication/Update detection
    const handleParseText = useCallback(() => {
      const teamForManual = selectedTeam === 'ALL' ? 'SENIOR M1' : selectedTeam;
      const result = parseCSV(csvContent, teamForManual);

      const newMatches: ParsedMatch[] = [];
      let updateCount = 0;

      result.success.forEach((match) => {
        const existing = findMatchingGame(match, existingGames);
        if (existing) {
          // It's an update!
          newMatches.push({ ...match, id: existing.id });
          updateCount++;
        } else {
          newMatches.push(match);
        }
      });

      setParsedMatches(newMatches);
      setDuplicatesCount(updateCount);
      setErrors(result.errors);

      if (newMatches.length > 0) {
        setStep('preview');
      }
    }, [csvContent, selectedTeam, existingGames]);

    // Enrich locations with Nominatim + Data ES (for manual imports)
    const handleEnrichLocations = useCallback(async () => {
      setIsEnriching(true);
      const updatedMatches = [...parsedMatches];
      const matchesToEnrich = updatedMatches
        .map((m, i) => ({ match: m, index: i }))
        .filter(
          ({ match }) =>
            !match.isHome &&
            (match.location === 'Extérieur' || match.location.startsWith('Extérieur (')),
        );

      const cityGroups = new Map<string, { match: ParsedMatch; index: number }[]>();
      matchesToEnrich.forEach(({ match, index }) => {
        const cityMatch = match.location.match(/Extérieur \((.+)\)/i);
        if (cityMatch) {
          const cityName = cityMatch[1];
          if (cityName) {
            const normCityName = cityName.trim();
            if (!cityGroups.has(normCityName)) {
              cityGroups.set(normCityName, []);
            }
            cityGroups.get(normCityName)!.push({ match, index });
          }
        }
      });

      const uniqueCities = Array.from(cityGroups.keys());
      const CHUNK_SIZE = 3;

      for (let i = 0; i < uniqueCities.length; i += CHUNK_SIZE) {
        const chunkCities = uniqueCities.slice(i, i + CHUNK_SIZE);

        await Promise.all(
          chunkCities.map(async (cityName) => {
            const cityNameLower = cityName
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');

            const fetchNominatim = async () => {
              const results: string[] = [];
              const queries = [
                `gymnase ${cityName}`,
                `salle polyvalente ${cityName}`,
                `complexe sportif ${cityName}`,
                `stade ${cityName}`,
                `${cityName}`,
              ];

              for (const query of queries) {
                try {
                  const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?` +
                      `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=3&countrycodes=fr`,
                    { headers: { 'Accept-Language': 'fr' } },
                  );
                  const data = await response.json();

                  for (const result of data) {
                    const addr = result.address || {};
                    const resultCity = (
                      addr.city ||
                      addr.town ||
                      addr.village ||
                      addr.municipality ||
                      ''
                    ).toLowerCase();
                    const resultCityNorm = resultCity
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '');

                    if (
                      resultCityNorm.includes(cityNameLower) ||
                      cityNameLower.includes(resultCityNorm)
                    ) {
                      const name = result.name || 'Gymnase / Salle';
                      const street = addr.road || addr.pedestrian || '';
                      const houseNumber = addr.house_number || '';
                      const postcode = addr.postcode || '';
                      const city = addr.city || addr.town || addr.village || cityName;

                      const fullAddress = [
                        name,
                        [houseNumber, street].filter(Boolean).join(' '),
                        [postcode, city].filter(Boolean).join(' '),
                      ]
                        .filter(Boolean)
                        .join(', ');

                      results.push(fullAddress);
                    }
                  }
                } catch (e) {
                  /* ignore */
                }
                if (results.length > 0 && queries.indexOf(query) < 2) break;
              }
              return results;
            };

            const fetchDataES = async () => {
              const results: string[] = [];
              try {
                const response = await fetch(
                  `https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records?` +
                    `where=search(inst_nom, "${encodeURIComponent(cityName)}")` +
                    `%20OR%20search(equip_nom, "${encodeURIComponent(cityName)}")` +
                    `%20OR%20search(com_nom, "${encodeURIComponent(cityName)}")` +
                    `&limit=8`,
                );
                const data = await response.json();

                if (data.results) {
                  for (const record of data.results) {
                    const sports = record.aps_name || [];
                    const isBasket = sports.some(
                      (s: string) => s && s.toLowerCase().includes('basket'),
                    );

                    const recCity = (record.com_nom || record.lib_bdv || '').toLowerCase();
                    const recCityNorm = recCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                    if (
                      recCityNorm.includes(cityNameLower) &&
                      (isBasket ||
                        record.equip_type_name?.includes('Gymnase') ||
                        record.equip_type_name?.includes('Salle multisports'))
                    ) {
                      const name = record.equip_nom || record.inst_nom || 'Gymnase';
                      const address = record.inst_adresse || '';
                      const zip = record.inst_cp || '';
                      const city = record.lib_bdv || record.com_nom || cityName;

                      const fullAddress = [name, address, `${zip} ${city}`]
                        .filter(Boolean)
                        .join(', ');
                      results.push(fullAddress);
                    }
                  }
                }
              } catch (e) {
                console.error('Data ES error', e);
              }
              return results;
            };

            const [nominatimResults, dataEsResults] = await Promise.all([
              fetchNominatim(),
              fetchDataES(),
            ]);

            const candidates = Array.from(new Set([...dataEsResults, ...nominatimResults]));
            const matchesForCity = cityGroups.get(cityName)!;

            if (candidates.length > 0) {
              matchesForCity.forEach(({ match, index }) => {
                updatedMatches[index] = {
                  ...match,
                  location: candidates[0],
                  candidates: candidates,
                };
              });
            } else {
              matchesForCity.forEach(({ match, index }) => {
                updatedMatches[index] = {
                  ...match,
                  location: `À ${cityName} (adresse introuvable)`,
                };
              });
            }
          }),
        );

        setParsedMatches([...updatedMatches]);
        if (i + CHUNK_SIZE < uniqueCities.length) await new Promise((r) => setTimeout(r, 600));
      }

      setIsEnriching(false);
    }, [parsedMatches]);

    const handleImport = useCallback(() => {
      const gameData = parsedMatches.map(toGameFormData);
      onImport(gameData);
      handleClose();
    }, [parsedMatches, onImport]);

    const handleClose = useCallback(() => {
      setStep('input');
      setIsEnriching(false);
      setFfbbError(null);
      onClose();
    }, [onClose]);

    if (!isOpen) return null;

    const teamOptions = [
      { value: 'ALL', label: '✨ Toutes les équipes (Club complet)' },
      { value: 'SENIOR M1', label: 'SENIOR M1' },
      { value: 'SENIOR M2', label: 'SENIOR M2' },
      { value: 'U18 M1', label: 'U18 M1' },
      { value: 'U18 M2', label: 'U18 M2' },
      { value: 'U15 M1', label: 'U15 M1' },
      { value: 'U15 M2', label: 'U15 M2' },
      { value: 'U13 M1', label: 'U13 M1' },
      { value: 'U11 M1', label: 'U11 M1' },
      { value: 'U11 M2', label: 'U11 M2' },
      { value: 'U9 M1', label: 'U9 M1' },
    ];

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in-up flex flex-col border border-slate-200/80 dark:border-slate-700/80">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 p-6 text-white flex-shrink-0 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2 font-sport">
              <span>📥</span> Importer des rencontres
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {step === 'input'
                ? 'Synchronisez directement depuis la FFBB ou collez un calendrier.'
                : 'Vérifiez les matchs détectés avant de confirmer.'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {step === 'input' && (
              <>
                {/* Team Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 font-sport">
                    Équipe concernée
                  </label>
                  <CustomSelect
                    label="Équipe concernée"
                    value={selectedTeam}
                    onChange={(val) => setSelectedTeam(val as string)}
                    options={teamOptions}
                  />
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-700/60 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ffbb')}
                    className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      activeTab === 'ffbb'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>⚡</span> Synchronisation 1-Clic FFBB
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      activeTab === 'manual'
                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>📋</span> Saisie manuelle
                  </button>
                </div>

                {/* TAB 1: 1-CLICK FFBB AUTOMATION */}
                {activeTab === 'ffbb' && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white dark:from-slate-700/60 dark:via-slate-800/40 dark:to-slate-800 border border-blue-100 dark:border-blue-900/30 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-2xl shadow-md shadow-blue-500/20">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white font-sport">
                        Import Officiel FFBB en 1-Clic
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                        Interroge l'API officielle pour récupérer automatiquement les matchs, dates,
                        horaires, salles exactes et logos des clubs adverses.
                      </p>
                    </div>

                    {ffbbError && (
                      <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-left">
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                          ⚠️ {ffbbError}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleFetchFFBB}
                      disabled={isFetchingFFBB}
                      className="w-full py-3.5 px-6 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-700 hover:via-indigo-700 hover:to-cyan-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-sport tracking-wide"
                    >
                      {isFetchingFFBB ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Récupération depuis la FFBB...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Récupérer automatiquement depuis la FFBB</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* TAB 2: MANUAL CSV / COPY-PASTE */}
                {activeTab === 'manual' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        📋 Instructions :
                      </p>
                      <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
                        <li>Allez sur la page FFBB de l'équipe</li>
                        <li>Sélectionnez et copiez (Ctrl+C) le tableau des matchs</li>
                        <li>Collez ci-dessous (Ctrl+V) puis cliquez sur Analyser</li>
                      </ul>
                    </div>

                    <textarea
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      placeholder="Collez le tableau FFBB ici..."
                      className="w-full h-36 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl font-mono text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />

                    {errors.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">
                          ⚠️ Erreurs d'analyse :
                        </p>
                        <ul className="text-xs text-red-600 dark:text-red-300 space-y-1 list-disc list-inside">
                          {errors.map((err, i) => (
                            <li key={i}>{err.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* PREVIEW STEP */}
            {step === 'preview' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 font-sport">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ✨ {parsedMatches.length - duplicatesCount} nouveau(x) match(s)
                    </span>
                    {duplicatesCount > 0 && (
                      <span className="text-blue-500 dark:text-blue-400 ml-2">
                        (🔄 {duplicatesCount} mise(s) à jour)
                      </span>
                    )}
                  </div>

                  {activeTab === 'manual' && (
                    <button
                      type="button"
                      onClick={handleEnrichLocations}
                      disabled={isEnriching}
                      className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isEnriching ? <>⏳ Recherche...</> : <>🔍 Trouver les gymnases</>}
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {parsedMatches.length === 0 && (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 italic text-sm">
                      Aucun match détecté.
                    </div>
                  )}
                  {parsedMatches.map((match, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        match.isHome
                          ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40'
                          : 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              match.isHome ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                            }`}
                          >
                            {match.isHome ? '🏠 Domicile' : '🚗 Extérieur'}
                          </span>
                          {match.competition && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                              {match.competition}
                            </span>
                          )}
                        </div>

                        {match.id && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                            🔄 Mise à jour
                          </span>
                        )}
                      </div>

                      {/* Opponents & Logos */}
                      <div className="flex items-center gap-2.5 mt-2">
                        {match.teamLogo && (
                          <img
                            src={match.teamLogo}
                            alt="Logo SCBA"
                            className="w-6 h-6 object-contain rounded-full bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                          />
                        )}
                        <span className="font-bold text-xs text-slate-900 dark:text-white font-sport uppercase">
                          {match.team}
                        </span>
                        <span className="text-slate-400 text-xs italic font-bold">vs</span>
                        {match.opponentLogo && (
                          <img
                            src={match.opponentLogo}
                            alt="Logo adversaire"
                            className="w-6 h-6 object-contain rounded-full bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                          />
                        )}
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-sport truncate">
                          {match.opponent}
                        </span>
                      </div>

                      {/* Date, Time, Location */}
                      <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>📅</span>
                          <span>
                            {match.date} à {match.time}
                          </span>
                        </div>

                        <div className="flex items-start gap-1.5 mt-0.5">
                          <span className="mt-0.5">📍</span>
                          <input
                            type="text"
                            value={match.location}
                            onChange={(e) => {
                              const newMatches = [...parsedMatches];
                              newMatches[i] = { ...match, location: e.target.value };
                              setParsedMatches(newMatches);
                            }}
                            className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                            placeholder="Adresse du match"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0">
            {step === 'preview' && (
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-sport"
              >
                ← Retour
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-sport"
            >
              Annuler
            </button>
            {step === 'input' && activeTab === 'manual' && (
              <button
                type="button"
                onClick={handleParseText}
                disabled={!csvContent.trim()}
                className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 flex items-center gap-2 font-sport tracking-wide"
              >
                Analyser →
              </button>
            )}
            {step === 'preview' && (
              <button
                type="button"
                onClick={handleImport}
                disabled={parsedMatches.length === 0}
                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sport tracking-wide"
              >
                ✓ Importer / Mettre à jour {parsedMatches.length} match(s)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
);

ImportCSVModal.displayName = 'ImportCSVModal';

export default ImportCSVModal;
