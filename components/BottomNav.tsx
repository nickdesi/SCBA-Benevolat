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
                            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                    )}
                    <span className="text-[10px] font-bold">Planning</span>
                </motion.button>

                {/* Planning Button - Opens ProfileModal for authenticated users */}
                {isAuthenticated && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onPlanningClick}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 text-amber-600 hover:bg-amber-50"
                    >
                        <AnimatedBallIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Mes Matchs</span>
                    </motion.button>
                )}


            </div>
        </div>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
