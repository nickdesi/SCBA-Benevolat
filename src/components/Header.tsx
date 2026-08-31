import React, { memo } from 'react';
import { motion } from 'framer-motion';
import UserProfile from './UserProfile';
import { ThemeToggle } from '../utils/ThemeContext';
import { useDraggableScroll } from '../hooks/useDraggableScroll';

interface HeaderProps {
  onLogout: () => void;
  teams?: string[];
  selectedTeam?: string | null;
  onSelectTeam?: (team: string | null) => void;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  isAdmin: boolean;
  onOpenAdminStats?: () => void;
  onOpenProfile: () => void;
  onOpenImport?: () => void;
}

const Header: React.FC<HeaderProps> = memo(
  ({
    isAdmin,
    teams = [],
    selectedTeam = null,
    onSelectTeam = (_team: string | null) => {},
    onToast = () => {},
    onOpenAdminStats = () => {},
    onOpenProfile,
    onOpenImport,
  }) => {
    const { ref: scrollRef, events: scrollEvents, style: scrollStyle } = useDraggableScroll();

    return (
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl transition-all duration-300 shadow-xs">
        {/* Dynamic Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/3 h-80 w-80 rounded-full bg-[#aa2e0f]/15 dark:bg-[#aa2e0f]/20 blur-3xl" />
          <div className="absolute -top-28 right-1/3 h-96 w-96 rounded-full bg-[#3629e1]/15 dark:bg-[#3629e1]/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 relative z-30">
          <div className="flex items-center justify-between gap-3 md:gap-6">
            {/* Logo - Animated & Glowing */}
            <div className="relative flex-shrink-0 group cursor-pointer">
              <div className="absolute inset-0 rounded-full bg-[#aa2e0f] blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-40" />
              <img
                src="/logo-scba.webp"
                alt="Logo SCBA"
                className="relative w-10 h-12 sm:w-14 sm:h-16 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 ease-out"
                width="56"
                height="70"
                fetchPriority="high"
              />
            </div>

            {/* Title - Athletic & Balanced */}
            <div className="flex-1 text-center min-w-0 flex flex-col items-center justify-center px-1">
              <h1 className="flex flex-col items-center justify-center leading-none">
                <span className="font-sport text-sm xs:text-base sm:text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white drop-shadow-xs uppercase">
                  STADE CLERMONTOIS BASKET AUVERGNE
                </span>
                {/* Athletic Separator & Badge */}
                <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                  <span className="h-[2px] w-6 sm:w-12 rounded-full bg-[#3629e1]"></span>
                  <span className="font-sport text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#3629e1] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                    ESPACE BÉNÉVOLES
                  </span>
                  <span className="h-[2px] w-6 sm:w-12 rounded-full bg-[#aa2e0f]"></span>
                </div>
              </h1>
            </div>

            {/* User Profile + Theme Toggle Capsule */}
            <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 bg-slate-100/80 dark:bg-slate-900/80 p-1 sm:p-1.5 rounded-full border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
              <ThemeToggle />
              <UserProfile
                onToast={onToast}
                isAdmin={isAdmin}
                onOpenAdminStats={onOpenAdminStats}
                onOpenProfile={onOpenProfile}
                onOpenImport={onOpenImport}
              />
            </div>
          </div>
        </div>

        {/* Filter Bar - Floating Horizontal Scroll */}
        {teams.length > 0 && (
          <div className="relative pb-2.5 pt-0.5 border-t border-slate-100 dark:border-slate-800/40">
            <div className="max-w-7xl mx-auto px-3 sm:px-6">
              <div
                ref={scrollRef}
                {...scrollEvents}
                className="flex gap-2 items-center overflow-x-auto scrollbar-hide whitespace-nowrap px-1 py-1 snap-x"
                style={{
                  ...scrollStyle,
                  maskImage: 'linear-gradient(to right, black 0%, black 95%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, black 0%, black 95%, transparent)',
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectTeam(null)}
                  className={`snap-center flex min-h-[36px] sm:min-h-[40px] items-center justify-center rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-200 backdrop-blur-md cursor-pointer ${
                    selectedTeam === null
                      ? 'border-[#3629e1]/40 bg-gradient-to-r from-[#3629e1] to-[#272890] text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                      : 'border-slate-200/90 bg-white/70 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-indigo-500/40'
                  }`}
                >
                  Tous les matchs
                </motion.button>
                {teams.map((team) => (
                  <motion.button
                    key={team}
                    layoutId={`team-pill-${team}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectTeam(team)}
                    className={`snap-center flex min-h-[36px] sm:min-h-[40px] items-center justify-center rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-200 backdrop-blur-md cursor-pointer ${
                      selectedTeam === team
                        ? 'border-transparent bg-gradient-to-r from-[#3629e1] via-[#272890] to-[#aa2e0f] text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/20'
                        : 'border-slate-200/90 bg-white/70 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-indigo-500/40'
                    }`}
                  >
                    {team}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>
    );
  },
);

Header.displayName = 'Header';

export default Header;
