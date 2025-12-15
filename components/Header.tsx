import React from 'react';
import SnowEffect from './SnowEffect';
import ChristmasGarland from './ChristmasGarland';

interface HeaderProps {
  isAdmin: boolean;
  onAdminClick: () => void;
  onLogout: () => void;
  teams?: string[];
  selectedTeam?: string | null;
  onSelectTeam?: (team: string | null) => void;
}

const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onAdminClick,
  onLogout,
  teams = [],
  selectedTeam = null,
  onSelectTeam = () => { }
}) => {
  return (
    <header className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <SnowEffect />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 40%),
                           radial-gradient(circle at 90% 80%, rgba(239, 68, 68, 0.3) 0%, transparent 40%)`
        }}></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-5 sm:py-6 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* Logo and Title */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {/* Logo SCBA */}
            <ChristmasGarland className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 rounded-full scale-150"></div>
              <img
                src="/logo-scba.png"
                alt="Logo Stade Clermontois Basket Auvergne"
                className="relative w-16 h-20 sm:w-20 sm:h-24 object-contain drop-shadow-lg"
              />
            </ChristmasGarland>

            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
                  Stade Clermontois
                </span>
                <br className="sm:hidden" />
                <span className="text-white"> Basket Auvergne</span>
              </h1>
              <p className="text-blue-400/80 text-sm font-medium tracking-wide mt-1">
                🏀 Espace Bénévoles
              </p>
            </div>
          </div>

          {/* Admin button and Welcome message */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Admin Button */}
            {isAdmin ? (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full 
                         border border-emerald-400/30 hover:bg-emerald-500/30 
                         transition-all text-sm font-semibold flex items-center gap-2"
              >
                <span>✓ Admin</span>
                <span className="text-xs opacity-70">Déconnexion</span>
              </button>
            ) : (
              <button
                onClick={onAdminClick}
                className="px-4 py-2 bg-white/10 text-white/80 rounded-full 
                         border border-white/20 hover:bg-white/20 
                         transition-all text-sm font-medium flex items-center gap-2"
              >
                <span>🔒</span>
                <span>Admin</span>
              </button>
            )}

            {/* Welcome badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm 
                          rounded-full border border-white/20 shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <p className="text-base font-semibold text-white">Bienvenue !</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar Integration - Seamless Glassmorphism */}
      {teams.length > 0 && (
        <div className="relative z-20 pb-6 pt-2 overflow-hidden">
          <div className="container mx-auto px-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div className="flex gap-2.5 min-w-max justify-center md:justify-start">
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
