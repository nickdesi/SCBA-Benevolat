import React, { useState, useCallback } from 'react';
import { UserRegistration } from '../../types';
import { User } from 'firebase/auth';
import { Clock, MapPin, Trash2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../ConfirmModal';
import { triggerHaptic } from '../../utils/haptics';

interface NextMissionCardProps {
    registration: UserRegistration;
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    user: User;
}

export const NextMissionCard: React.FC<NextMissionCardProps> = ({ registration, onUnsubscribe, user }) => {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleUnsubscribe = useCallback(() => {
        triggerHaptic('medium');
        setConfirmOpen(true);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-[2rem] bg-slate-950/40 backdrop-blur-2xl text-white border border-white/10 shadow-3xl p-5 sm:p-6"
        >
            {/* High-End Background Decor */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-indigo-900/30 -z-10" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-400/30 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02]" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    {/* Premium Animated Badge */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 backdrop-blur-md rounded-full border border-indigo-500/30 text-[10px] font-black tracking-[0.1em] text-indigo-300 mb-4 uppercase"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                        Prochaine Mission
                    </motion.div>

                    {/* Title with Elite Typography */}
                    <h2 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight mb-3 first-letter:text-indigo-500">
                        {registration.team} <span className="text-white/30 font-light mx-1">vs</span> {registration.opponent}
                    </h2>

                    {/* Elite Details Badges */}
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-xl shadow-premium group/item hover:bg-white/10 transition-all">
                            <Clock className="w-3.5 h-3.5 text-indigo-400 group-hover/item:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-slate-200">
                                {registration.gameDate} <span className="text-white/30 ml-1">•</span> {registration.gameTime}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-xl shadow-premium group/item hover:bg-white/10 transition-all">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 group-hover/item:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-slate-200">{registration.location}</span>
                        </div>
                    </div>
                </div>

                {/* Role + Cancel Experience */}
                <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="text-right">
                        <p className="text-[9px] uppercase text-indigo-300/90 font-black tracking-[0.2em] mb-1 px-1">Poste</p>
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 0 }}
                            className="relative px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full font-black shadow-xl shadow-indigo-500/30 transform rotate-1 text-xs tracking-wide overflow-hidden group/role"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/role:translate-x-[100%] transition-transform duration-700 slant" />
                            <div className="relative z-10 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-indigo-200" />
                                {registration.roleName}
                            </div>
                        </motion.div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.25)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleUnsubscribe}
                        className="flex-shrink-0 p-3 rounded-full bg-red-400/20 dark:bg-red-400/10 border border-red-400/30 text-red-500 dark:text-red-400 shadow-lg shadow-red-500/10 transition-all duration-300"
                        title="Annuler ma participation"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {confirmOpen && (
                    <ConfirmModal
                        isOpen={confirmOpen}
                        onCancel={() => {
                            triggerHaptic('light');
                            setConfirmOpen(false);
                        }}
                        onConfirm={() => {
                            triggerHaptic('success');
                            onUnsubscribe(registration.gameId, registration.roleId, registration.volunteerName || user.displayName || "");
                            setConfirmOpen(false);
                        }}
                        title="Annuler ma venue ?"
                        message="Êtes-vous sûr de vouloir annuler votre participation à ce match ?"
                        confirmText="Confirmer l'annulation"
                        confirmStyle="danger"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
