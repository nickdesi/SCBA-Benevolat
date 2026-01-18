import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Announcement } from '../../types';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { AlertTriangle, Info, Megaphone, Trash2, Send, Clock, X } from 'lucide-react';

export const AdminBroadcastPanel: React.FC = () => {
    // We can reuse the same hook to list existing announcements
    const { announcements } = useAnnouncements();
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'urgent'>('info');
    const [daysDuration, setDaysDuration] = useState(7);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter to show active and recently inactive? 
    // The hook only returns ACTIVE ones. 
    // We might want to see inactive ones too? 
    // For now, let's just manage active ones (to delete them).

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
                expiresAt: expiresAt, // Firestore will convert Date to Timestamp
                createdBy: 'admin', // In real app, use auth.currentUser.uid
                target: 'all'
            });

            setMessage('');
            setType('info'); // Reset to default
            // Optional: Show success toast
        } catch (error) {
            console.error("Error creating announcement", error);
            alert("Erreur lors de la création");
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
        } catch (error) {
            console.error("Error deleting", error);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Creation Form */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                    Nouvelle Annonce
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Message Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none h-24 bg-white text-slate-900 placeholder:text-slate-400"
                            placeholder="Ex: Match M1 annulé ce soir..."
                            required
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Type Selection */}
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Type & Priorité</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setType('info')}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all border ${type === 'info' ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <Info className="w-4 h-4" /> Info
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('warning')}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all border ${type === 'warning' ? 'bg-orange-500 text-white border-orange-500 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <AlertTriangle className="w-4 h-4" /> Warn
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('urgent')}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all border ${type === 'urgent' ? 'bg-red-600 text-white border-red-600 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <AlertTriangle className="w-4 h-4" /> Urgent
                                </button>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="w-full md:w-1/3">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Durée (jours)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={daysDuration}
                                    onChange={(e) => setDaysDuration(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-slate-900 cursor-pointer"
                                >
                                    <option value={1}>24h</option>
                                    <option value={3}>3 jours</option>
                                    <option value={7}>1 semaine</option>
                                    <option value={30}>1 mois</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Preview (Small) */}
                    {message && (
                        <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Aperçu :</p>
                            <div className={`
                                p-3 rounded-lg flex items-center gap-3 text-white shadow-sm
                                ${type === 'urgent' ? 'bg-red-600 animate-pulse' : type === 'warning' ? 'bg-orange-500' : 'bg-blue-600'}
                             `}>
                                {type === 'urgent' || type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                <span className="text-sm font-medium">{message}</span>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" /> Publier l'annonce
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Active List */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Annonces Actives ({announcements.length})</h3>
                <div className="space-y-3">
                    {announcements.length === 0 ? (
                        <p className="text-slate-400 text-center py-4 italic">Aucune annonce en cours</p>
                    ) : (
                        announcements.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between gap-4 group hover:border-slate-300 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white
                                        ${item.type === 'urgent' ? 'bg-red-600' : item.type === 'warning' ? 'bg-orange-500' : 'bg-blue-600'}
                                    `}>
                                        {item.type === 'urgent' || item.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{item.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Expire le : {item.expiresAt?.toDate().toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
