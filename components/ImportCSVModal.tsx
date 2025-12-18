import React, { useState, useCallback, memo } from 'react';
import { parseCSV, getSampleCSV, toGameFormData, type ParsedMatch } from '../utils/csvImport';
import type { GameFormData } from '../types';

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (matches: GameFormData[]) => void;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = memo(({ isOpen, onClose, onImport }) => {
    const [csvContent, setCsvContent] = useState('');
    const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([]);
    const [errors, setErrors] = useState<{ line: number; content: string; error: string }[]>([]);
    const [step, setStep] = useState<'input' | 'preview'>('input');

    const handleParse = useCallback(() => {
        const result = parseCSV(csvContent);
        setParsedMatches(result.success);
        setErrors(result.errors);
        if (result.success.length > 0) {
            setStep('preview');
        }
    }, [csvContent]);

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
        onClose();
    }, [onClose]);

    const loadSample = useCallback(() => {
        setCsvContent(getSampleCSV());
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden
                          animate-fade-in-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        📥 Importer des matchs
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                        Collez le calendrier FFBB au format CSV
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {step === 'input' ? (
                        <>
                            {/* Format info */}
                            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-600 font-medium mb-2">📋 Format attendu :</p>
                                <code className="text-xs text-slate-500 block">
                                    Date;Heure;Domicile;Visiteur;Salle
                                </code>
                                <button
                                    onClick={loadSample}
                                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
                                >
                                    Charger un exemple
                                </button>
                            </div>

                            {/* Textarea */}
                            <textarea
                                value={csvContent}
                                onChange={(e) => setCsvContent(e.target.value)}
                                placeholder="Collez le contenu CSV ici...&#10;&#10;Exemple:&#10;14/12/2024;15:00;SCBA U11-1;ROYAT;Maison des Sports"
                                className="w-full h-48 p-4 border-2 border-slate-200 rounded-xl font-mono text-sm
                                         focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                         resize-none"
                            />

                            {/* Errors */}
                            {errors.length > 0 && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-sm font-semibold text-red-700 mb-2">
                                        ⚠️ Erreurs détectées :
                                    </p>
                                    <ul className="text-xs text-red-600 space-y-1">
                                        {errors.map((err, i) => (
                                            <li key={i}>
                                                Ligne {err.line}: {err.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Preview */}
                            <div className="mb-4">
                                <p className="text-sm font-semibold text-slate-700 mb-3">
                                    ✅ {parsedMatches.length} match(s) détecté(s) :
                                </p>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {parsedMatches.map((match, i) => (
                                        <div
                                            key={i}
                                            className={`p-3 rounded-xl border ${match.isHome
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-blue-50 border-blue-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${match.isHome
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-blue-500 text-white'
                                                        }`}>
                                                        {match.isHome ? '🏠 DOM' : '🚗 EXT'}
                                                    </span>
                                                    <span className="ml-2 font-semibold text-slate-800">
                                                        {match.team}
                                                    </span>
                                                    <span className="text-slate-500 mx-2">vs</span>
                                                    <span className="font-medium text-slate-700">
                                                        {match.opponent}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                📅 {match.date} à {match.time} • 📍 {match.location}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {errors.length > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-xs text-amber-700">
                                        ⚠️ {errors.length} ligne(s) ignorée(s) en raison d'erreurs
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    {step === 'preview' && (
                        <button
                            onClick={() => setStep('input')}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 
                                     hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            ← Retour
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 
                                 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Annuler
                    </button>
                    {step === 'input' ? (
                        <button
                            onClick={handleParse}
                            disabled={!csvContent.trim()}
                            className="px-6 py-2 text-sm font-bold text-white 
                                     bg-gradient-to-r from-blue-500 to-cyan-500 
                                     hover:from-blue-600 hover:to-cyan-600
                                     rounded-xl shadow-md hover:shadow-lg transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
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
