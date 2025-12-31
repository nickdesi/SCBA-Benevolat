import React, { useMemo } from 'react';
import type { Game } from '../types';

interface AdminStatsProps {
    games: Game[];
    onClose: () => void;
}

const AdminStats: React.FC<AdminStatsProps> = ({ games, onClose }) => {
    const stats = useMemo(() => {
        const homeGames = games.filter(g => g.isHome);

        let totalSlots = 0;
        let filledSlots = 0;

        const gameStats = homeGames.map(game => {
            const gameTotal = game.roles.reduce((acc, role) => acc + role.capacity, 0);
            const gameFilled = game.roles.reduce((acc, role) => acc + role.volunteers.length, 0);

            totalSlots += gameTotal;
            filledSlots += gameFilled;

            return {
                id: game.id,
                team: game.team,
                opponent: game.opponent,
                date: game.date,
                percent: gameTotal > 0 ? Math.round((gameFilled / gameTotal) * 100) : 0,
                filled: gameFilled,
                total: gameTotal
            };
        });

        return {
            totalGames: homeGames.length,
            totalSlots,
            filledSlots,
            percent: totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0,
            gameStats: gameStats.sort((a, b) => b.percent - a.percent) // Sort by least filled first or most filled? Let's do least filled first.
        };
    }, [games]);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            <span>📊</span> Tableau de Bord Admin
                        </h2>
                        <p className="text-slate-400 text-sm">Statistiques de remplissage des matchs</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                            <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Matchs Domicile</p>
                            <p className="text-3xl font-black text-blue-900">{stats.totalGames}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Taux Global</p>
                            <p className="text-3xl font-black text-emerald-900">{stats.percent}%</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                            <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">Postes Pourvus</p>
                            <p className="text-3xl font-black text-amber-900">{stats.filledSlots}/{stats.totalSlots}</p>
                        </div>
                    </div>

                    {/* Details List */}
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>🏟️</span> Détail par Match
                    </h3>
                    <div className="space-y-3">
                        {stats.gameStats.map(game => (
                            <div key={game.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{game.team} vs {game.opponent}</h4>
                                        <p className="text-xs text-slate-500">{game.date}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${game.percent === 100 ? 'bg-emerald-100 text-emerald-700' :
                                            game.percent > 50 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {game.percent}%
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${game.percent === 100 ? 'bg-emerald-500' :
                                                game.percent > 50 ? 'bg-blue-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${game.percent}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 text-right font-medium">
                                    {game.filled} / {game.total} postes occupés
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminStats;
