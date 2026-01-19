import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRegistration } from '../../types';
import { User } from 'firebase/auth';
import { Calendar, Trash2 } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { EmptyState } from '../EmptyState';
import { isGameUpcoming } from '../../utils/gameTimeUtils';

interface MissionListProps {
    registrations: UserRegistration[];
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    user: User;
}

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
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Planning des Missions
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showHistory}
                        onChange={e => setShowHistory(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    Voir historique
                </label>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-600">
                {filtered.length === 0 ? (
                    <EmptyState
                        icon="📅"
                        title="Aucune mission"
                        description="Aucune autre mission trouvée."
                        variant="simple"
                        className="py-8"
                    />
                ) : (
                    <AnimatePresence mode='popLayout'>
                        {filtered.map((reg, index) => (
                            <motion.div
                                key={reg.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                            >
                                <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg flex flex-col items-center justify-center font-bold text-xs uppercase shadow-sm">
                                    <span>{reg.gameDate?.split(' ')[0].substring(0, 3)}</span>
                                    <span className="text-lg leading-none">{reg.gameDate?.match(/\d+/)?.[0]}</span>
                                </div>

                                <div className="flex-grow min-w-0">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                        {reg.team} vs {reg.opponent}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 font-semibold text-slate-600 dark:text-slate-300">
                                            {reg.roleName}
                                        </span>
                                        <span>• {reg.gameTime}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setDeleteId(reg.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Annuler ma venue"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Delete Confirmation for THIS item */}
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
                )}
            </div>
        </div>
    );
};
