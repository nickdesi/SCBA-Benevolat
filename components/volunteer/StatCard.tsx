import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient }) => {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-white/10 shadow-premium hover:shadow-2xl transition-all duration-300 cursor-default overflow-hidden"
        >
            {/* Elite Glass Depth Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 pointer-events-none" />

            {/* Dynamic Glow background */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full opacity-5 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-indigo-500/20 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500`}>
                    <div className="text-white drop-shadow-md">
                        {icon}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                        {label}
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                        {value}
                    </p>
                </div>
            </div>

            {/* Bottom Accent Line */}
            <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r ${gradient} transition-all duration-500 opacity-50`} />
        </motion.div>
    );
};
