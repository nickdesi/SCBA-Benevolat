import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, UserRoundPlus, MapPin, Check, Clock, Calendar, Users, Phone } from 'lucide-react';
import type { UserCarpoolRegistration } from '../../utils/useCarpoolRegistrations';

interface CarpoolListProps {
    carpools: UserCarpoolRegistration[];
    onRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
}

// Animation variants with proper typing
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'tween' as const, duration: 0.15 }
    }
};

// Helper: check if carpool is upcoming
const isCarpoolUpcoming = (gameDateISO: string, gameTime?: string): boolean => {
    if (!gameDateISO) return true;
    const now = new Date();
    const todayISO = now.toLocaleDateString('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

    if (gameDateISO > todayISO) return true;
    if (gameDateISO < todayISO) return false;

    if (gameDateISO === todayISO && gameTime) {
        const [hStr, mStr] = gameTime.split(/[h:]/);
        const h = parseInt(hStr, 10);
        if (!isNaN(h) && now.getHours() > h + 3) return false;
    }
    return true;
};

export const CarpoolList: React.FC<CarpoolListProps> = ({ carpools = [], onRemoveCarpool }) => {
    const [showHistory, setShowHistory] = useState(false);

    // Split upcoming vs past - handle empty/undefined carpools safely
    const { upcoming, past } = useMemo(() => {
        const result: { upcoming: UserCarpoolRegistration[], past: UserCarpoolRegistration[] } = { upcoming: [], past: [] };
        if (!carpools || carpools.length === 0) return result;

        carpools.forEach(c => {
            if (isCarpoolUpcoming(c.gameDateISO, c.gameTime)) {
                result.upcoming.push(c);
            } else {
                result.past.push(c);
            }
        });
        return result;
    }, [carpools]);

    const displayedCarpools = showHistory ? carpools : upcoming;

    // Handle empty or undefined carpools
    if (!carpools || carpools.length === 0) {
        return (
            <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <h3 className="flex items-center gap-3 font-bold text-slate-800 dark:text-white mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                        <Car className="w-4 h-4" />
                    </div>
                    Mes Covoiturages
                </h3>
                <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 mb-3">
                        <Car className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        Aucun covoiturage
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                        Inscrivez-vous sur un match extérieur !
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-3 font-bold text-slate-800 dark:text-white">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                        <Car className="w-4 h-4" />
                    </div>
                    Mes Covoiturages
                </h3>
                {past.length > 0 && (
                    <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showHistory}
                            onChange={(e) => setShowHistory(e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-600"
                        />
                        Voir historique
                    </label>
                )}
            </div>

            {/* Carpool List */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
            >
                <AnimatePresence mode="popLayout">
                    {displayedCarpools.map((carpool) => (
                        <CarpoolCard
                            key={carpool.id}
                            carpool={carpool}
                            onRemove={() => onRemoveCarpool(carpool.gameId, carpool.id)}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Summary */}
            {upcoming.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        {upcoming.length} covoiturage{upcoming.length > 1 ? 's' : ''} à venir
                    </p>
                </div>
            )}
        </div>
    );
};

// Individual Carpool Card
interface CarpoolCardProps {
    carpool: UserCarpoolRegistration;
    onRemove: () => void;
}

const CarpoolCard: React.FC<CarpoolCardProps> = ({ carpool }) => {
    const isDriver = carpool.type === 'driver';
    const isMatched = carpool.status === 'matched';
    const isPending = carpool.status === 'pending';
    const isUpcoming = isCarpoolUpcoming(carpool.gameDateISO, carpool.gameTime);

    return (
        <motion.div
            variants={itemVariants}
            layout
            className={`
                relative overflow-hidden rounded-xl border transition-all duration-200
                ${isDriver
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
                    : isMatched
                        ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800'
                        : isPending
                            ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }
                ${!isUpcoming ? 'opacity-60' : ''}
            `}
        >
            <div className="p-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Type Badge */}
                        <span className={`
                            flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold
                            ${isDriver
                                ? 'bg-blue-500 text-white'
                                : 'bg-amber-500 text-white'
                            }
                        `}>
                            {isDriver ? <Car className="w-3 h-3" /> : <UserRoundPlus className="w-3 h-3" />}
                            {isDriver ? 'Conducteur' : 'Passager'}
                        </span>

                        {/* Status Badge */}
                        {isMatched && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg">
                                <Check className="w-3 h-3" />
                                Confirmé
                            </span>
                        )}
                        {isPending && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg animate-pulse">
                                <Clock className="w-3 h-3" />
                                En attente
                            </span>
                        )}
                    </div>

                    {/* Seats/Passengers Info */}
                    {isDriver && (
                        <div className="flex items-center gap-1.5">
                            {carpool.pendingRequestsCount && carpool.pendingRequestsCount > 0 && (
                                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg">
                                    {carpool.pendingRequestsCount} demande{carpool.pendingRequestsCount > 1 ? 's' : ''}
                                </span>
                            )}
                            <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium rounded-lg">
                                <Users className="w-3 h-3" />
                                {carpool.matchedPassengersCount || 0}/{carpool.seats || 1}
                            </span>
                        </div>
                    )}
                </div>

                {/* Match Info */}
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span>{carpool.team}</span>
                    <span className="text-slate-400">vs</span>
                    <span>{carpool.opponent}</span>
                </div>

                {/* Date & Location */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {carpool.gameDate} • {carpool.gameTime}
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {carpool.location}
                    </span>
                </div>

                {/* Driver departure location */}
                {isDriver && carpool.departureLocation && (
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Départ: {carpool.departureLocation}
                    </p>
                )}

                {/* Matched driver info (for passengers) */}
                {!isDriver && isMatched && carpool.matchedDriverName && (
                    <div className="mt-2 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Avec {carpool.matchedDriverName}
                        </p>
                        {carpool.matchedDriverPhone && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {carpool.matchedDriverPhone}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CarpoolList;
