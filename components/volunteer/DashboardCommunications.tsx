import React from 'react';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { AlertTriangle, Info, Bell, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardComm: React.FC = () => {
    const { announcements } = useAnnouncements();

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30 transform -rotate-6">
                    <Bell className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Communication Club</h2>
                <p className="text-slate-500 dark:text-slate-400">Restez informé des dernières nouvelles et infos urgentes.</p>
            </div>

            <div className="space-y-4">
                {announcements.length === 0 ? (
                    <div className="p-8 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-400 font-medium">Aucune annonce club pour le moment.</p>
                    </div>
                ) : (
                    announcements.map((ann, index) => (
                        <motion.div
                            key={ann.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-5 rounded-2xl border-l-4 shadow-sm bg-white dark:bg-slate-800
                                ${ann.type === 'urgent' ? 'border-l-red-500' :
                                    ann.type === 'warning' ? 'border-l-orange-500' :
                                        'border-l-blue-500'}
                            `}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full flex-shrink-0
                                    ${ann.type === 'urgent' ? 'bg-red-100 text-red-600' :
                                        ann.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                            'bg-blue-100 text-blue-600'}
                                `}>
                                    {ann.type === 'urgent' ? <AlertTriangle className="w-5 h-5" /> :
                                        ann.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                                            <Info className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <span className={`text-xs font-bold uppercase tracking-wider mb-1 block
                                            ${ann.type === 'urgent' ? 'text-red-500' :
                                                ann.type === 'warning' ? 'text-orange-500' :
                                                    'text-blue-500'}
                                        `}>
                                            {ann.type}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(ann.createdAt?.toMillis()).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                                        {ann.message}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
