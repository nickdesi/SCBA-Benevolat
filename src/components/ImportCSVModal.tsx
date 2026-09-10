import React, { useState, useCallback, memo, useMemo } from 'react';
import {
  parseCSV,
  toGameFormData,
  reconcileMatchesWithExisting,
  type ParsedMatch,
} from '../utils/csvImport';
import type { GameFormData, Game } from '../types';
import useScrollLock from '../hooks/useScrollLock';
import { CustomSelect } from './ui/CustomSelect';
import { fetchClubMatchesFromFFBB } from '../services/ffbbService';
import { enrichMatchesLocations } from '../utils/locationEnrichment';
import { MatchPreviewCard } from './import/MatchPreviewCard';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (matches: GameFormData[]) => void;
  existingGames: Game[];
}

const TEAM_OPTIONS = [
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

const ImportCSVModal: React.FC<ImportCSVModalProps> = memo(
  ({ isOpen, onClose, onImport, existingGames = [] }) => {
    useScrollLock(isOpen);
    const [activeTab, setActiveTab] = useState<'ffbb' | 'manual'>('ffbb');
    const [csvContent, setCsvContent] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
    const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([]);
    const [errors, setErrors] = useState<{ line: number; content: string; error: string }[]>([]);
    const [ffbbError, setFfbbError] = useState<string | null>(null);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [isEnriching, setIsEnriching] = useState(false);
    const [isFetchingFFBB, setIsFetchingFFBB] = useState(false);

    // ⚡ 1-Click Automated Import from FFBB (via dedicated ffbbService)
    const handleFetchFFBB = useCallback(async () => {
      setIsFetchingFFBB(true);
      setFfbbError(null);

      try {
        const fetchedMatches = await fetchClubMatchesFromFFBB(selectedTeam);

        if (fetchedMatches.length === 0) {
          setFfbbError(
            selectedTeam === 'ALL'
              ? 'Aucune rencontre trouvée sur la FFBB pour le SCBA actuellement (poules pas encore publiées).'
              : `Aucune rencontre trouvée sur la FFBB pour l'équipe ${selectedTeam}.`,
          );
          return;
        }

        const { reconciled } = reconcileMatchesWithExisting(fetchedMatches, existingGames);
        setParsedMatches(reconciled);
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
      const { reconciled } = reconcileMatchesWithExisting(result.success, existingGames);

      setParsedMatches(reconciled);
      setErrors(result.errors);

      if (reconciled.length > 0) {
        setStep('preview');
      }
    }, [csvContent, selectedTeam, existingGames]);

    // Enrich locations with Nominatim + Data ES (for manual imports)
    const handleEnrichLocations = useCallback(async () => {
      setIsEnriching(true);
      try {
        const enriched = await enrichMatchesLocations(parsedMatches, (progressMatches) => {
          setParsedMatches(progressMatches);
        });
        setParsedMatches(enriched);
      } finally {
        setIsEnriching(false);
      }
    }, [parsedMatches]);

    const handleLocationChange = useCallback((index: number, location: string) => {
      setParsedMatches((prev) => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = { ...updated[index], location };
        }
        return updated;
      });
    }, []);

    const handleClose = useCallback(() => {
      setStep('input');
      setIsEnriching(false);
      setFfbbError(null);
      onClose();
    }, [onClose]);

    const { newMatchesList, modifiedMatchesList, unchangedMatchesList, actionableMatches } =
      useMemo(() => {
        // ⚡ Bolt Optimization: Group multiple declarative array filtering passes inside
        // a single useMemo block to prevent redundant O(N) evaluations on every React render
        // cycle (e.g. during location enrichment polling, loading states, tab switches).
        return {
          newMatchesList: parsedMatches.filter((m) => m.matchStatus === 'new'),
          modifiedMatchesList: parsedMatches.filter((m) => m.matchStatus === 'modified'),
          unchangedMatchesList: parsedMatches.filter((m) => m.matchStatus === 'unchanged'),
          actionableMatches: parsedMatches.filter((m) => m.matchStatus !== 'unchanged'),
        };
      }, [parsedMatches]);

    const handleImport = useCallback(() => {
      if (actionableMatches.length === 0) {
        handleClose();
        return;
      }
      const gameData = actionableMatches.map(toGameFormData);
      onImport(gameData);
      handleClose();
    }, [actionableMatches, onImport, handleClose]);

    if (!isOpen) return null;

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
                    options={TEAM_OPTIONS}
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
                        <span>⚡ Récupérer automatiquement depuis la FFBB</span>
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
                  <div className="text-xs sm:text-sm font-bold font-sport">
                    {actionableMatches.length === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span>✅</span> Tous les {unchangedMatchesList.length} matchs sont déjà à
                        jour ! (0 action requise)
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {newMatchesList.length > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ✨ {newMatchesList.length} nouveau(x) match(s)
                          </span>
                        )}
                        {modifiedMatchesList.length > 0 && (
                          <span className="text-amber-500 dark:text-amber-400">
                            🔄 {modifiedMatchesList.length} mise(s) à jour
                          </span>
                        )}
                        {unchangedMatchesList.length > 0 && (
                          <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">
                            (🔒 {unchangedMatchesList.length} inchangé(s))
                          </span>
                        )}
                      </div>
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
                    <MatchPreviewCard
                      key={i}
                      match={match}
                      index={i}
                      onLocationChange={handleLocationChange}
                    />
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
                disabled={actionableMatches.length === 0}
                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sport tracking-wide"
              >
                {actionableMatches.length === 0
                  ? '✓ Tous les matchs sont à jour (0 action requise)'
                  : `✓ Enregistrer ${actionableMatches.length} match(s) (${newMatchesList.length > 0 ? `${newMatchesList.length} nouveau(x)` : ''}${newMatchesList.length > 0 && modifiedMatchesList.length > 0 ? ', ' : ''}${modifiedMatchesList.length > 0 ? `${modifiedMatchesList.length} mise(s) à jour` : ''})`}
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
