import React, { useMemo, useCallback } from 'react';
import { UserRegistration, Game } from '../../types';
import { User } from 'firebase/auth';
import { Briefcase, Star, Clock, Award, CalendarOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatCard } from './StatCard';
import { NextMissionCard } from './NextMissionCard';
import { MissionList } from './MissionList';
import { CarpoolList } from './CarpoolList';
import type { UserCarpoolRegistration } from '../../utils/useCarpoolRegistrations';
import { isGameUpcoming } from '../../utils/gameTimeUtils';
import { triggerHaptic } from '../../utils/haptics';

interface DashboardHomeProps {
    registrations: UserRegistration[];
    games: Game[];
    userCarpools: UserCarpoolRegistration[];
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    onRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
    allTeams: string[];
    favoriteTeams: string[];
    onToggleFavorite: (team: string) => Promise<void>;
    user: User;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
    registrations,
    games,
    userCarpools,
    onUnsubscribe,
    onRemoveCarpool,
    allTeams,
    favoriteTeams,
    onToggleFavorite,
    user
}) => {
    // Optimized Stats Calculation
    const stats = useMemo(() => {
        const totalMissions = registrations.length;
        const totalHours = totalMissions * 2;

        const roleCounts = registrations.reduce((acc, curr) => {
            acc[curr.roleName] = (acc[curr.roleName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const favoriteRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Aucun';

        return { totalMissions, totalHours, favoriteRole };
    }, [registrations]);

    // Enhanced toggle favorite with haptic
    const handleToggleFavorite = useCallback((team: string) => {
        triggerHaptic('light');
        onToggleFavorite(team);
    }, [onToggleFavorite]);

    // Find Next Mission
    const nextMission = useMemo(() => {
        const future = registrations.filter(r => isGameUpcoming(r));
        return future.sort((a, b) => (a.gameDateISO || '').localeCompare(b.gameDateISO || ''))[0];
    }, [registrations]);

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-8">
            {/* Elite Welcome & Stats Grid */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4"
            >
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-200 dark:to-slate-400">
                        Top {user.displayName?.split(' ')[0]}
                    </h1>
                    <motion.div
                        animate={{ rotate: [0, 20, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Sparkles className="w-6 h-6 text-amber-500 drop-shadow-lg" />
                    </motion.div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-tight">
                    Votre dévouement propulse le club. Voici votre bilan d'élite.
                </p>
            </motion.div>

            {/* Elite Stats Cards Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5"
            >
                <StatCard
                    label="Missions Totales"
                    value={stats.totalMissions}
                    icon={<Briefcase className="w-5 h-5" />}
                    gradient="from-indigo-500 via-violet-600 to-purple-700"
                />
                <StatCard
                    label="Heures (Estimées)"
                    value={`${stats.totalHours}h`}
                    icon={<Clock className="w-5 h-5" />}
                    gradient="from-emerald-400 via-teal-500 to-cyan-600"
                />
                <StatCard
                    label="Rôle Favori"
                    value={stats.favoriteRole}
                    icon={<Star className="w-5 h-5" />}
                    gradient="from-amber-400 via-orange-500 to-rose-600"
                />
            </motion.div>

            {/* Next Mission Spotlight */}
            <div className="relative group">
                {nextMission ? (
                    <NextMissionCard registration={nextMission} onUnsubscribe={onUnsubscribe} user={user} />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden rounded-[2rem] bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-xl p-10 text-center border border-slate-200 dark:border-white/5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                        <CalendarOff className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600 animate-pulse" />
                        <h3 className="text-xl font-black text-slate-700 dark:text-slate-200 mb-2">
                            Aucun match au planning
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                            Le club a besoin de vous ! Allez jeter un œil au planning pour vous inscrire.
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Main Content Split: Missions & Preferences */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Missions List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2"
                >
                    <MissionList
                        registrations={registrations}
                        onUnsubscribe={onUnsubscribe}
                        user={user}
                    />
                </motion.div>

                {/* Right Col: Preferences / Teams */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-8"
                >
                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-6 shadow-premium border border-white/10 dark:border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
                        <h3 className="flex items-center gap-3 font-black text-slate-800 dark:text-white mb-5 tracking-tight">
                            <div className="p-2.5 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-xl text-white shadow-xl shadow-amber-500/20 transform -rotate-3">
                                <Award className="w-5 h-5 shadow-sm" />
                            </div>
                            Mes Équipes
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-5 font-bold uppercase tracking-widest leading-relaxed">
                            Ceci filtrera votre vue planning automatiquement.
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                            {allTeams.map(team => {
                                const isFav = favoriteTeams.includes(team);
                                return (
                                    <motion.button
                                        key={team}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleToggleFavorite(team)}
                                        className={`px-4 py-2 rounded-full text-xs font-black transition-all duration-300 border ${isFav
                                            ? 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 border-transparent shadow-xl shadow-slate-950/20 dark:shadow-white/5 scale-105'
                                            : 'bg-white/5 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-indigo-400 dark:hover:border-indigo-500'
                                            }`}
                                    >
                                        {team}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Carpooling Section */}
                    <div className="relative">
                        <CarpoolList
                            carpools={userCarpools}
                            onRemoveCarpool={onRemoveCarpool}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
