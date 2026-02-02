import React, { useState, useCallback } from 'react';
import { UserRegistration } from '../../types';
import { User } from 'firebase/auth';
import { Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../ConfirmModal';
import { isGameUpcoming } from '../../utils/gameTimeUtils';
import { triggerHaptic } from '../../utils/haptics';

interface MissionListProps {
    registrations: UserRegistration[];
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    user: User;
}

export const MissionList: React.FC<MissionListProps> = ({ registrations, onUnsubscribe, user }) => {
    const [showHistory, setShowHistory] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const filtered = registrations.filter(r => {
        if (showHistory) return true;
        return isGameUpcoming(r);
    });

    const handleDeleteClick = useCallback((id: string) => {
        triggerHaptic('medium');
        setDeleteId(id);
    }, []);

    const handleDelete = useCallback((reg: UserRegistration) => {
        triggerHaptic('success');
        onUnsubscribe(reg.gameId, reg.roleId, reg.volunteerName || user.displayName || "");
        setDeleteId(null);
    }, [onUnsubscribe, user.displayName]);

    return (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-6 shadow-premium border border-white/10 dark:border-white/5 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-3 tracking-tight">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-xl shadow-indigo-500/20 transform rotate-3">
                        <Calendar className="w-5 h-5" />
                    </div>
                    Planning
                </h3>
                <label className="flex items-center gap-3 text-[11px] font-black text-slate-500 dark:text-slate-400 cursor-pointer select-none uppercase tracking-widest hover:text-indigo-500 transition-colors group">
                    <input
                        type="checkbox"
                        checked={showHistory}
                        onChange={e => {
                            triggerHaptic('light');
                            setShowHistory(e.target.checked);
                        }}
                        className="w-4 h-4 rounded-md text-indigo-600 focus:ring-offset-0 focus:ring-indigo-500 border-slate-300 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 transition-all"
                    />
                    Voir historique
                </label>
            </div>

            {/* List */}
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem]"
                        >
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700 animate-pulse" />
                            <p className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs">Champ libre</p>
                            <p className="text-sm text-slate-400 dark:text-slate-600 mt-2 font-medium">Inscrivez-vous à un match !</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((reg) => (
                                <motion.div
                                    key={reg.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 border border-transparent hover:border-white/20 dark:hover:border-white/10 hover:shadow-xl relative overflow-hidden"
                                >
                                    {/* Glass reflection flair */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                                    {/* Date Badge Elite */}
                                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-700 dark:to-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex flex-col items-center justify-center font-black text-xs uppercase shadow-premium border border-white/50 dark:border-white/5 relative z-10 transition-transform group-hover:scale-105 group-hover:-rotate-3">
                                        <span className="text-[10px] opacity-60 tracking-tighter">{reg.gameDate?.split(' ')[0].substring(0, 3)}</span>
                                        <span className="text-xl leading-none tracking-tighter">{reg.gameDate?.match(/\d+/)?.[0]}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-grow min-w-0 relative z-10">
                                        <h4 className="font-black text-slate-800 dark:text-slate-100 truncate text-sm tracking-tight mb-1">
                                            {reg.team} <span className="text-indigo-500 font-bold opacity-50">vs</span> {reg.opponent}
                                        </h4>
                                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 shadow-sm">
                                                {reg.roleName}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            <span className="opacity-80 uppercase tracking-widest">{reg.gameTime}</span>
                                        </div>
                                    </div>

                                    {/* Delete Button Elite */}
                                    <motion.button
                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleDeleteClick(reg.id)}
                                        className="p-3 text-red-500 dark:text-red-400/60 hover:text-red-600 rounded-full transition-all relative z-10"
                                        title="Annuler ma venue"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </motion.button>

                                    {/* Delete Confirmation Overlay */}
                                    <AnimatePresence>
                                        {deleteId === reg.id && (
                                            <ConfirmModal
                                                isOpen={true}
                                                title="Annuler ?"
                                                message={`Voulez-vous vraiment annuler votre aide pour ${reg.team} ?`}
                                                confirmText="Annuler"
                                                confirmStyle="danger"
                                                onConfirm={() => handleDelete(reg)}
                                                onCancel={() => {
                                                    triggerHaptic('light');
                                                    setDeleteId(null);
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
