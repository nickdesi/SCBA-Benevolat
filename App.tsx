import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import GameCard from './components/GameCard';
import GameForm from './components/GameForm';
import AdminAuthModal from './components/AdminAuthModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { INITIAL_GAMES } from './constants';
import { PlusIcon } from './components/Icons';
import type { Game } from './types';
import './styles.css';

// Mot de passe depuis variable d'environnement (avec fallback)
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'SCBA2024';

const App: React.FC = () => {
  // Utilisation de localStorage pour la persistance des données
  const [games, setGames] = useLocalStorage<Game[]>('scba-games', INITIAL_GAMES);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setAuthError('');
      setIsAuthModalOpen(true);
    }
  };

  const handleAdminLogin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setIsAuthModalOpen(false);
    } else {
      setAuthError('Mot de passe incorrect.');
    }
  };

  const handleVolunteerSignUp = useCallback((gameId: string, roleId: string, parentName: string) => {
    setGames(prevGames =>
      prevGames.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            roles: game.roles.map(role => {
              if (role.id === roleId && role.volunteers.length < role.capacity) {
                return { ...role, volunteers: [...role.volunteers, parentName] };
              }
              return role;
            }),
          };
        }
        return game;
      })
    );
  }, [setGames]);

  const handleRemoveVolunteer = useCallback((gameId: string, roleId: string, volunteerName: string) => {
    setGames(prevGames =>
      prevGames.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            roles: game.roles.map(role => {
              if (role.id === roleId) {
                return { ...role, volunteers: role.volunteers.filter(v => v !== volunteerName) };
              }
              return role;
            })
          };
        }
        return game;
      })
    );
  }, [setGames]);

  const handleUpdateVolunteer = useCallback((gameId: string, roleId: string, oldName: string, newName: string) => {
    setGames(prevGames =>
      prevGames.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            roles: game.roles.map(role => {
              if (role.id === roleId) {
                return { ...role, volunteers: role.volunteers.map(v => (v === oldName ? newName : v)) };
              }
              return role;
            })
          };
        }
        return game;
      })
    );
  }, [setGames]);

  const handleAddGame = (newGame: Omit<Game, 'id' | 'roles'>) => {
    const gameId = `game-${new Date().getTime()}`;
    const gameWithIdAndRoles: Game = {
      ...newGame,
      id: gameId,
      roles: [
        { id: `${gameId}-r1`, name: 'Buvette', volunteers: [], capacity: 2 },
        { id: `${gameId}-r2`, name: 'Chrono', volunteers: [], capacity: 1 },
        { id: `${gameId}-r3`, name: 'Table de marque', volunteers: [], capacity: 1 },
        { id: `${gameId}-r4`, name: 'Goûter', volunteers: [], capacity: Infinity },
      ],
    };
    setGames(prevGames => [gameWithIdAndRoles, ...prevGames]);
    setIsAddingGame(false);
  };

  const handleUpdateGame = (updatedGame: Game) => {
    setGames(prevGames => prevGames.map(game => (game.id === updatedGame.id ? updatedGame : game)));
    setEditingGameId(null);
  };

  const handleDeleteGame = (gameId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) {
      setGames(prevGames => prevGames.filter(game => game.id !== gameId));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSubmit={handleAdminLogin}
        error={authError}
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-800/5 to-transparent py-8 sm:py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 mb-3">
              Prochains Matchs & Bénévolat
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg px-4">
              Pendant que nos chérubins s'entraînent, nous avons besoin de votre aide pour que tout se passe bien.
              <span className="font-semibold text-red-500 block sm:inline"> Merci d'avance ! 🙏</span>
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-8">
          {/* Admin Toggle */}
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-5 
                          flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${isAdmin
                    ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/30'
                    : 'bg-slate-100'
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                    stroke="currentColor" className={`w-5 h-5 sm:w-6 sm:h-6 ${isAdmin ? 'text-white' : 'text-slate-600'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">Mode Admin</h3>
                  <p className="text-xs sm:text-sm text-slate-500">{isAdmin ? '🟢 Activé' : '⚪ Désactivé'}</p>
                </div>
              </div>
              <button
                onClick={handleAdminToggle}
                className={`
                  relative w-14 h-8 rounded-full transition-all duration-300 ease-out
                  ${isAdmin
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/30'
                    : 'bg-slate-200'
                  }
                `}
                aria-label="Basculer le mode administrateur"
              >
                <span className={`
                  absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md
                  transition-transform duration-300 ease-out
                  ${isAdmin ? 'translate-x-6' : 'translate-x-0'}
                `}></span>
              </button>
            </div>
          </div>

          {/* Add Game Button */}
          {isAdmin && (
            <div className="mb-8 max-w-4xl mx-auto">
              {!isAddingGame ? (
                <div className="text-center">
                  <button
                    onClick={() => setIsAddingGame(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4
                             text-base sm:text-lg font-bold text-white 
                             bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl
                             hover:from-slate-800 hover:to-black
                             shadow-xl shadow-slate-900/30 hover:shadow-slate-900/50
                             transition-all duration-300 transform hover:scale-105"
                  >
                    <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    Ajouter un match
                  </button>
                </div>
              ) : (
                <GameForm onSave={handleAddGame} onCancel={() => setIsAddingGame(false)} />
              )}
            </div>
          )}

          {/* Games Grid */}
          <div className="grid gap-6 sm:gap-8 md:grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onVolunteer={handleVolunteerSignUp}
                onRemoveVolunteer={handleRemoveVolunteer}
                onUpdateVolunteer={handleUpdateVolunteer}
                isAdmin={isAdmin}
                isEditing={editingGameId === game.id}
                onEditRequest={() => setEditingGameId(game.id)}
                onCancelEdit={() => setEditingGameId(null)}
                onDeleteRequest={() => handleDeleteGame(game.id)}
                onUpdateRequest={handleUpdateGame}
              />
            ))}
          </div>

          {/* Empty State */}
          {games.length === 0 && (
            <div className="text-center py-16 sm:py-20">
              <div className="text-6xl sm:text-7xl mb-4">🏀</div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-2">Aucun match prévu</h3>
              <p className="text-slate-500">Les prochains matchs apparaîtront ici</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm sm:text-base">
            Fait avec <span className="text-red-500">❤️</span> pour le
            <span className="font-semibold text-slate-300"> Stade Clermontois Basket Auvergne</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;