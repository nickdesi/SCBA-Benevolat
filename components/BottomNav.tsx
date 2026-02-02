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

// Haptic feedback utility
const triggerHaptic = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
};

const BottomNav: React.FC<BottomNavProps> = memo(({
    currentView,
    onViewChange,
    onPlanningClick,
    isAuthenticated
}) => {
    const handleViewChange = useCallback(() => {
        triggerHaptic(8); // Light tap
        onViewChange(currentView === 'calendar' ? 'home' : 'calendar');
    }, [currentView, onViewChange]);

    const handlePlanningClick = useCallback(() => {
        triggerHaptic([5, 20, 5]); // Double tap pattern
        onPlanningClick();
    }, [onPlanningClick]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-premium border-t border-slate-200/50 dark:border-slate-700/50 pb-safe z-50 md:hidden shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.1)] bg-noise">
            <div className="flex justify-around items-center p-2">
                {/* Unified Planning Toggle */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                    onClick={handleViewChange}
                    aria-label={currentView === 'calendar' ? "Passer à la vue liste" : "Passer à la vue calendrier"}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20
                        ${(currentView === 'home' || currentView === 'calendar')
                            ? 'text-blue-600 bg-blue-50/80'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    {currentView === 'calendar' ? (
                        <List className="w-6 h-6" aria-hidden="true" />
                    ) : (
                        <Calendar className="w-6 h-6" aria-hidden="true" />
                    )}
                    <span className="text-[10px] font-bold flex items-center gap-1">
                        {currentView === 'calendar' ? <><List className="w-3 h-3" /> Liste</> : <><Calendar className="w-3 h-3" /> Semaine</>}
                    </span>
                </motion.button>

                {/* Planning Button - Opens ProfileModal for authenticated users */}
                {isAuthenticated && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                        onClick={handlePlanningClick}
                        aria-label="Ouvrir mon profil et mes matchs"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity" />
                        <AnimatedBallIcon className="w-6 h-6 relative z-10" />
                        <span className="text-[10px] font-bold relative z-10">Mes Matchs</span>
                    </motion.button>
                )}


            </div>
        </div>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
