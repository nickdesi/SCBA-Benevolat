import React from 'react';


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
  onSelectTeam = (_team) => { }
}) => {
  return (
    <header className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">

        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 40%),
                           radial-gradient(circle at 90% 80%, rgba(239, 68, 68, 0.3) 0%, transparent 40%)`
        }}></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo - Left */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full scale-150"></div>
            <img
              src="/logo-scba.png"
              alt="Logo Stade Clermontois Basket Auvergne"
              className="relative w-14 h-16 sm:w-16 sm:h-20 object-contain drop-shadow-lg"
            />
          </div>

          {/* Title - Center */}
          <div className="text-center flex-1 px-3">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
                Stade Clermontois
              </span>
              <span className="text-white"> Basket Auvergne</span>
            </h1>
            <p className="text-blue-400/80 text-sm font-medium tracking-wide mt-0.5">
              🏀 Espace Bénévoles
            </p>
          </div>

          {/* Admin Button - Right (Desktop Only) */}
          <div className="flex-shrink-0 hidden md:block">
            {isAdmin ? (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full 
                         border border-emerald-400/30 hover:bg-emerald-500/30 
                         transition-all text-sm font-semibold flex items-center gap-2"
              >
                <span>✓ Admin</span>
                <span className="hidden sm:inline text-xs opacity-70">Déconnexion</span>
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
          </div>
        </div>
      </div>

      {/* Filter Bar Integration - Seamless Glassmorphism */}
      {teams.length > 0 && (
        <div className="relative z-20 pb-4 pt-3">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 items-center overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
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
