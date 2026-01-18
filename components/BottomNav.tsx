import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedBallIcon } from './Icons';

interface BottomNavProps {
    currentView: 'home' | 'planning' | 'calendar';
    onViewChange: (view: 'home' | 'planning' | 'calendar') => void;
    onPlanningClick: () => void; // Opens ProfileModal
    isAuthenticated: boolean;
}

const BottomNav: React.FC<BottomNavProps> = memo(({
    currentView,
    onViewChange,
    onPlanningClick,
    isAuthenticated
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-premium border-t border-slate-200/50 dark:border-slate-700/50 pb-safe z-50 md:hidden shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.1)] bg-noise">
            <div className="flex justify-around items-center p-2">
                {/* Unified Planning Toggle */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onViewChange(currentView === 'calendar' ? 'home' : 'calendar')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20
                        ${(currentView === 'home' || currentView === 'calendar')
                            ? 'text-blue-600 bg-blue-50/80'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    {currentView === 'calendar' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M5.625 3.75a2.625 2.625 0 100 5.25h12.75a2.625 2.625 0 000-5.25H5.625zM3.75 11.25a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75zM3 15.75a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM3.75 18.75a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                        </svg>
                    )}
                    <span className="text-[10px] font-bold">{currentView === 'calendar' ? '📋 Liste' : '📅 Semaine'}</span>
                </motion.button>

                {/* Planning Button - Opens ProfileModal for authenticated users */}
                {isAuthenticated && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onPlanningClick}
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
