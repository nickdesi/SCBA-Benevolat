import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { UserRegistration } from '../../types';
import { User } from 'firebase/auth';
import { Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { isGameUpcoming } from '../../utils/gameTimeUtils';

interface MissionListProps {
    registrations: UserRegistration[];
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    user: User;
}

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
    hidden: { opacity: 0, x: -6 },
    show: {
        opacity: 1,
        x: 0,
        transition: { type: "tween", duration: 0.12, ease: "easeOut" }
    },
    exit: { opacity: 0, x: 6, transition: { duration: 0.08 } }
};

export const MissionList: React.FC<MissionListProps> = ({ registrations, onUnsubscribe, user }) => {
    const [showHistory, setShowHistory] = useState(false);

    // Filter logic
    const filtered = registrations.filter(r => {
        if (showHistory) return true;
        return isGameUpcoming(r);
    });

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = (reg: UserRegistration) => {
        onUnsubscribe(reg.gameId, reg.roleId, reg.volunteerName || user.displayName || "");
        setDeleteId(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                        <Calendar className="w-4 h-4" />
                    </div>
                    Planning des Missions
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={showHistory}
                        onChange={e => setShowHistory(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                    />
                    Voir historique
                </label>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"
                    >
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="font-bold text-slate-500 dark:text-slate-400">Aucune mission</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Inscrivez-vous à un match !</p>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-2"
                    >
                        <AnimatePresence mode='popLayout'>
                            {filtered.map((reg) => (
                                <motion.div
                                    key={reg.id}
                                    variants={itemVariants}
                                    layout
                                    exit="exit"
                                    className="group flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md"
                                >
                                    {/* Date Badge */}
                                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl flex flex-col items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-100 dark:border-slate-600">
                                        <span className="text-[10px] opacity-70">{reg.gameDate?.split(' ')[0].substring(0, 3)}</span>
                                        <span className="text-lg leading-none font-black">{reg.gameDate?.match(/\d+/)?.[0]}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-grow min-w-0">
                                        <h4 className="font-bold text-slate-800 dark:text-white truncate text-sm">
                                            {reg.team} vs {reg.opponent}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 font-bold text-indigo-600 dark:text-indigo-300">
                                                {reg.roleName}
                                            </span>
                                            <span className="text-slate-400">•</span>
                                            <span>{reg.gameTime}</span>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1, color: '#ef4444' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setDeleteId(reg.id)}
                                        className="p-2 text-slate-300 dark:text-slate-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Annuler ma venue"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </motion.button>

                                    {/* Delete Confirmation */}
                                    {deleteId === reg.id && (
                                        <ConfirmModal
                                            isOpen={true}
                                            title="Annuler ma venue ?"
                                            message={`Voulez-vous annuler votre participation pour le match contre ${reg.opponent} ?`}
                                            confirmText="Confirmer l'annulation"
                                            confirmStyle="danger"
                                            onConfirm={() => handleDelete(reg)}
                                            onCancel={() => setDeleteId(null)}
                                        />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};
