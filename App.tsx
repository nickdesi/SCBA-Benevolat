import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import GameCard from './components/GameCard';
import GameForm from './components/GameForm';
import { INITIAL_GAMES } from './constants';
import type { Game } from './types';

const ADMIN_PASSWORD = 'SCBA2024'; // Simple hardcoded password

const AdminAuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  error: string;
}> = ({ isOpen, onClose, onSubmit, error }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Accès Administrateur</h2>
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-slate-600 mb-4">Veuillez entrer le mot de passe pour continuer.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Mot de passe"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
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
  }, []);
  
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
  }, []);
  
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
  }, []);

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
    <div className="bg-slate-100 min-h-screen">
      <AdminAuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSubmit={handleAdminLogin}
        error={authError}
      />
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Prochains Matchs & Bénévolat</h2>
            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
              Pendant que nos chérubins s'entraînent, nous avons besoin de votre aide pour que tout se passe bien. Merci d'avance pour votre soutien !
            </p>
        </div>

        <div className="mb-8 p-4 bg-white rounded-lg shadow-md flex justify-between items-center max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-slate-700">Mode Administrateur</h3>
            <label htmlFor="admin-toggle" className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isAdmin} onChange={handleAdminToggle} id="admin-toggle" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-red-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
        </div>

        {isAdmin && (
          <div className="mb-8 max-w-4xl mx-auto">
            {!isAddingGame ? (
              <div className="text-center">
                <button onClick={() => setIsAddingGame(true)} className="px-6 py-3 font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors shadow-lg">
                  + Ajouter un match
                </button>
              </div>
            ) : (
              <GameForm onSave={handleAddGame} onCancel={() => setIsAddingGame(false)} />
            )}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
          {games.map(game => (
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
      </main>
       <footer className="text-center p-4 mt-8 text-slate-500 text-sm">
        <p>Fait avec ❤️ pour le Stade Clermontois Basket Auvergne</p>
      </footer>
    </div>
  );
};

export default App;