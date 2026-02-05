import React from 'react';
import { motion } from 'framer-motion';
import UserProfile from './UserProfile';
import { UserRegistration, Game } from '../types';
import { ThemeToggle } from '../utils/ThemeContext';
import { useDraggableScroll } from '../hooks/useDraggableScroll';
import { BasketballIcon } from './Icons';

interface HeaderProps {
  onLogout: () => void;
  teams?: string[];
  selectedTeam?: string | null;
  onSelectTeam?: (team: string | null) => void;
  registrations?: UserRegistration[];
  games?: Game[];
  onUnsubscribe?: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
  onRemoveCarpool?: (gameId: string, entryId: string) => Promise<void>;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  isAdmin: boolean;
  allTeams?: string[];
  favoriteTeams?: string[];
  onToggleFavorite?: (team: string) => Promise<void>;
  onOpenAdminStats?: () => void;
  onOpenProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onLogout,
  teams = [],
  selectedTeam = null,
  onSelectTeam = (_team) => { },
  registrations = [],
  games = [],
  onUnsubscribe = async () => { },
  onRemoveCarpool = async () => { },
  onToast = () => { },
  allTeams = [],
  favoriteTeams = [],
  onToggleFavorite = async () => { },
  onOpenAdminStats = () => { },
  onOpenProfile
}) => {
  const { ref: scrollRef, events: scrollEvents, style: scrollStyle } = useDraggableScroll();


  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-white/10 dark:border-white/5 transition-all duration-300 supports-[backdrop-filter]:bg-slate-900/60">
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 opacity-50 dark:opacity-30 mix-blend-screen" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 opacity-50 dark:opacity-30 mix-blend-screen" />
      </div>

      <div className="container mx-auto px-4 py-2 sm:py-3 relative z-30">
        <div className="flex items-center justify-between gap-2">
          {/* Logo - Animated & Glowing */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative flex-shrink-0 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-full" />
            <img
              src="/logo-scba.webp"
              alt="Logo SCBA"
              className="relative w-10 h-12 sm:w-14 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300 ease-out"
              width="56"
              height="70"
              // @ts-ignore
              fetchPriority="high"
            />
          </motion.div>

          {/* Title - Exact Match: Full Width & Readable */}
          <div className="flex-1 text-center min-w-0 flex flex-col justify-center px-1">
            <h1 className="flex flex-col items-center justify-center leading-none w-full">
              <span className="text-[10px] xs:text-xs sm:text-3xl font-black italic tracking-tighter text-white drop-shadow-sm font-sport text-center leading-none w-full break-words max-w-full">
                STADE CLERMONTOIS BASKET AUVERGNE
              </span>
              {/* Green Separator */}
              <span className="w-1/2 sm:w-32 h-[2px] sm:h-[3px] bg-emerald-500 my-0.5 sm:my-1 rounded-full"></span>
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-emerald-400 font-sport">
                ESPACE BÉNÉVOLES
              </span>
            </h1>
          </div>

          {/* User Profile + Theme Toggle */}
          <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <UserProfile
              registrations={registrations}
              games={games}
              onUnsubscribe={onUnsubscribe}
              onRemoveCarpool={onRemoveCarpool}
              onToast={onToast}
              allTeams={allTeams}
              favoriteTeams={favoriteTeams}
              onToggleFavorite={onToggleFavorite}
              isAdmin={isAdmin}
              onOpenAdminStats={onOpenAdminStats}
              onOpenProfile={onOpenProfile}
            />
          </div>
        </div>
      </div>

      {/* Filter Bar - Floating Horizontal Scroll */}
      {teams.length > 0 && (
        <div className="relative pb-3 pt-1">
          <div className="container mx-auto px-4">
            <div
              ref={scrollRef}
              {...scrollEvents}
              className="flex gap-2 items-center overflow-x-auto scrollbar-hide whitespace-nowrap px-1 py-1 snap-x"
              style={{
                ...scrollStyle,
                maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
              }}
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectTeam(null)}
                className={`snap-center px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border backdrop-blur-md ${selectedTeam === null
                  ? 'bg-white text-slate-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] ring-1 ring-white/50'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-700/60 hover:text-slate-200'
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
                  className={`snap-center px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border backdrop-blur-md ${selectedTeam === team
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-[0_0_20px_rgba(59,130,246,0.4)] ring-1 ring-white/20'
                    : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-700/60 hover:text-slate-200'
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
};

export default Header;
