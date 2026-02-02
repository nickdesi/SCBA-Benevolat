import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { List, Calendar } from 'lucide-react';
import { AnimatedBallIcon } from './Icons';

interface BottomNavProps {
    currentView: 'home' | 'planning' | 'calendar';
    onViewChange: (view: 'home' | 'planning' | 'calendar') => void;
    onPlanningClick: () => void; // Opens ProfileModal
    isAuthenticated: boolean;
}

import { triggerHaptic } from '../utils/haptics';

const BottomNav: React.FC<BottomNavProps> = memo(({
    currentView,
    onViewChange,
    onPlanningClick,
    isAuthenticated
}) => {
    const handleViewChange = useCallback((view: 'home' | 'calendar') => {
        if (currentView !== view) {
            triggerHaptic(6); // Short, sharp click for switching
            onViewChange(view);
        }
    }, [currentView, onViewChange]);

    const handlePlanningClick = useCallback(() => {
        triggerHaptic([10, 30, 10]); // Premium double-tap pattern
        onPlanningClick();
    }, [onPlanningClick]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border-t border-white/20 dark:border-slate-800/50 pb-safe z-50 md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
            {/* Subtle Inner Glow Layer */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="flex justify-between items-center px-6 py-3 gap-4 relative z-10">
                {/* View Switcher (Elite Pill) */}
                <div className="flex-1 max-w-[210px] h-12 bg-slate-200/50 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-full flex relative overflow-hidden border border-white/10 dark:border-slate-700/50">
                    <button
                        onClick={() => handleViewChange('home')}
                        className={`flex-1 relative z-10 flex items-center justify-center gap-2 text-xs font-black transition-colors duration-300 ${currentView === 'home' ? 'text-slate-900 dark:text-white' : 'text-slate-500/80 dark:text-slate-400'}`}
                    >
                        <List className={`w-4 h-4 transition-transform duration-300 ${currentView === 'home' ? 'scale-110' : 'scale-90 opacity-70'}`} />
                        <span>Liste</span>
                        {currentView === 'home' && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-white dark:bg-indigo-500 rounded-full shadow-lg dark:shadow-indigo-500/40 -z-10 border border-black/5 dark:border-white/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleViewChange('calendar')}
                        className={`flex-1 relative z-10 flex items-center justify-center gap-2 text-xs font-black transition-colors duration-300 ${currentView === 'calendar' ? 'text-slate-900 dark:text-white' : 'text-slate-500/80 dark:text-slate-400'}`}
                    >
                        <Calendar className={`w-4 h-4 transition-transform duration-300 ${currentView === 'calendar' ? 'scale-110' : 'scale-90 opacity-70'}`} />
                        <span>Semaine</span>
                        {currentView === 'calendar' && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-white dark:bg-indigo-500 rounded-full shadow-lg dark:shadow-indigo-500/40 -z-10 border border-black/5 dark:border-white/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                </div>

                {/* Mon Espace (Elite Monomorphic Button) */}
                {isAuthenticated && (
                    <motion.button
                        whileTap={{ scale: 0.92, y: 1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={handlePlanningClick}
                        className="h-12 px-6 bg-slate-900 dark:bg-indigo-500 text-white rounded-full flex items-center gap-2.5 shadow-xl shadow-slate-900/20 dark:shadow-indigo-500/40 border border-white/20 active:brightness-110 transition-all duration-200"
                    >
                        <div className="relative">
                            <AnimatedBallIcon className="w-5 h-5 relative z-10" />
                            <div className="absolute inset-0 bg-white blur-md opacity-20 dark:opacity-40 animate-pulse" />
                        </div>
                        <span className="text-xs font-black tracking-tight uppercase">Mon Espace</span>
                    </motion.button>
                )}
            </div>
        </div>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
