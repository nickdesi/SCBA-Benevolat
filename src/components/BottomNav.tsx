import React, { memo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { List, Calendar } from 'lucide-react';
import { AnimatedBallIcon } from './Icons';

interface BottomNavProps {
  currentView: 'home' | 'planning' | 'calendar';
  onViewChange: (view: 'home' | 'planning' | 'calendar') => void;
  onPlanningClick: () => void; // Opens ProfileModal
  isAuthenticated: boolean;
}

import { triggerHaptic } from '../utils/haptics';

const BottomNav: React.FC<BottomNavProps> = memo(
  ({ currentView, onViewChange, onPlanningClick, isAuthenticated }) => {
    const prefersReducedMotion = useReducedMotion();

    const handleViewChange = useCallback(
      (view: 'home' | 'calendar') => {
        if (currentView !== view) {
          triggerHaptic(6); // Short, sharp click for switching
          onViewChange(view);
        }
      },
      [currentView, onViewChange],
    );

    const handlePlanningClick = useCallback(() => {
      triggerHaptic([10, 30, 10]); // Premium double-tap pattern
      onPlanningClick();
    }, [onPlanningClick]);

    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        <div className="absolute inset-0 rounded-2xl border border-white/35 bg-white/78 shadow-[0_12px_30px_rgba(18,31,47,0.18)] backdrop-blur-xl dark:border-slate-700/45 dark:bg-slate-900/78 dark:shadow-[0_12px_36px_rgba(0,0,0,0.42)]" />

        <div className="flex justify-between items-center p-2 gap-3 relative z-10">
          {/* View Switcher (Floating Pill) */}
          <div className="relative flex h-14 flex-1 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100/70 p-1 dark:border-slate-700/55 dark:bg-slate-800/55">
            <button
              onClick={() => handleViewChange('home')}
              className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors duration-300 ${currentView === 'home' ? 'text-slate-50' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <motion.div
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: currentView === 'home' ? 1.1 : 1,
                        rotate: currentView === 'home' ? [0, -10, 0] : 0,
                      }
                }
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <List className="w-5 h-5" />
              </motion.div>
              <span>Liste</span>
              {currentView === 'home' && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-lg border border-black/5 bg-gradient-to-r from-[#0f766e] to-[#c4492d] shadow-sm dark:border-white/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
            <button
              onClick={() => handleViewChange('calendar')}
              className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors duration-300 ${currentView === 'calendar' ? 'text-slate-50' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <motion.div
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: currentView === 'calendar' ? 1.1 : 1,
                        rotate: currentView === 'calendar' ? [0, 10, 0] : 0,
                      }
                }
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Calendar className="w-5 h-5" />
              </motion.div>
              <span>Semaine</span>
              {currentView === 'calendar' && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-lg border border-black/5 bg-gradient-to-r from-[#0f766e] to-[#c4492d] shadow-sm dark:border-white/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
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
              className="group relative flex h-14 aspect-square flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-[#c4492d] to-[#c59a3a] text-white shadow-lg shadow-[#c4492d]/30 dark:border-white/15 dark:from-[#0f766e] dark:to-[#c4492d] dark:shadow-[#0f766e]/30"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.div
                animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                transition={
                  prefersReducedMotion
                    ? undefined
                    : { duration: 20, repeat: Infinity, ease: 'linear' }
                }
              >
                <AnimatedBallIcon className="w-6 h-6" />
              </motion.div>
              <span className="text-[9px] font-black uppercase tracking-tight">Moi</span>
            </motion.button>
          )}
        </div>
      </div>
    );
  },
);

BottomNav.displayName = 'BottomNav';

export default BottomNav;
