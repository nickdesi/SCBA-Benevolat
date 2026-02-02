import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, UserRoundPlus, MapPin, Check, Clock, Calendar, Users, Phone } from 'lucide-react';
import type { UserCarpoolRegistration } from '../../utils/useCarpoolRegistrations';
import { triggerHaptic } from '../../utils/haptics';

interface CarpoolListProps {
    carpools: UserCarpoolRegistration[];
    onRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
}

// Elite Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            bounce: 0.3,
            duration: 0.8
        }
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

    // Split upcoming vs past
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

    return (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-6 shadow-premium border border-white/10 dark:border-white/5 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center gap-3 font-black text-slate-800 dark:text-white tracking-tight">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-xl shadow-blue-500/20 transform rotate-3">
                        <Car className="w-5 h-5" />
                    </div>
                    Covoiturages
                </h3>
                {past.length > 0 && (
                    <label className="flex items-center gap-3 text-[11px] font-black text-slate-500 dark:text-slate-400 cursor-pointer select-none uppercase tracking-widest hover:text-indigo-500 transition-colors">
                        <input
                            type="checkbox"
                            checked={showHistory}
                            onChange={(e) => {
                                triggerHaptic('light');
                                setShowHistory(e.target.checked);
                            }}
                            className="w-4 h-4 rounded-md text-indigo-600 focus:ring-offset-0 focus:ring-indigo-500 border-slate-300 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 transition-all"
                        />
                        Historique
                    </label>
                )}
            </div>

            {/* Carpool List */}
            {carpools.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem]"
                >
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 opacity-50">
                        <Car className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                        Rien à signaler
                    </p>
                    <p className="text-slate-400 dark:text-slate-600 text-[11px] mt-2 font-medium">
                        Pensez aux matchs extérieurs !
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
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
            )}

            {/* Summary */}
            {upcoming.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest">
                        {upcoming.length} trajet{upcoming.length > 1 ? 's' : ''} actif{upcoming.length > 1 ? 's' : ''}
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
            whileHover={{ scale: 1.02 }}
            className={`
                relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-premium
                ${isDriver
                    ? 'bg-gradient-to-br from-indigo-500/5 to-blue-600/10 border-blue-500/20 dark:border-blue-500/10'
                    : isMatched
                        ? 'bg-gradient-to-br from-emerald-500/5 to-teal-600/10 border-emerald-500/20 dark:border-emerald-500/10'
                        : isPending
                            ? 'bg-gradient-to-br from-amber-500/5 to-orange-600/10 border-amber-500/20 dark:border-amber-500/10'
                            : 'bg-white/5 dark:bg-slate-800/20 border-white/10 dark:border-white/5'
                }
                ${!isUpcoming ? 'opacity-50 grayscale-[0.5]' : ''}
            `}
        >
            <div className="p-4">
                {/* reflection flair */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-wrap gap-2 min-w-0 flex-1">
                        <span className={`
                            flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm
                            ${isDriver ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'}
                        `}>
                            {isDriver ? <Car className="w-3.5 h-3.5" /> : <UserRoundPlus className="w-3.5 h-3.5" />}
                            {isDriver ? 'Conducteur' : 'Passager'}
                        </span>

                        {isMatched && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                                <Check className="w-3.5 h-3.5" />
                                Validé
                            </span>
                        )}
                        {isPending && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                Attente
                            </span>
                        )}
                    </div>

                    {isDriver && (
                        <div className="flex items-center gap-2">
                            {carpool.pendingRequestsCount && carpool.pendingRequestsCount > 0 && (
                                <motion.span
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="px-2.5 py-1 bg-amber-400 text-white text-[10px] font-black rounded-full shadow-lg shadow-amber-500/30"
                                >
                                    !
                                </motion.span>
                            )}
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-full border border-white/10">
                                <Users className="w-3.5 h-3.5" />
                                {carpool.matchedPassengersCount || 0}/{carpool.seats || 1}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2.5 text-base font-black text-slate-800 dark:text-white tracking-tight mb-2">
                    <span>{carpool.team}</span>
                    <span className="text-indigo-500 opacity-40">vs</span>
                    <span>{carpool.opponent}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {carpool.gameDate} • {carpool.gameTime}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        {carpool.location}
                    </span>
                </div>

                {isDriver && carpool.departureLocation && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2"
                    >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>Départ: {carpool.departureLocation}</span>
                    </motion.div>
                )}

                {!isDriver && isMatched && carpool.matchedDriverName && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-4 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20"
                    >
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-2 uppercase tracking-wide">
                            <Check className="w-4 h-4" />
                            Avec {carpool.matchedDriverName}
                        </p>
                        {carpool.matchedDriverPhone && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-500 font-bold flex items-center gap-2 mt-2 ml-1">
                                <Phone className="w-3.5 h-3.5" />
                                {carpool.matchedDriverPhone}
                            </p>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default CarpoolList;
