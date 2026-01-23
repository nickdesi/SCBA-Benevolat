import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    BarChart3, Megaphone, Activity, Users, AlertTriangle,
    AlertOctagon, CheckCircle2, X, TrendingUp, Calendar,
    Clock, ChevronRight, Zap
} from 'lucide-react';
import type { Game, Role } from '../types';
import useScrollLock from '../utils/useScrollLock';
import { AdminBroadcastPanel } from './admin/AdminBroadcastPanel';

interface AdminStatsProps {
    games: Game[];
    onClose: () => void;
    onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type FilterType = 'all' | 'urgent' | 'incomplete';
type TabType = 'stats' | 'broadcast';

// Animation variants - optimized for snappy feel
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.02,
            delayChildren: 0,
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "tween", duration: 0.15, ease: "easeOut" }
    }
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "tween", duration: 0.15, ease: "easeOut" }
    }
};

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

const AdminStats: React.FC<AdminStatsProps> = ({ games, onClose, onToast }) => {
    useScrollLock(true);
    const [activeTab, setActiveTab] = useState<TabType>('stats');
    const [filter, setFilter] = useState<FilterType>('all');

    const stats = useMemo(() => {
        const homeGames = games.filter(g => g.isHome);
        const now = new Date();

        let totalSlots = 0;
        let filledSlots = 0;

        const gameStats = homeGames.map(game => {
            const gameTotal = game.roles.reduce((acc, role) => {
                const isUnlimited = !isFinite(role.capacity) || role.capacity === 0;
                return acc + (isUnlimited ? 2 : role.capacity);
            }, 0);

            const gameFilled = game.roles.reduce((acc, role) => {
                const isUnlimited = !isFinite(role.capacity) || role.capacity === 0;
                const capacity = isUnlimited ? 2 : role.capacity;
                return acc + Math.min(role.volunteers.length, capacity);
            }, 0);

            totalSlots += gameTotal;
            filledSlots += gameFilled;

            // Check if urgent (<48h and not complete)
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

    // KPI Card Component
    const KPICard = ({
        icon: Icon,
        label,
        value,
        subValue,
        color,
        isAlert = false
    }: {
        icon: React.ElementType;
        label: string;
        value: string | number;
        subValue?: string;
        color: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
        isAlert?: boolean;
    }) => {
        const colorStyles = {
            blue: {
                bg: 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
                border: 'border-blue-200/50 dark:border-blue-500/30',
                icon: 'text-blue-600 dark:text-blue-400',
                text: 'text-blue-900 dark:text-blue-100',
                glow: 'group-hover:shadow-blue-500/20'
            },
            emerald: {
                bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
                border: 'border-emerald-200/50 dark:border-emerald-500/30',
                icon: 'text-emerald-600 dark:text-emerald-400',
                text: 'text-emerald-900 dark:text-emerald-100',
                glow: 'group-hover:shadow-emerald-500/20'
            },
            amber: {
                bg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
                border: 'border-amber-200/50 dark:border-amber-500/30',
                icon: 'text-amber-600 dark:text-amber-400',
                text: 'text-amber-900 dark:text-amber-100',
                glow: 'group-hover:shadow-amber-500/20'
            },
            red: {
                bg: 'bg-gradient-to-br from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20',
                border: 'border-red-200/50 dark:border-red-500/30',
                icon: 'text-red-600 dark:text-red-400',
                text: 'text-red-900 dark:text-red-100',
                glow: 'group-hover:shadow-red-500/20'
            },
            slate: {
                bg: 'bg-gradient-to-br from-slate-500/10 to-gray-500/10 dark:from-slate-500/20 dark:to-gray-500/20',
                border: 'border-slate-200/50 dark:border-slate-500/30',
                icon: 'text-slate-600 dark:text-slate-400',
                text: 'text-slate-900 dark:text-slate-100',
                glow: 'group-hover:shadow-slate-500/20'
            }
        };

        const styles = colorStyles[color];

        return (
            <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`
                    group relative p-4 rounded-2xl border backdrop-blur-sm
                    ${styles.bg} ${styles.border}
                    transition-shadow duration-300 cursor-default
                    hover:shadow-lg ${styles.glow}
                    ${isAlert ? 'ring-2 ring-red-500/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}
                `}
            >
                {/* Background Icon */}
                <div className="absolute top-2 right-2 opacity-[0.07] transform scale-150 pointer-events-none">
                    <Icon className="w-12 h-12" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`p-2 rounded-xl bg-white/50 dark:bg-white/10 mb-2 ${styles.icon}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${styles.icon} mb-1`}>
                        {label}
                    </p>
                    <p className={`text-2xl md:text-3xl font-black ${styles.text}`}>
                        {value}
                    </p>
                    {subValue && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {subValue}
                        </p>
                    )}
                </div>

                {/* Alert Pulse */}
                {isAlert && (
                    <div className="absolute -top-1 -right-1">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                )}
            </motion.div>
        );
    };

    // Game Card Component
    const GameCard = ({ game, index }: { game: typeof filteredGames[0]; index: number }) => {
        const getProgressColor = (percent: number) => {
            if (percent === 100) return 'from-emerald-500 to-teal-500';
            if (percent >= 50) return 'from-blue-500 to-indigo-500';
            if (percent >= 25) return 'from-amber-500 to-orange-500';
            return 'from-red-500 to-rose-500';
        };

        const getBadgeStyles = (percent: number) => {
            if (percent === 100) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
            if (percent >= 50) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
            return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
        };

        return (
            <div
                className={`
                    group relative p-4 md:p-5 rounded-2xl border overflow-hidden
                    bg-white/90 dark:bg-slate-800/90
                    ${game.isUrgent
                        ? 'border-red-300 dark:border-red-500/50 shadow-red-100 dark:shadow-red-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                    transition-all duration-100 hover:shadow-lg
                `}
            >
                {/* Urgent Glow Effect */}
                {game.isUrgent && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 pointer-events-none" />
                )}

                {/* Header */}
                <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base truncate">
                                {game.team}
                            </h4>
                            <span className="text-slate-400 dark:text-slate-500 text-sm">vs</span>
                            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium truncate">
                                {game.opponent}
                            </span>
                        </div>

                        {/* Date & Urgent Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-xs">{game.date}</span>
                            </div>

                            {game.isUrgent && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-red-600 text-white rounded-full shadow-lg shadow-red-500/30"
                                >
                                    <Zap className="w-3 h-3" />
                                    Dans {formatHoursUntil(game.hoursUntil)}
                                </motion.span>
                            )}
                        </div>
                    </div>

                    {/* Percentage Badge */}
                    <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-3 py-1.5 text-sm font-black rounded-xl ${getBadgeStyles(game.percent)} shrink-0`}
                    >
                        {game.percent}%
                    </motion.span>
                </div>

                {/* Missing Roles */}
                {game.missingRoles.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs">
                            <span className="font-semibold text-red-600 dark:text-red-400">Manque : </span>
                            <span className="text-red-500 dark:text-red-300">
                                {game.missingRoles.join(', ')}
                            </span>
                        </p>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="relative">
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${game.percent}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${getProgressColor(game.percent)} rounded-full`}
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 text-right font-medium">
                        {game.filled} / {formatCapacity(game.total)} postes pourvus
                    </p>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 md:p-6"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh] border border-slate-200 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5 md:p-6 text-white shrink-0 overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
                        </div>

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                                    className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30"
                                >
                                    {activeTab === 'broadcast'
                                        ? <Megaphone className="w-6 h-6 text-white" />
                                        : <BarChart3 className="w-6 h-6 text-white" />
                                    }
                                </motion.div>

                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                        Admin Dashboard
                                    </h2>
                                    <p className="text-slate-400 text-sm font-medium">
                                        Gestion centralisée du bénévolat
                                    </p>
                                </div>
                            </div>

                            {/* Close Button */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </motion.button>
                        </div>

                        {/* Tabs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative z-10 flex gap-2 mt-5 bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm"
                        >
                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`flex-1 px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'stats'
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Statistiques</span>
                                <span className="sm:hidden">Stats</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('broadcast')}
                                className={`flex-1 px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'broadcast'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                <Megaphone className="w-4 h-4" />
                                <span className="hidden sm:inline">Communication</span>
                                <span className="sm:hidden">Com</span>
                            </button>
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                        <AnimatePresence mode="wait">
                            {activeTab === 'broadcast' ? (
                                <motion.div
                                    key="broadcast"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <AdminBroadcastPanel onToast={onToast} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="stats"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* KPI Cards */}
                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6"
                                    >
                                        <KPICard
                                            icon={Activity}
                                            label="Matchs"
                                            value={stats.totalGames}
                                            subValue="à domicile"
                                            color="blue"
                                        />
                                        <KPICard
                                            icon={TrendingUp}
                                            label="Taux global"
                                            value={`${stats.percent}%`}
                                            color="emerald"
                                        />
                                        <KPICard
                                            icon={Users}
                                            label="Postes"
                                            value={`${stats.filledSlots}/${stats.totalSlots}`}
                                            color="amber"
                                        />
                                        <KPICard
                                            icon={AlertTriangle}
                                            label="Urgents"
                                            value={stats.urgentCount}
                                            subValue="< 48h"
                                            color={stats.urgentCount > 0 ? "red" : "slate"}
                                            isAlert={stats.urgentCount > 0}
                                        />
                                    </motion.div>

                                    {/* Filter Pills */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
                                    >
                                        <button
                                            onClick={() => setFilter('all')}
                                            className={`shrink-0 px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${filter === 'all'
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                }`}
                                        >
                                            <Activity className="w-3.5 h-3.5" />
                                            Tous ({stats.totalGames})
                                        </button>
                                        <button
                                            onClick={() => setFilter('urgent')}
                                            className={`shrink-0 px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${filter === 'urgent'
                                                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                                                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30'
                                                }`}
                                        >
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Urgents ({stats.urgentCount})
                                        </button>
                                        <button
                                            onClick={() => setFilter('incomplete')}
                                            className={`shrink-0 px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${filter === 'incomplete'
                                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30'
                                                }`}
                                        >
                                            <AlertOctagon className="w-3.5 h-3.5" />
                                            Incomplets ({stats.incompleteCount})
                                        </button>
                                    </motion.div>

                                    {/* Games List */}
                                    <div className="space-y-3">
                                        {filteredGames.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
                                            >
                                                <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-emerald-500" />
                                                <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                                                    Parfait !
                                                </p>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                                    Aucun match dans cette catégorie
                                                </p>
                                            </motion.div>
                                        ) : (
                                            filteredGames.map((game, index) => (
                                                <GameCard key={game.id} game={game} index={index} />
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-100 dark:to-white text-white dark:text-slate-900 font-bold rounded-xl hover:shadow-lg transition-shadow"
                        >
                            Fermer
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AdminStats;
