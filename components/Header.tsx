import React from 'react';
import UserProfile from './UserProfile';
import { UserRegistration, Game } from '../types';
import { ThemeToggle } from '../utils/ThemeContext';

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
  onToggleFavorite = async () => { }
}) => {
  return (
    <header className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white z-50 bg-noise">
      {/* Background decorations */}
      <div className="absolute inset-0">

        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 40%),
                           radial-gradient(circle at 90% 80%, rgba(239, 68, 68, 0.3) 0%, transparent 40%)`
        }}></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-2 sm:py-4 relative z-30">
        <div className="flex items-center justify-between">
          {/* Logo - Left */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full scale-150"></div>
            <img
              src="/logo-scba.webp"
              alt="Logo Stade Clermontois Basket Auvergne"
              className="relative w-10 h-12 sm:w-16 sm:h-20 object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Title - Center */}
          <div className="text-center flex-1 px-2 sm:px-3">
            <h1 className="text-sm sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight font-sport flex flex-col sm:block">
              <span className="bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 bg-clip-text text-transparent">
                STADE CLERMONTOIS
              </span>
              <span className="text-white block sm:inline sm:ml-2 font-normal tracking-widest opacity-90">BASKET AUVERGNE</span>
            </h1>
            <p className="text-blue-400/80 text-[10px] sm:text-sm font-medium tracking-[0.2em] mt-1 uppercase">
              🏀 Espace Bénévoles
            </p>
          </div>

          {/* User Profile + Theme Toggle */}
          <div className="flex-shrink-0 flex items-center gap-2">
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
            />
          </div>
        </div>
      </div>

      {/* Filter Bar Integration - Seamless Glassmorphism */}
      {teams.length > 0 && (
        <div className="relative z-20 pb-4 pt-3">
          <div className="container mx-auto px-4">
            <div
              className="flex gap-2 items-center overflow-x-auto scrollbar-hide whitespace-nowrap pb-1"
              style={{
                maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
              }}
            >
              <button
                onClick={() => onSelectTeam(null)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 backdrop-blur-md border ${selectedTeam === null
                  ? 'bg-white text-slate-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105'
                  : 'bg-slate-800/40 text-slate-300 border-slate-700/50 hover:bg-slate-800/60 hover:text-white hover:border-slate-500/50'
                  }`}
              >
                Tous les matchs
              </button>
              {teams.map((team) => (
                <button
                  key={team}
                  onClick={() => onSelectTeam(team)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 backdrop-blur-md border ${selectedTeam === team
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-transparent shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105'
                    : 'bg-slate-800/40 text-slate-300 border-slate-700/50 hover:bg-slate-800/60 hover:text-white hover:border-slate-500/50'
                    }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
