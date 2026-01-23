import React, { useState } from 'react';
import { UserRegistration } from '../../types';
import { User } from 'firebase/auth';
import { Clock, MapPin, Trash2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmModal from '../ConfirmModal';

interface NextMissionCardProps {
    registration: UserRegistration;
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    user: User;
}

export const NextMissionCard: React.FC<NextMissionCardProps> = ({ registration, onUnsubscribe, user }) => {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleUnsubscribe = () => {
        setConfirmOpen(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl p-6 sm:p-8"
        >
            {/* Background Decor - Enhanced */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[120px] opacity-30 -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-[100px] opacity-30 translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full blur-[150px] opacity-10" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold text-indigo-200 mb-4"
                    >
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-2 h-2 rounded-full bg-emerald-400"
                        />
                        <Zap className="w-3 h-3" />
                        PROCHAINE MISSION
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl sm:text-3xl font-black leading-tight mb-3"
                    >
                        {registration.team} <span className="text-indigo-400">vs</span> {registration.opponent}
                    </motion.h2>

                    {/* Details */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap gap-4 text-sm text-slate-300 font-medium"
                    >
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            {registration.gameDate} à {registration.gameTime}
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            <MapPin className="w-4 h-4 text-indigo-400" />
                            {registration.location}
                        </div>
                    </motion.div>
                </div>

                {/* Role + Cancel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="flex items-center gap-4"
                >
                    <div className="text-right">
                        <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1.5">Votre Rôle</p>
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 0 }}
                            className="inline-block px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold shadow-xl shadow-indigo-900/50 transform rotate-1"
                        >
                            {registration.roleName}
                        </motion.div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleUnsubscribe}
                        className="flex-shrink-0 p-3 rounded-xl 
                                   bg-red-500/10 
                                   border border-red-500/30 
                                   text-red-400 
                                   transition-all duration-150"
                        title="Annuler ma participation"
                    >
                        <Trash2 className="w-5 h-5" />
                    </motion.button>
                </motion.div>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={() => {
                    onUnsubscribe(registration.gameId, registration.roleId, registration.volunteerName || user.displayName || "");
                    setConfirmOpen(false);
                }}
                title="Annuler ma venue ?"
                message="Êtes-vous sûr de vouloir annuler votre participation à ce match ?"
                confirmText="Confirmer l'annulation"
                confirmStyle="danger"
            />
        </motion.div>
    );
};
