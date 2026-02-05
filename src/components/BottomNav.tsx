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
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/20 dark:border-slate-700/50" />

            <div className="flex justify-between items-center p-2 gap-3 relative z-10">
                {/* View Switcher (Floating Pill) */}
                <div className="flex-1 h-14 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl flex relative overflow-hidden p-1 border border-white/10 dark:border-white/5">
                    <button
                        onClick={() => handleViewChange('home')}
                        className={`flex-1 relative z-10 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors duration-300 ${currentView === 'home' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                        <motion.div
                            animate={{
                                scale: currentView === 'home' ? 1.1 : 1,
                                rotate: currentView === 'home' ? [0, -10, 0] : 0
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <List className="w-5 h-5" />
                        </motion.div>
                        <span>Liste</span>
                        {currentView === 'home' && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-black/5 dark:border-white/10 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleViewChange('calendar')}
                        className={`flex-1 relative z-10 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors duration-300 ${currentView === 'calendar' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                        <motion.div
                            animate={{
                                scale: currentView === 'calendar' ? 1.1 : 1,
                                rotate: currentView === 'calendar' ? [0, 10, 0] : 0
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Calendar className="w-5 h-5" />
                        </motion.div>
                        <span>Semaine</span>
                        {currentView === 'calendar' && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-black/5 dark:border-white/10 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                </div>

                {/* Mon Espace (Premium Action Button) */}
                {isAuthenticated && (
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={handlePlanningClick}
                        className="h-14 aspect-square bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-600 dark:to-indigo-500 text-white rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-slate-900/20 dark:shadow-indigo-500/30 border border-white/10 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            <AnimatedBallIcon className="w-6 h-6" />
                        </motion.div>
                        <span className="text-[9px] font-black uppercase tracking-tight">Moi</span>
                    </motion.button>
                )}
            </div>
        </div>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
