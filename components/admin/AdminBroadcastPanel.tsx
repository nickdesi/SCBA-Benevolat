import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Announcement } from '../../types';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { AlertTriangle, Info, Megaphone, Trash2, Send, Clock, X, List, CheckCircle2, Siren } from 'lucide-react';

interface AdminBroadcastPanelProps {
    onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

export const AdminBroadcastPanel: React.FC<AdminBroadcastPanelProps> = ({ onToast }) => {
    const { announcements } = useAnnouncements();
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'urgent'>('info');
    const [daysDuration, setDaysDuration] = useState(7);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            const now = new Date();
            const expiresAt = new Date(now);
            expiresAt.setDate(now.getDate() + daysDuration);

            await addDoc(collection(db, 'announcements'), {
                message,
                type,
                active: true,
                createdAt: serverTimestamp(),
                expiresAt: expiresAt,
                createdBy: 'admin',
                target: 'all'
            });

            setMessage('');
            setType('info');
            onToast("Annonce publiée avec succès", 'success');
        } catch (error) {
            console.error("Error creating announcement", error);
            onToast("Erreur lors de la création", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Supprimer cette annonce ?")) return;
        try {
            await updateDoc(doc(db, 'announcements', id), {
                active: false
            });
            onToast("Annonce supprimée", 'success');
        } catch (error) {
            console.error("Error deleting", error);
            onToast("Erreur lors de la suppression", 'error');
        }
    };

    const getTypeStyles = (t: string) => {
        switch (t) {
            case 'urgent': return 'bg-red-600 border-red-500 shadow-red-500/30';
            case 'warning': return 'bg-orange-500 border-orange-400 shadow-orange-500/30';
            default: return 'bg-blue-600 border-blue-500 shadow-blue-500/30';
        }
    };

    const getTypeIcon = (t: string) => {
        switch (t) {
            case 'urgent': return <Siren className="w-4 h-4" />;
            case 'warning': return <AlertTriangle className="w-4 h-4" />;
            default: return <Info className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Creation Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm shadow-sm"
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        Nouvelle Annonce
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Message Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none h-28 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder="Ex: Match M1 annulé ce soir..."
                            required
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Type Selection */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Priorité
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['info', 'warning', 'urgent'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t as any)}
                                        className={`
                                            px-2 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all border
                                            ${type === t
                                                ? `${getTypeStyles(t)} text-white scale-105 shadow-lg`
                                                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        {getTypeIcon(t)}
                                        <span className="capitalize">{t}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Durée
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                <select
                                    value={daysDuration}
                                    onChange={(e) => setDaysDuration(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <option value={1}>24h (Flash)</option>
                                    <option value={3}>3 jours (Court)</option>
                                    <option value={7}>1 semaine (Standard)</option>
                                    <option value={30}>1 mois (Long)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Preview (Live) */}
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Aperçu en direct</p>
                                    <div className={`p-4 rounded-xl flex items-center gap-3 text-white shadow-lg ${getTypeStyles(type)}`}>
                                        {getTypeIcon(type)}
                                        <span className="font-bold text-sm md:text-base">{message}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm uppercase tracking-wide hover:shadow-xl hover:shadow-slate-500/20 dark:hover:shadow-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" /> Publier maintenant
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>

            {/* Active List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 px-1">
                    <List className="w-4 h-4" />
                    En cours ({announcements.length})
                </h3>

                <div className="space-y-3">
                    <AnimatePresence mode='popLayout'>
                        {announcements.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"
                            >
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                <p className="text-slate-400 font-medium text-sm">Aucune annonce active</p>
                            </motion.div>
                        ) : (
                            announcements.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="show"
                                    exit="exit"
                                    className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg
                                            ${getTypeStyles(item.type)}
                                        `}>
                                            {getTypeIcon(item.type)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm md:text-base leading-snug">
                                                {item.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                <span>Expire le {item.expiresAt?.toDate().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, color: '#ef4444' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-slate-300 dark:text-slate-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </motion.button>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
