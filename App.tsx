import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import Header from './components/Header';
import GameCard from './components/GameCard';
import GameForm from './components/GameForm';
import AdminAuthModal from './components/AdminAuthModal';
import ImportCSVModal from './components/ImportCSVModal';
import MatchTicker from './components/MatchTicker';
import SkeletonLoader from './components/SkeletonLoader';
import ReloadPrompt from './components/ReloadPrompt';
import Footer from './components/Footer';
import { ToastContainer, useToast } from './components/Toast';
import { INITIAL_GAMES, DEFAULT_ROLES, MONTH_MAP } from './constants';
import type { Game, GameFormData, CarpoolEntry } from './types';

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Toast notifications
  const { toasts, addToast, removeToast } = useToast();

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'changeme';

  // Check localStorage for migration (legacy support) - memoized
  const localGames = useMemo(() => {
    try {
      const stored = localStorage.getItem('scba-games');
      return stored ? JSON.parse(stored) : INITIAL_GAMES;
    } catch {
      return INITIAL_GAMES;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Firestore Synchronization
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "matches"), (snapshot) => {
      const matchesData: Game[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Game));

      setGames(matchesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sort games by date using dateISO (YYYY-MM-DD format)
  // Fallback to parsing display date for legacy games without dateISO
  const sortedGames = useMemo(() => {
    const getDateValue = (game: Game): string => {
      // Use dateISO if available (new format)
      if (game.dateISO) return game.dateISO;

      // Fallback: parse display date for legacy games
      const parts = game.date.toLowerCase().split(' ');
      if (parts.length >= 4) {
        const day = parseInt(parts[1]) || 1;
        const month = MONTH_MAP[parts[2]] ?? 0;
        const year = parseInt(parts[3]) || new Date().getFullYear();
        // Return ISO format for comparison
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
      return '9999-12-31'; // Far future for unparseable dates
    };

    return [...games].sort((a, b) => getDateValue(a).localeCompare(getDateValue(b)));
  }, [games]);

  // Extract unique teams for filter
  const teams = useMemo(() => {
    const uniqueTeams = new Set(games.map(g => g.team));
    return Array.from(uniqueTeams).sort();
  }, [games]);

  // Extract unique locations for suggestions
  const uniqueLocations = useMemo(() => {
    const locations = new Set(games.map(g => g.location));
    return Array.from(locations).filter(Boolean).sort();
  }, [games]);

  // Extract unique opponents for suggestions
  const uniqueOpponents = useMemo(() => {
    const opponents = new Set(games.map(g => g.opponent));
    return Array.from(opponents).filter(Boolean).sort();
  }, [games]);

  // Filtered games
  const filteredGames = useMemo(() => {
    if (!selectedTeam) return sortedGames;
    return sortedGames.filter(g => g.team === selectedTeam);
  }, [sortedGames, selectedTeam]);

  // ---------------------------------------------------------------------------
  // Data Seeding / Migration (Run once if Firestore is empty)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const seedFirestore = async () => {
      try {
        // 1. Check if we've already initialized (Persistent Flag)
        const metadataSnap = await getDocs(collection(db, "system"));

        if (!metadataSnap.empty) {
          return;
        }

        // 2. If no flag, check if we have games
        const colRef = collection(db, "matches");
        const snapshot = await getDocs(colRef);

        // Define the flag setting helper
        const setInitializedFlag = async () => {
          const batch = writeBatch(db);
          const metaRef = doc(db, "system", "metadata");
          batch.set(metaRef, { initialized: true, date: new Date().toISOString() });
          await batch.commit();
        };

        if (!snapshot.empty) {
          // Case: Matches exist but no flag (Legacy/Existing app state)
          // Just set the flag so we don't re-seed if they delete everything later.
          await setInitializedFlag();
          return;
        }

        // 3. Database is truly empty and no flag -> SEED
        if (snapshot.empty) {
          const batch = writeBatch(db);

          const gamesToImport = (localGames && localGames.length > 0) ? localGames : INITIAL_GAMES;

          gamesToImport.forEach(game => {
            const docRef = doc(db, "matches", game.id);
            const cleanGame = JSON.parse(JSON.stringify(game));
            batch.set(docRef, cleanGame);
          });

          // Mark as initialized in the same batch
          const metaRef = doc(db, "system", "metadata");
          batch.set(metaRef, { initialized: true, date: new Date().toISOString() });

          await batch.commit();
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
  // Automatic Cleanup of Past Matches
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const cleanupPastMatches = async () => {
      try {
        // Use local date to avoid timezone issues with toISOString()
        const today = new Date();
        const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const colRef = collection(db, "matches");
        const snapshot = await getDocs(colRef);

        const matchesToDelete: string[] = [];

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();

          // Use dateISO if available, otherwise try to parse display date
          let matchDateISO = data.dateISO;

          if (!matchDateISO && data.date) {
            // Fallback: try to parse "Samedi 14 Décembre 2024" format
            const parts = data.date.toLowerCase().split(' ');
            if (parts.length >= 4) {
              const day = parseInt(parts[1]) || 1;
              const month = MONTH_MAP[parts[2]] ?? 0;
              const year = parseInt(parts[3]) || new Date().getFullYear();
              matchDateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }

          // If date is before today, mark for deletion
          if (matchDateISO && matchDateISO < todayISO) {
            matchesToDelete.push(docSnap.id);
          }
        });

        // Batch delete past matches
        if (matchesToDelete.length > 0) {
          const batch = writeBatch(db);
          matchesToDelete.forEach(id => {
            batch.delete(doc(db, "matches", id));
          });
          await batch.commit();
          console.log(`🧹 Nettoyage: ${matchesToDelete.length} match(s) passé(s) supprimé(s)`);
        }
      } catch (err) {
        console.error("Error cleaning up past matches:", err);
      }
    };

    // Run cleanup after a short delay (after seeding completes)
    const timer = setTimeout(() => cleanupPastMatches(), 2000);
    return () => clearTimeout(timer);
  }, []);

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

  const handleAddGame = async (gameData: GameFormData) => {
    try {
      // New games get an auto-generated ID from Firestore
      // Use centralized DEFAULT_ROLES configuration
      const newGame = {
        ...gameData,
        roles: DEFAULT_ROLES.map((role, idx) => ({
          id: String(idx + 1),
          name: role.name,
          capacity: role.capacity === 0 ? Infinity : role.capacity,
          volunteers: []
        }))
      };
      await addDoc(collection(db, "matches"), newGame);
      setIsAddingGame(false);
    } catch (err) {
      console.error("Error adding game:", err);
      alert("Erreur lors de l'ajout du match");
    }
  };

  // Bulk import from CSV
  const handleImportCSV = async (matchesData: GameFormData[]) => {
    try {
      const batch = writeBatch(db);

      for (const gameData of matchesData) {
        const newGame = {
          ...gameData,
          roles: DEFAULT_ROLES.map((role, idx) => ({
            id: String(idx + 1),
            name: role.name,
            capacity: role.capacity === 0 ? Infinity : role.capacity,
            volunteers: []
          }))
        };
        const docRef = doc(collection(db, "matches"));
        batch.set(docRef, newGame);
      }

      await batch.commit();
      addToast(`${matchesData.length} match(s) importé(s) avec succès !`, 'success');
      setIsImportModalOpen(false);
    } catch (err) {
      console.error("Error importing games:", err);
      alert("Erreur lors de l'import des matchs");
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

  // ---------------------------------------------------------------------------
  // Carpooling Actions
  // ---------------------------------------------------------------------------

  const handleAddCarpool = async (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const newEntry: CarpoolEntry = {
        ...entry,
        id: crypto.randomUUID()
      };
      const updatedCarpool = [...(game.carpool || []), newEntry];

      const gameRef = doc(db, "matches", gameId);
      await updateDoc(gameRef, { carpool: updatedCarpool });
    } catch (err) {
      console.error("Error adding carpool entry:", err);
      alert("Erreur lors de l'inscription covoiturage");
    }
  };

  const handleRemoveCarpool = async (gameId: string, entryId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const updatedCarpool = (game.carpool || []).filter(e => e.id !== entryId);

      const gameRef = doc(db, "matches", gameId);
      await updateDoc(gameRef, { carpool: updatedCarpool });
    } catch (err) {
      console.error("Error removing carpool entry:", err);
      alert("Erreur lors de la désinscription covoiturage");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-outfit pb-12 transition-colors duration-500">
      <Header
        isAdmin={isAdmin}
        onAdminClick={() => setIsAdminModalOpen(true)}
        onLogout={() => setIsAdmin(false)}
        teams={teams}
        selectedTeam={selectedTeam}
        onSelectTeam={setSelectedTeam}
      />

      {/* Ticker for upcoming matches */}
      <MatchTicker games={sortedGames} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <main className="container mx-auto px-4 relative z-20">

        {/* Loading State */}
        {loading && <SkeletonLoader />}

        {!loading && (
          <div className="flex justify-end mb-6 gap-4">
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Importer CSV
                </button>
                <button
                  onClick={() => setIsAddingGame(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-700 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Ajouter un match
                </button>
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && games.length === 0 && !isAddingGame && (
          <div className="bg-white rounded-3xl shadow-2xl p-16 text-center max-w-2xl mx-auto border border-slate-100 animate-fade-in-up">
            <div className="relative mb-8 inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 blur-3xl opacity-20 scale-150"></div>
              <div className="relative bg-gradient-to-br from-red-50 to-orange-50 w-32 h-32 rounded-3xl flex items-center justify-center shadow-lg">
                <span className="text-6xl">🏀</span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-3 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Aucun match prévu
            </h3>
            <p className="text-lg text-slate-500 mb-10 max-w-md mx-auto">
              Le calendrier est vide pour le moment. Revenez bientôt pour découvrir les prochains matchs !
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsAddingGame(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-red-200 transition-all transform hover:-translate-y-1 hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
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
              existingLocations={uniqueLocations}
              existingOpponents={uniqueOpponents}
            />
          </div>
        )}

        {/* Grouped Games List */}
        <div className="space-y-12">
          {(() => {
            // Group games by Month-Year
            // Since filteredGames is already sorted by date, we can just iterate
            const groups: { label: string; games: Game[] }[] = [];

            filteredGames.forEach(game => {
              // Determine Month label from date
              let label = "Date inconnue";

              if (game.dateISO) {
                const date = new Date(game.dateISO);
                if (!isNaN(date.getTime())) {
                  label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                  // Capitalize first letter
                  label = label.charAt(0).toUpperCase() + label.slice(1);
                }
              } else {
                // Fallback for legacy dates (try to extract month)
                // Assuming format "Samedi 10 Janvier 2024" or similar
                const parts = game.date.split(' ');
                if (parts.length >= 3) {
                  // Heuristic: take last part as year, 3rd to last as month
                  label = parts.length > 2 ? parts.slice(2).join(' ') : game.date;
                }
              }

              const lastGroup = groups[groups.length - 1];
              if (lastGroup && lastGroup.label === label) {
                lastGroup.games.push(game);
              } else {
                groups.push({ label, games: [game] });
              }
            });

            return groups.map((group, groupIdx) => (
              <div key={`${group.label}-${groupIdx}`}>
                {/* Month Header - Modern pill style */}
                <div className="flex items-center justify-center my-10">
                  <div className="inline-flex items-center gap-3 px-6 py-3 
                                bg-gradient-to-r from-slate-800 to-slate-700 
                                rounded-full shadow-lg shadow-slate-900/20">
                    <span className="text-2xl">📅</span>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-lg font-black text-white tracking-wide">
                        {group.label}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">
                        {group.games.filter(g => g.isHome !== false).length} Dom • {group.games.filter(g => g.isHome === false).length} Ext
                      </span>
                    </div>
                    <span className="text-sm font-bold px-2.5 py-0.5 bg-white/20 text-white/90 rounded-full ml-2">
                      {group.games.length} matchs
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                  {group.games.map((game, index) => (
                    <div
                      key={game.id}
                      className="h-full animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <GameCard
                        game={game}
                        isAdmin={isAdmin}
                        isEditing={editingGameId === game.id}
                        onVolunteer={handleVolunteer}
                        onRemoveVolunteer={handleRemoveVolunteer}
                        onUpdateVolunteer={handleUpdateVolunteer}
                        onAddCarpool={handleAddCarpool}
                        onRemoveCarpool={handleRemoveCarpool}
                        onToast={addToast}
                        onEditRequest={() => setEditingGameId(game.id)}
                        onCancelEdit={() => setEditingGameId(null)}
                        onDeleteRequest={() => handleDeleteGame(game.id)}
                        onUpdateRequest={handleUpdateGame}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
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

      {/* CSV Import Modal */}
      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCSV}
      />

      <ReloadPrompt />
      <Footer />
    </div>
  );
}

export default App;