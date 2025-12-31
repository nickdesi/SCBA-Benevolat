import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { User } from 'firebase/auth';
import Header from './components/Header';
import GameList from './components/GameList';
import MatchTicker from './components/MatchTicker';
import SkeletonLoader from './components/SkeletonLoader';
import ReloadPrompt from './components/ReloadPrompt';
import Footer from './components/Footer';
import ProfileModal from './components/ProfileModal';
import { ToastContainer, useToast } from './components/Toast';
import type { Game, GameFormData } from './types';
import BottomNav from './components/BottomNav';
import { onAuthStateChanged, signOut } from './utils/authStore';
import { useGames } from './utils/useGames';

// Lazy-loaded components (code-splitting for reduced initial bundle)
const AdminAuthModal = lazy(() => import('./components/AdminAuthModal'));
const ImportCSVModal = lazy(() => import('./components/ImportCSVModal'));
const GameForm = lazy(() => import('./components/GameForm'));

function App() {
  // UI State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'planning'>('home');

  // Toast notifications
  const { toasts, addToast, removeToast } = useToast();

  // Games data and operations from custom hook
  const {
    games,
    sortedGames,
    filteredGames,
    loading,
    teams,
    uniqueLocations,
    uniqueOpponents,
    addGame,
    updateGame,
    deleteGame,
    importGames,
    handleVolunteer,
    handleRemoveVolunteer,
    handleUpdateVolunteer,
    handleAddCarpool,
    handleRemoveCarpool,
    userRegistrations,
    userRegistrationsMap
  } = useGames({ selectedTeam, currentView });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      // Check if the user is the specific admin account
      if (user && user.email === 'benevole@scba.fr') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      addToast('Déconnexion réussie', 'success');
    } catch {
      addToast('Erreur lors de la déconnexion', 'error');
    }
  }, [addToast]);

  const handleAddGame = useCallback(async (gameData: GameFormData) => {
    try {
      await addGame(gameData);
      setIsAddingGame(false);
    } catch (err) {
      console.error("Error adding game:", err);
      alert("Erreur lors de l'ajout du match");
    }
  }, [addGame]);

  const handleUpdateGame = useCallback(async (updatedGame: Game) => {
    try {
      await updateGame(updatedGame);
      setEditingGameId(null);
    } catch (err) {
      console.error("Error updating game:", err);
      alert("Erreur lors de la modification du match");
    }
  }, [updateGame]);

  const handleDeleteGame = useCallback(async (gameId: string) => {
    try {
      const deleted = await deleteGame(gameId);
      if (deleted && editingGameId === gameId) {
        setEditingGameId(null);
      }
    } catch (err) {
      console.error("Error deleting game:", err);
      alert("Erreur lors de la suppression du match");
    }
  }, [deleteGame, editingGameId]);

  const handleImportCSV = useCallback(async (matchesData: GameFormData[]) => {
    try {
      await importGames(matchesData);
      addToast(`${matchesData.length} match(s) importé(s) avec succès !`, 'success');
      setIsImportModalOpen(false);
    } catch (err) {
      console.error("Error importing games:", err);
      alert("Erreur lors de l'import des matchs");
    }
  }, [importGames, addToast]);

  // Wrapped handlers with toast feedback
  const handleVolunteerWithToast = useCallback(async (gameId: string, roleId: string, parentName: string) => {
    try {
      await handleVolunteer(gameId, roleId, parentName);
      addToast('Inscription confirmée !', 'success');
    } catch (err) {
      console.error("Error adding volunteer:", err);
      alert("Erreur lors de l'inscription");
    }
  }, [handleVolunteer, addToast]);

  const handleAddCarpoolWithToast = useCallback(async (gameId: string, entry: Omit<import('./types').CarpoolEntry, 'id'>) => {
    try {
      await handleAddCarpool(gameId, entry);
      addToast('🚗 Inscription covoiturage confirmée !', 'success');
    } catch (err) {
      console.error("Error adding carpool:", err);
      alert("Erreur lors de l'inscription covoiturage");
    }
  }, [handleAddCarpool, addToast]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 font-outfit pb-12 transition-colors duration-500">
      <Header
        isAdmin={isAdmin}
        onAdminClick={() => setIsAdminModalOpen(true)}
        onLogout={handleLogout}
        teams={teams}
        selectedTeam={selectedTeam}
        onSelectTeam={setSelectedTeam}
        registrations={userRegistrations} // Pass registrations
        games={games} // Pass ALL games for validity check
        onUnsubscribe={handleRemoveVolunteer}
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
          <Suspense fallback={<div className="mb-8 p-8 bg-white rounded-3xl shadow animate-pulse"><div className="h-64 bg-slate-200 rounded-xl"></div></div>}>
            <div className="mb-8">
              <GameForm
                onSave={handleAddGame}
                onCancel={() => setIsAddingGame(false)}
                existingLocations={uniqueLocations}
                existingOpponents={uniqueOpponents}
              />
            </div>
          </Suspense>
        )}

        {/* Grouped Games List */}
        <GameList
          games={filteredGames}
          userRegistrations={userRegistrationsMap} // Pass Map
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          editingGameId={editingGameId}
          onVolunteer={handleVolunteerWithToast}
          onRemoveVolunteer={handleRemoveVolunteer}
          onUpdateVolunteer={handleUpdateVolunteer}
          onAddCarpool={handleAddCarpoolWithToast}
          onRemoveCarpool={handleRemoveCarpool}
          onToast={addToast}
          onEditRequest={setEditingGameId}
          onCancelEdit={() => setEditingGameId(null)}
          onDeleteRequest={handleDeleteGame}
          onUpdateRequest={handleUpdateGame}
        />

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
      <Suspense fallback={null}>
        {isAdminModalOpen && (
          <AdminAuthModal
            isOpen={isAdminModalOpen}
            onClose={() => setIsAdminModalOpen(false)}
            onSuccess={() => addToast('Connexion admin réussie !', 'success')}
          />
        )}
      </Suspense>

      {/* CSV Import Modal */}
      <Suspense fallback={null}>
        {isImportModalOpen && (
          <ImportCSVModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImportCSV}
          />
        )}
      </Suspense>

      {/* Empty State for Scheduling */}
      {!loading && currentView === 'planning' && filteredGames.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center max-w-md mx-auto border border-slate-100 mt-8 mb-20 animate-fade-in-up">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            Planning vide
          </h3>
          <p className="text-slate-500 mb-6">
            Vous n'êtes inscrit à aucun match pour le moment.
            Retournez à l'accueil pour vous inscrire !
          </p>
          <button
            onClick={() => setCurrentView('home')}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
          >
            Voir tous les matchs
          </button>
        </div>
      )}

      <ReloadPrompt />
      <Footer />

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        isAdmin={isAdmin}
        onAdminClick={() => setIsAdminModalOpen(true)}
        onPlanningClick={() => setIsProfileModalOpen(true)}
        isAuthenticated={isAuthenticated}
      />

      {/* Profile Modal - Triggered by Planning button on mobile */}
      {currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          registrations={userRegistrations}
          games={games}
          onUnsubscribe={handleRemoveVolunteer}
        />
      )}
    </div>
  );
}

export default App;