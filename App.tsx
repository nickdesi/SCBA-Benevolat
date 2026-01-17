import React, { useState, useEffect, useCallback, Suspense, lazy, startTransition } from 'react';
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
import { useUserProfile } from './utils/useUserProfile';
import EventSchema from './components/EventSchema';

// Lazy-loaded components (code-splitting for reduced initial bundle)
// AdminAuthModal removed as per request
const ImportCSVModal = lazy(() => import('./components/ImportCSVModal'));
const GameForm = lazy(() => import('./components/GameForm'));
const PlanningView = lazy(() => import('./components/planning/PlanningView'));

import AdminToolbar from './components/AdminToolbar';
import PullToRefresh from './components/PullToRefresh';
import { AppLayout } from './components/Layout/AppLayout';

function App() {
  // UI State
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdminStatsOpen, setIsAdminStatsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'planning' | 'calendar'>('calendar');

  // Wrap view changes in startTransition for non-blocking UI updates
  const handleViewChange = useCallback((view: 'home' | 'planning' | 'calendar') => {
    startTransition(() => {
      setCurrentView(view);
    });
  }, []);

  // Stats Component (lazy optional, but let's just import for now or lazy)
  const AdminStats = lazy(() => import('./components/AdminStats'));

  // Toast notifications
  const { toasts, addToast, removeToast } = useToast();

  // User Profile persistence
  const { favoriteTeams, toggleFavoriteTeam } = useUserProfile();

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
    userRegistrationsMap,
    allTeams // Use allTeams from useGames for the most up-to-date list
  } = useGames({ selectedTeam, currentView, favoriteTeams });

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
    <AppLayout
      header={
        <Header
          isAdmin={isAdmin}
          onLogout={handleLogout}
          teams={teams}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          registrations={userRegistrations} // Pass registrations
          games={games} // Pass ALL games for validity check
          allTeams={allTeams}
          favoriteTeams={favoriteTeams}
          onToggleFavorite={toggleFavoriteTeam}
          onUnsubscribe={handleRemoveVolunteer}
          onRemoveCarpool={handleRemoveCarpool}
          onToast={addToast}
        />
      }
      topElements={
        <>
          <EventSchema games={games} />
          {/* Ticker for upcoming matches */}
          <MatchTicker games={sortedGames} />
        </>
      }
      toasts={
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      }
      footer={
        <>
          <ReloadPrompt />
          <Footer />
          {/* Bottom Navigation for Mobile */}
          <BottomNav
            currentView={currentView}
            onViewChange={handleViewChange}
            onPlanningClick={() => setIsProfileModalOpen(true)}
            isAuthenticated={isAuthenticated}
          />
        </>
      }
      modals={
        <>
          {/* CSV Import Modal */}
          <Suspense fallback={null}>
            {isImportModalOpen && (
              <ImportCSVModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportCSV}
                existingGames={sortedGames}
              />
            )}
          </Suspense>

          {/* Admin Stats Dashboard */}
          <Suspense fallback={null}>
            {isAdminStatsOpen && (
              <AdminStats
                games={games}
                onClose={() => setIsAdminStatsOpen(false)}
              />
            )}
          </Suspense>

          {/* Profile Modal - Triggered by Planning button on mobile */}
          {currentUser && (
            <ProfileModal
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
              user={currentUser}
              registrations={userRegistrations}
              games={games}
              onUnsubscribe={handleRemoveVolunteer}
              onRemoveCarpool={handleRemoveCarpool}
              onToast={addToast}
              allTeams={allTeams}
              favoriteTeams={favoriteTeams}
              onToggleFavorite={toggleFavoriteTeam}
            />
          )}
        </>
      }
    >
      <main className="container mx-auto px-4 relative z-20 pt-4">
        <PullToRefresh onRefresh={async () => {
          // Simulate refresh
          await new Promise(resolve => setTimeout(resolve, 1500));
          window.location.reload();
        }}>
          {/* Loading State */}
          {loading && <SkeletonLoader />}

          {/* Desktop View Toggle */}
          {!loading && (
            <div className="flex justify-center mb-8 hidden md:flex">
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                <button
                  onClick={() => handleViewChange('home')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentView === 'home' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Liste
                </button>
                <button
                  onClick={() => handleViewChange('calendar')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentView === 'calendar' ? 'bg-slate-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Calendrier
                </button>
              </div>
            </div>
          )}

          {!loading && (
            <div className="flex justify-end mb-6 gap-4">
              {isAdmin && (
                <AdminToolbar
                  onImport={() => setIsImportModalOpen(true)}
                  onDashboard={() => setIsAdminStatsOpen(true)}
                  onAddGame={() => setIsAddingGame(true)}
                />
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

          {/* Planning View - Always mounted, hidden when not active */}
          <div className={currentView === 'calendar' ? '' : 'hidden'}>
            <Suspense fallback={<SkeletonLoader />}>
              <PlanningView
                games={filteredGames}
                userRegistrations={userRegistrationsMap}
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
            </Suspense>
          </div>

          {/* Grouped Games List - Always mounted, hidden when not active */}
          <div className={currentView === 'home' ? '' : 'hidden'}>
            <GameList
              games={filteredGames}
              userRegistrations={userRegistrationsMap}
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
          </div>

          {/* Empty State for Planning View specifically (was previously separate, merged into AppLayout children logic implicitly by placement order logic in App.tsx?) 
             Wait, in original App.tsx, this empty state block was AFTER </main> but BEFORE <ReloadPrompt>.
             It seemed to be floating? 
             Ah, lines 352-371 in original App.tsx. 
             It was outside <main>!
             I should include it in 'children' inside <main> if I want correct layout, or keep it outside. 
             If it's content, it should probably be in main.
             But the original code had it outside.
             Let's put it at the end of `children`.
          */}
          {
            !loading && currentView === 'planning' && filteredGames.length === 0 && (
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
                  onClick={() => handleViewChange('home')}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
                >
                  Voir tous les matchs
                </button>
              </div>
            )
          }
        </PullToRefresh>
      </main>
    </AppLayout>
  );
}

export default App;