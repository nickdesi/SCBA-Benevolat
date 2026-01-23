import React, { useMemo } from 'react';
import { UserRegistration, Game } from '../../types';
import { User } from 'firebase/auth';
import { Briefcase, Star, Clock, Award, CalendarOff } from 'lucide-react';
import { StatCard } from './StatCard';
import { NextMissionCard } from './NextMissionCard';
import { MissionList } from './MissionList';
import { isGameUpcoming } from '../../utils/gameTimeUtils';

interface DashboardHomeProps {
    registrations: UserRegistration[];
    games: Game[];
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    allTeams: string[];
    favoriteTeams: string[];
    onToggleFavorite: (team: string) => Promise<void>;
    user: User;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
    registrations,
    games,
    onUnsubscribe,
    allTeams,
    favoriteTeams,
    onToggleFavorite,
    user
}) => {
    // Stats Calculation
    const totalMissions = registrations.length;
    const totalHours = totalMissions * 2;

    // Calculate "Favorite Role"
    const roleCounts = registrations.reduce((acc, curr) => {
        acc[curr.roleName] = (acc[curr.roleName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const favoriteRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Aucun';

    // Find Next Mission
    const nextMission = useMemo(() => {
        const future = registrations.filter(r => isGameUpcoming(r));
        return future.sort((a, b) => (a.gameDateISO || '').localeCompare(b.gameDateISO || ''))[0];
    }, [registrations]);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Welcome & Stats Grid */}
            <div className="mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 mb-1">
                    Bonjour {user.displayName?.split(' ')[0]} 👋
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Prêt pour votre prochain match ? Voici votre activité.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                    label="Missions Totales"
                    value={totalMissions}
                    icon={<Briefcase className="w-5 h-5 text-white" />}
                    gradient="from-blue-500 to-indigo-600"
                />
                <StatCard
                    label="Heures (Estimées)"
                    value={`${totalHours}h`}
                    icon={<Clock className="w-5 h-5 text-white" />}
                    gradient="from-emerald-500 to-teal-600"
                />
                <StatCard
                    label="Rôle Favori"
                    value={favoriteRole}
                    icon={<Star className="w-5 h-5 text-white" />}
                    gradient="from-purple-500 to-pink-600"
                />
            </div>

            {/* Next Mission Spotlight */}
            {nextMission ? (
                <NextMissionCard registration={nextMission} onUnsubscribe={onUnsubscribe} user={user} />
            ) : (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-8 text-center border border-slate-200 dark:border-slate-700">
                    <CalendarOff className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Aucune mission prévue
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Consultez le planning général pour vous inscrire à un match et aider le club !
                    </p>
                </div>
            )}

            {/* Main Content Split: Missions & Preferences */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: Missions List */}
                <div className="lg:col-span-2">
                    <MissionList
                        registrations={registrations}
                        onUnsubscribe={onUnsubscribe}
                        user={user}
                    />
                </div>

                {/* Right Col: Preferences / Teams */}
                <div className="space-y-6">
                    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                        <h3 className="flex items-center gap-3 font-bold text-slate-800 dark:text-white mb-4">
                            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg text-white shadow-lg shadow-amber-500/20">
                                <Award className="w-4 h-4" />
                            </div>
                            Mes Équipes Favorites
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            Sélectionnez les équipes à afficher dans le planning.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {allTeams.map(team => (
                                <button
                                    key={team}
                                    onClick={() => onToggleFavorite(team)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 border ${favoriteTeams.includes(team)
                                            ? 'bg-gradient-to-r from-slate-800 to-slate-900 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 border-transparent shadow-lg'
                                            : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                                        }`}
                                >
                                    {team}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
