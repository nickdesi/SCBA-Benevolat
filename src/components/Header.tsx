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
  }) => {
    const { ref: scrollRef, events: scrollEvents, style: scrollStyle } = useDraggableScroll();

    return (
      <header className="sticky top-0 z-40 border-b border-white/35 bg-white/70 backdrop-blur-2xl transition-all duration-300 dark:border-slate-700/40 dark:bg-slate-950/65">
        {/* Dynamic Background Gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-28 left-1/4 h-72 w-72 rounded-full bg-[#c4492d]/20 blur-3xl" />
          <div className="absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-[#0f766e]/20 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-2 sm:py-3 relative z-30">
          <div className="flex items-center justify-between gap-2">
            {/* Logo - Animated & Glowing */}
            <div className="relative flex-shrink-0 group cursor-pointer">
              <div className="absolute inset-0 rounded-full bg-[#c4492d] blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-30" />
              <img
                src="/logo-scba.webp"
                alt="Logo SCBA"
                className="relative w-10 h-12 sm:w-14 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300 ease-out"
                width="56"
                height="70"
                {...({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
              />
            </div>

            {/* Title - Exact Match: Full Width & Readable */}
            <div className="flex-1 text-center min-w-0 flex flex-col justify-center px-1 min-h-[48px] sm:min-h-[72px]">
              <h1 className="flex flex-col items-center justify-center leading-none w-full">
                <span className="w-full max-w-full break-words text-center font-sport text-[10px] xs:text-xs sm:text-3xl font-black italic leading-none tracking-tighter text-slate-900 drop-shadow-sm dark:text-slate-100">
                  STADE CLERMONTOIS BASKET AUVERGNE
                </span>
                {/* Green Separator */}
                <span className="my-0.5 h-[2px] w-1/2 rounded-full bg-gradient-to-r from-[#0f766e] via-[#c59a3a] to-[#c4492d] sm:my-1 sm:h-[3px] sm:w-36"></span>
                <span className="font-sport text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#0f766e] dark:text-teal-300">
                  ESPACE BÉNÉVOLES
                </span>
              </h1>
            </div>

            {/* User Profile + Theme Toggle */}
            <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-3">
              <ThemeToggle />
              <UserProfile
                onToast={onToast}
                isAdmin={isAdmin}
                onOpenAdminStats={onOpenAdminStats}
                onOpenProfile={onOpenProfile}
              />
            </div>
          </div>
        </div>

        {/* Filter Bar - Floating Horizontal Scroll (always reserves height to prevent CLS) */}
        <div className="relative pb-3 pt-1" style={{ minHeight: '60px' }}>
          {teams.length > 0 && (
            <div className="container mx-auto px-4">
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
                  className={`snap-center flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 backdrop-blur-md ${
                    selectedTeam === null
                      ? 'border-[#0f766e]/20 bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,118,110,0.2)] ring-1 ring-[#0f766e]/20 dark:border-teal-500/30 dark:bg-slate-800 dark:text-slate-100'
                      : 'border-slate-300/60 bg-white/60 text-slate-600 hover:border-[#0f766e]/30 hover:bg-white hover:text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-teal-400/40 dark:hover:text-slate-100'
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
                    className={`snap-center flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 backdrop-blur-md ${
                      selectedTeam === team
                        ? 'border-transparent bg-gradient-to-r from-[#0f766e] via-[#178075] to-[#c4492d] text-white shadow-[0_10px_28px_rgba(15,118,110,0.35)] ring-1 ring-white/20'
                        : 'border-slate-300/60 bg-white/60 text-slate-600 hover:border-[#0f766e]/30 hover:bg-white hover:text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-teal-400/40 dark:hover:text-slate-100'
                    }`}
                  >
                    {team}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>
    );
  },
);

Header.displayName = 'Header';

export default Header;
