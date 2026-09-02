import React, { memo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { List, Calendar, User, LogIn } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface BottomNavProps {
  currentView: 'home' | 'planning' | 'calendar';
  onViewChange: (view: 'home' | 'planning' | 'calendar') => void;
  onPlanningClick: () => void; // Opens ProfileModal / Auth
  isAuthenticated: boolean;
}

const BottomNav: React.FC<BottomNavProps> = memo(
  ({ currentView, onViewChange, onPlanningClick, isAuthenticated }) => {
    const prefersReducedMotion = useReducedMotion();

    const handleViewChange = useCallback(
      (view: 'home' | 'calendar') => {
        if (currentView !== view) {
          triggerHaptic(6);
          onViewChange(view);
        }
      },
      [currentView, onViewChange],
    );

    const handlePlanningClick = useCallback(() => {
      triggerHaptic([8, 20, 8]);
      onPlanningClick();
    }, [onPlanningClick]);

    return (
      <nav
        aria-label="Navigation principale"
        className="fixed bottom-3.5 left-4 right-4 z-50 md:hidden max-w-md mx-auto"
      >
        {/* Native Frosted Glass Shell with 1px border & soft elevation */}
        <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/92 dark:bg-slate-900/92 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl p-1.5 transition-all">
          <div
            role="tablist"
            aria-label="Navigation principale"
            className="grid grid-cols-3 gap-1.5 items-center"
          >
            {/* Tab 1: Liste des Matchs */}
            <motion.button
              type="button"
              role="tab"
              aria-selected={currentView === 'home'}
              aria-label="Afficher la liste des matchs"
              whileTap={{ scale: 0.94 }}
              onClick={() => handleViewChange('home')}
              className={`relative flex h-13 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer select-none ${
                currentView === 'home'
                  ? 'text-white font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold'
              }`}
            >
              {currentView === 'home' && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 rounded-xl bg-[#3629e1] shadow-sm shadow-[#3629e1]/40"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 450, damping: 35 }
                  }
                />
              )}
              <div className="relative z-10">
                <List
                  className="w-5 h-5"
                  strokeWidth={currentView === 'home' ? 2.5 : 2}
                  aria-hidden="true"
                />
              </div>
              <span className="relative z-10 text-xs font-black tracking-tight uppercase">
                Matchs
              </span>
            </motion.button>

            {/* Tab 2: Calendrier Semaine */}
            <motion.button
              type="button"
              role="tab"
              aria-selected={currentView === 'calendar'}
              aria-label="Afficher le planning de la semaine"
              whileTap={{ scale: 0.94 }}
              onClick={() => handleViewChange('calendar')}
              className={`relative flex h-13 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer select-none ${
                currentView === 'calendar'
                  ? 'text-white font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold'
              }`}
            >
              {currentView === 'calendar' && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 rounded-xl bg-[#3629e1] shadow-sm shadow-[#3629e1]/40"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 450, damping: 35 }
                  }
                />
              )}
              <div className="relative z-10">
                <Calendar
                  className="w-5 h-5"
                  strokeWidth={currentView === 'calendar' ? 2.5 : 2}
                  aria-hidden="true"
                />
              </div>
              <span className="relative z-10 text-xs font-black tracking-tight uppercase">
                Semaine
              </span>
            </motion.button>

            {/* Tab 3: Mon Espace (Authentifié) OU Connexion */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={handlePlanningClick}
              className={`relative flex h-13 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer select-none ${
                isAuthenticated
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-[#3629e1] dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 font-bold'
              }`}
              aria-label={isAuthenticated ? 'Mon espace bénévole' : 'Se connecter'}
            >
              <div className="relative z-10">
                {isAuthenticated ? (
                  <User className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <LogIn className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />
                )}
              </div>
              <span className="relative z-10 text-xs font-black tracking-tight uppercase">
                {isAuthenticated ? 'Mon Profil' : 'Connexion'}
              </span>
            </motion.button>
          </div>
        </div>
      </nav>
    );
  },
);

BottomNav.displayName = 'BottomNav';

export default BottomNav;
