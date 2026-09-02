import React, { memo } from 'react';
import { Download } from 'lucide-react';
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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl transition-all duration-200">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Club Brand identity - Mobile App Style */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src="/logo-scba.webp"
                  alt="Logo SCBA"
                  className="w-9 h-11 sm:w-11 sm:h-13 object-contain drop-shadow-sm"
                  width="44"
                  height="52"
                  fetchPriority="high"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-sport text-lg sm:text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase leading-none truncate">
                    SCBA BÉNÉVOLES
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                    Stade Clermontois Basket
                  </span>
                </div>
              </div>
            </div>

            {/* Right Controls: Theme + User Capsule */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-full border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('pwa-open-install'))}
                  className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="Installer l'application"
                  aria-label="Installer l'application"
                >
                  <Download className="w-4 h-4" />
                </button>
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
        </div>

        {/* Filter Bar - Native Segmented Pills Scroll (Touch target min 44px, Accessible semantics) */}
        {teams.length > 0 && (
          <nav
            aria-label="Filtres par équipe"
            className="border-t border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-950/40"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
              <div
                ref={scrollRef}
                {...scrollEvents}
                role="tablist"
                aria-label="Sélectionner une équipe"
                className="flex gap-2 items-center overflow-x-auto scrollbar-hide whitespace-nowrap px-0.5 py-0.5 snap-x touch-pan-x"
                style={{
                  ...scrollStyle,
                  maskImage: 'linear-gradient(to right, black 0%, black 92%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, black 0%, black 92%, transparent)',
                }}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedTeam === null}
                  aria-label="Tous les matchs"
                  onClick={() => onSelectTeam(null)}
                  className={`snap-center flex min-h-[44px] items-center justify-center rounded-full px-4.5 text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    selectedTeam === null
                      ? 'bg-[#3629e1] text-white shadow-sm shadow-[#3629e1]/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Tous les matchs
                </button>
                {teams.map((team) => (
                  <button
                    key={team}
                    type="button"
                    role="tab"
                    aria-selected={selectedTeam === team}
                    aria-label={`Équipe ${team}`}
                    onClick={() => onSelectTeam(team)}
                    className={`snap-center flex min-h-[44px] items-center justify-center rounded-full px-4.5 text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      selectedTeam === team
                        ? 'bg-gradient-to-r from-[#3629e1] to-[#aa2e0f] text-white shadow-sm shadow-[#3629e1]/40'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        )}
      </header>
    );
  },
);

Header.displayName = 'Header';

export default Header;
