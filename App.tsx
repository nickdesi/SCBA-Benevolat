import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import Header from './components/Header';
import GameCard from './components/GameCard';
import GameForm from './components/GameForm';
import AdminAuthModal from './components/AdminAuthModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { INITIAL_GAMES } from './constants';
import type { Game, Role } from './types';

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  // Still use localStorage for purely local preferences/identity
  // (We don't use the games from here anymore, but we might read it ONCE for migration)
  const [localGames] = useLocalStorage<Game[]>('scba-games', INITIAL_GAMES);

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'SCBA2024';

  // ---------------------------------------------------------------------------
  // Firestore Synchronization
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "matches"), (snapshot) => {
      const matchesData: Game[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Game));

      // Sort by date (naive string sort YYYY-MM-DD or comparable is best, 
      // strictly assuming DD/MM/YYYY text might need better parsing, 
      // but let's keep consistency with current behavior)
      // Since current dates are free text like "Samedi 15", sorting is tricky without proper Date objects.
      // For now, we trust the order or just simple sort.
      // Ideally we would add a 'sortOrder' or 'timestamp' field.
      // For now, let's just set them.
      setGames(matchesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------
  // Data Seeding / Migration (Run once if Firestore is empty)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const seedFirestore = async () => {
      try {
        // Check for a system flag to prevent re-seeding after intentional deletion
        const metadataRef = doc(db, "system", "metadata");
        const metadataSnap = await getDocs(collection(db, "system"));

        // We check if the specific metadata doc exists OR if we've already set a flag locally in this session
        // But checking Firestore is safest for cross-device.
        // Let's check specifically for the metadata document.
        const systemDoc = await getDocs(collection(db, "system"));
        const isInitialized = !systemDoc.empty;

        if (isInitialized) {
          console.log("Database already initialized. Skipping seed.");
          return;
        }

        const colRef = collection(db, "matches");
        const snapshot = await getDocs(colRef);

        if (snapshot.empty) {
          console.log("Database empty. Seeding for the FIRST time...");
          const batch = writeBatch(db);

          // Use localGames (from localStorage) if available, otherwise constants
          const gamesToImport = (localGames && localGames.length > 0) ? localGames : INITIAL_GAMES;

          gamesToImport.forEach(game => {
            const docRef = doc(db, "matches", game.id);
            const cleanGame = JSON.parse(JSON.stringify(game));
            batch.set(docRef, cleanGame);
          });

          // Mark as initialized
          const metaRef = doc(db, "system", "metadata");
          batch.set(metaRef, { initialized: true, date: new Date().toISOString() });

          await batch.commit();
          console.log("Seeding complete and system flagged!");
        }
      } catch (err) {
        console.error("Error seeding database:", err);
      }
    };

    // Small timeout to ensure SDK is ready
    const timer = setTimeout(() => seedFirestore(), 1000);
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleAdminAuth = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setIsAdminModalOpen(false);
      setAuthError('');
    } else {
      setAuthError('Mot de passe incorrect');
    }
  };

  const handleAddGame = async (gameData: any) => {
    try {
      // New games get an auto-generated ID from Firestore
      const newGame = {
        ...gameData,
        // Ensure roles are initialized if not present
        roles: gameData.roles || [
          { id: '1', name: 'Buvette', capacity: 2, volunteers: [] },
          { id: '2', name: 'Chrono', capacity: 1, volunteers: [] },
          { id: '3', name: 'Table de marque', capacity: 1, volunteers: [] },
          { id: '4', name: 'Goûter', capacity: 0, volunteers: [] }, // 0 = unlimited
        ]
      };
      await addDoc(collection(db, "matches"), newGame);
      setIsAddingGame(false);
    } catch (err) {
      console.error("Error adding game:", err);
      alert("Erreur lors de l'ajout du match");
    }
  };

  const handleUpdateGame = async (updatedGame: Game) => {
    try {
      const gameRef = doc(db, "matches", updatedGame.id);
      // Don't send the ID itself in the update payload
      const { id, ...data } = updatedGame;
      await updateDoc(gameRef, data);
      setEditingGameId(null);
    } catch (err) {
      console.error("Error updating game:", err);
      alert("Erreur lors de la modification du match");
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce match ?')) {
      try {
        await deleteDoc(doc(db, "matches", gameId));
        // If we were editing this game, stop editing
        if (editingGameId === gameId) {
          setEditingGameId(null);
        }
      } catch (err) {
        console.error("Error deleting game:", err);
        alert("Erreur lors de la suppression du match");
      }
    }
  };

  const handleVolunteer = async (gameId: string, roleId: string, parentName: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const updatedRoles = game.roles.map(role => {
        if (role.id === roleId) {
          return { ...role, volunteers: [...role.volunteers, parentName] };
        }
        return role;
      });

      const gameRef = doc(db, "matches", gameId);
      await updateDoc(gameRef, { roles: updatedRoles });
    } catch (err) {
      console.error("Error adding volunteer:", err);
      alert("Erreur lors de l'inscription");
    }
  };

  const handleRemoveVolunteer = async (gameId: string, roleId: string, volunteerName: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const updatedRoles = game.roles.map(role => {
        if (role.id === roleId) {
          return { ...role, volunteers: role.volunteers.filter(v => v !== volunteerName) };
        }
        return role;
      });

      const gameRef = doc(db, "matches", gameId);
      await updateDoc(gameRef, { roles: updatedRoles });
    } catch (err) {
      console.error("Error removing volunteer:", err);
      alert("Erreur lors de la désinscription");
    }
  };

  const handleUpdateVolunteer = async (gameId: string, roleId: string, oldName: string, newName: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const updatedRoles = game.roles.map(role => {
        if (role.id === roleId) {
          return {
            ...role,
            volunteers: role.volunteers.map(v => v === oldName ? newName : v)
          };
        }
        return role;
      });

      const gameRef = doc(db, "matches", gameId);
      await updateDoc(gameRef, { roles: updatedRoles });
    } catch (err) {
      console.error("Error updating volunteer:", err);
      alert("Erreur lors de la modification");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-outfit pb-12 transition-colors duration-500">
      <Header />

      <main className="container mx-auto px-4 -mt-8 relative z-20">

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        )}

        {/* Filters / Admin Toggle */}
        {!loading && (
          <div className="flex justify-end mb-6 gap-4">
            {isAdmin && (
              <button
                onClick={() => setIsAddingGame(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-700 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter un match
              </button>
            )}
            <button
              onClick={() => isAdmin ? setIsAdmin(false) : setIsAdminModalOpen(true)}
              className={`
                px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all
                ${isAdmin
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              {isAdmin ? 'Mode Admin Actif 🔓' : 'Accès Admin 🔒'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && games.length === 0 && !isAddingGame && (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-2xl mx-auto">
            <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏀</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Aucun match prévu</h3>
            <p className="text-slate-500 mb-8">Le calendrier est vide pour le moment.</p>
            {isAdmin && (
              <button
                onClick={() => setIsAddingGame(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                Ajouter un match
              </button>
            )}
          </div>
        )}

        {/* Add Game Form */}
        {isAddingGame && (
          <div className="mb-8">
            <GameForm
              onSave={handleAddGame}
              onCancel={() => setIsAddingGame(false)}
            />
          </div>
        )}

        {/* Games List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              isAdmin={isAdmin}
              isEditing={editingGameId === game.id}
              onVolunteer={handleVolunteer}
              onRemoveVolunteer={handleRemoveVolunteer}
              onUpdateVolunteer={handleUpdateVolunteer}
              onEditRequest={() => setEditingGameId(game.id)}
              onCancelEdit={() => setEditingGameId(null)}
              onDeleteRequest={() => handleDeleteGame(game.id)}
              onUpdateRequest={handleUpdateGame}
            />
          ))}
        </div>

        {/* Floating Action Button (Add Game) */}
        {isAdmin && !isAddingGame && games.length > 0 && (
          <button
            onClick={() => setIsAddingGame(true)}
            className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full 
                     shadow-2xl hover:scale-110 transition-transform z-50 group"
            aria-label="Ajouter un match"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Ajouter un match
            </span>
          </button>
        )}
      </main>

      {/* Admin Auth Modal */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSubmit={handleAdminAuth}
        error={authError}
      />

      <footer className="mt-20 py-8 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} Stade Clermontois Basket Auvergne</p>
      </footer>
    </div>
  );
}

export default App;