import React, { useMemo, useState } from 'react';
import type { Game, Role } from '../types';
import useScrollLock from '../utils/useScrollLock';
import { AdminBroadcastPanel } from './admin/AdminBroadcastPanel';

interface AdminStatsProps {
    games: Game[];
    onClose: () => void;
}

type FilterType = 'all' | 'urgent' | 'incomplete';
type TabType = 'stats' | 'broadcast';

// Helper to check if a role is complete
const isRoleComplete = (role: Role): boolean => {
    const isUnlimited = role.capacity === Infinity || role.capacity === 0;
    if (isUnlimited) return role.volunteers.length >= 2;
    return role.volunteers.length >= role.capacity;
};

// Helper to get missing roles for a game
const getMissingRoles = (game: Game): string[] => {
    return game.roles
        .filter(r => !isRoleComplete(r))
        .map(r => r.name);
};

const AdminStats: React.FC<AdminStatsProps> = ({ games, onClose }) => {
    useScrollLock(true);
    const [activeTab, setActiveTab] = useState<TabType>('stats');
    const [filter, setFilter] = useState<FilterType>('all');

    const stats = useMemo(() => {
        const homeGames = games.filter(g => g.isHome);
        const now = new Date();

        let totalSlots = 0;
        let filledSlots = 0;

        const gameStats = homeGames.map(game => {
            const finiteRoles = game.roles.filter(r => isFinite(r.capacity));
            const gameTotal = finiteRoles.reduce((acc, role) => acc + role.capacity, 0);
            const gameFilled = finiteRoles.reduce((acc, role) => acc + role.volunteers.length, 0);

            totalSlots += gameTotal;
            filledSlots += gameFilled;

            // Check if urgent (< 48h and not complete)
            let isUrgent = false;
            let hoursUntil = Infinity;
            try {
                const gameDate = new Date(game.dateISO);
                const diffMs = gameDate.getTime() - now.getTime();
                hoursUntil = diffMs / (1000 * 60 * 60);
                const isComplete = gameFilled >= gameTotal;
                isUrgent = hoursUntil > 0 && hoursUntil < 48 && !isComplete;
            } catch { /* ignore */ }

            const missingRoles = getMissingRoles(game);

            return {
                id: game.id,
                team: game.team,
                opponent: game.opponent,
                date: game.date,
                dateISO: game.dateISO,
                percent: gameTotal > 0 ? Math.round((gameFilled / gameTotal) * 100) : 0,
                filled: gameFilled,
                total: gameTotal,
                hasUnlimited: game.roles.some(r => !isFinite(r.capacity)),
                isUrgent,
                hoursUntil,
                missingRoles,
                isComplete: gameFilled >= gameTotal
            };
        });

        // Count urgents and incompletes
        const urgentCount = gameStats.filter(g => g.isUrgent).length;
        const incompleteCount = gameStats.filter(g => !g.isComplete).length;

        return {
            totalGames: homeGames.length,
            totalSlots,
            filledSlots,
            percent: totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0,
            gameStats: gameStats.sort((a, b) => {
                // Urgent first, then by percent (least filled first)
                if (a.isUrgent && !b.isUrgent) return -1;
                if (!a.isUrgent && b.isUrgent) return 1;
                return a.percent - b.percent;
            }),
            urgentCount,
            incompleteCount
        };
    }, [games]);

    // Apply filter
    const filteredGames = useMemo(() => {
        switch (filter) {
            case 'urgent':
                return stats.gameStats.filter(g => g.isUrgent);
            case 'incomplete':
                return stats.gameStats.filter(g => !g.isComplete);
            default:
                return stats.gameStats;
        }
    }, [stats.gameStats, filter]);

    const formatCapacity = (val: number) => {
        if (!isFinite(val)) return 'Illimité';
        return val.toString();
    };

    const formatHoursUntil = (hours: number) => {
        if (hours < 24) return `${Math.round(hours)}h`;
        return `${Math.round(hours / 24)}j`;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            <span>{activeTab === 'broadcast' ? '📢' : '📊'}</span> Admin Dashboard
                        </h2>
                        <p className="text-slate-400 text-sm">Administration centralisée</p>

                        {/* Tabs */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-lg' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                            >
                                Statistiques
                            </button>
                            <button
                                onClick={() => setActiveTab('broadcast')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'broadcast' ? 'bg-white text-slate-900 shadow-lg' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                            >
                                Communication
                            </button>
                        </div>
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

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'broadcast' ? (
                        <AdminBroadcastPanel />
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                                    <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-0.5">Matchs</p>
                                    <p className="text-2xl font-black text-blue-900">{stats.totalGames}</p>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-0.5">Taux</p>
                                    <p className="text-2xl font-black text-emerald-900">{stats.percent}%</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                                    <p className="text-amber-600 text-[10px] font-bold uppercase tracking-wider mb-0.5">Postes</p>
                                    <p className="text-2xl font-black text-amber-900">{stats.filledSlots}/{stats.totalSlots}</p>
                                </div>
                                <div className={`p-3 rounded-xl border text-center ${stats.urgentCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${stats.urgentCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>Urgents</p>
                                    <p className={`text-2xl font-black ${stats.urgentCount > 0 ? 'text-red-700' : 'text-slate-400'}`}>{stats.urgentCount}</p>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Tous ({stats.totalGames})
                                </button>
                                <button
                                    onClick={() => setFilter('urgent')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${filter === 'urgent' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                >
                                    🚨 Urgents ({stats.urgentCount})
                                </button>
                                <button
                                    onClick={() => setFilter('incomplete')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${filter === 'incomplete' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                >
                                    ⚠️ Incomplets ({stats.incompleteCount})
                                </button>
                            </div>

                            {/* Games List */}
                            <div className="space-y-3">
                                {filteredGames.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <span className="text-4xl mb-2 block">🎉</span>
                                        <p className="font-medium">Aucun match dans cette catégorie</p>
                                    </div>
                                ) : (
                                    filteredGames.map(game => (
                                        <div
                                            key={game.id}
                                            className={`p-4 rounded-xl border ${game.isUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-slate-800">{game.team} vs {game.opponent}</h4>
                                                        {game.isUrgent && (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-600 text-white rounded-full animate-pulse">
                                                                🚨 Dans {formatHoursUntil(game.hoursUntil)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{game.date}</p>

                                                    {/* Missing Roles */}
                                                    {game.missingRoles.length > 0 && (
                                                        <p className="text-xs mt-1">
                                                            <span className="text-red-600 font-semibold">Manque :</span>{' '}
                                                            <span className="text-red-500">{game.missingRoles.join(', ')}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${game.percent === 100 ? 'bg-emerald-100 text-emerald-700' :
                                                        game.percent > 50 ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {game.percent}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-200 ${game.percent === 100 ? 'bg-emerald-500' :
                                                        game.percent > 50 ? 'bg-blue-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${game.percent}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 text-right font-medium">
                                                {game.filled} / {formatCapacity(game.total)} postes
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
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

