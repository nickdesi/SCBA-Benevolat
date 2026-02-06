import React, { useState, useEffect, useCallback, Suspense, lazy, startTransition } from 'react';
import { User } from 'firebase/auth';
import { List, Calendar, Trophy, Search, CalendarDays } from 'lucide-react';
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
import { onAuthStateChanged, signOut, signInWithGoogle } from './utils/authStore';
import UserAuthModal from './components/UserAuthModal';
import { useGames } from './utils/useGames';
import { useCarpoolRegistrations } from './utils/useCarpoolRegistrations';
import { useUserProfile } from './utils/useUserProfile';
import EventSchema from './components/EventSchema';

// Lazy-loaded components (code-splitting for reduced initial bundle)
// AdminAuthModal removed as per request
const ImportCSVModal = lazy(() => import('./components/ImportCSVModal'));
const GameForm = lazy(() => import('./components/GameForm'));
const PlanningView = lazy(() => import('./components/planning/PlanningView'));

import AdminToolbar from './components/AdminToolbar';
import PullToRefresh from './components/PullToRefresh';
import { EmptyState } from './components/EmptyState';
import { AppLayout } from './components/Layout/AppLayout';
import { AnnouncementBanner } from './components/Layout/AnnouncementBanner';
import NetworkStatus from './components/NetworkStatus';

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
      setIsProfileModalOpen(false); // Close Profile Modal when switching views
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
    handleRequestSeat,
    handleAcceptPassenger,
    handleRejectPassenger,
    handleCancelRequest,
    userRegistrations,
    userRegistrationsMap,
    allTeams // Use allTeams from useGames for the most up-to-date list
  } = useGames({ selectedTeam, currentView, favoriteTeams });

  // User carpools from games data
  const { userCarpools } = useCarpoolRegistrations({ games });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  // Handler pour la connexion Google depuis le modal
  const handleGoogleLogin = useCallback(async () => {
    try {
      await signInWithGoogle();
      setIsAuthModalOpen(false);
      addToast('Connexion réussie !', 'success');
    } catch (error) {
      console.error("Google login failed:", error);
      addToast('Erreur de connexion Google', 'error');
    }
  }, [addToast]);

  const handleAddGame = useCallback(async (gameData: GameFormData) => {
    try {
      await addGame(gameData);
      setIsAddingGame(false);
    } catch (err) {
      console.error("Error adding game:", err);
      addToast("Erreur lors de l'ajout du match", 'error');
    }
  }, [addGame, addToast]);

  const handleUpdateGame = useCallback(async (updatedGame: Game) => {
    try {
      await updateGame(updatedGame);
      setEditingGameId(null);
    } catch (err) {
      console.error("Error updating game:", err);
      addToast("Erreur lors de la modification du match", 'error');
    }
  }, [updateGame, addToast]);

  const handleDeleteGame = useCallback(async (gameId: string) => {
    try {
      const deleted = await deleteGame(gameId);
      if (deleted && editingGameId === gameId) {
        setEditingGameId(null);
      }
    } catch (err) {
      console.error("Error deleting game:", err);
      addToast("Erreur lors de la suppression du match", 'error');
    }
  }, [deleteGame, editingGameId, addToast]);

  const handleImportCSV = useCallback(async (matchesData: GameFormData[]) => {
    try {
      await importGames(matchesData);
      addToast(`${matchesData.length} match(s) importé(s) avec succès !`, 'success');
      setIsImportModalOpen(false);
    } catch (err) {
      console.error("Error importing games:", err);
      addToast("Erreur lors de l'import des matchs", 'error');
    }
  }, [importGames, addToast]);

  // Wrapped handlers with toast feedback
  const handleVolunteerWithToast = useCallback(async (gameId: string, roleId: string, parentName: string) => {
    // Vérifier si l'utilisateur est connecté avant de tenter l'inscription
    if (!isAuthenticated) {
      addToast('Connectez-vous pour vous inscrire', 'info');
      // Petit délai pour que le toast soit visible avant le modal
      setTimeout(() => setIsAuthModalOpen(true), 400);
      return;
    }

    try {
      await handleVolunteer(gameId, roleId, parentName);
      addToast('Inscription confirmée !', 'success');
    } catch (err) {
      console.error("Error adding volunteer:", err);
      addToast("Erreur lors de l'inscription", 'error');
    }
  }, [handleVolunteer, addToast, isAuthenticated]);

  const handleAddCarpoolWithToast = useCallback(async (gameId: string, entry: Omit<import('./types').CarpoolEntry, 'id'>) => {
    // Vérifier si l'utilisateur est connecté avant de tenter l'inscription
    if (!isAuthenticated) {
      addToast('Connectez-vous pour proposer un covoiturage', 'info');
      // Petit délai pour que le toast soit visible avant le modal
      setTimeout(() => setIsAuthModalOpen(true), 400);
      return;
    }

    try {
      await handleAddCarpool(gameId, entry);
      addToast('🚗 Inscription covoiturage confirmée !', 'success');
    } catch (err) {
      console.error("Error adding carpool:", err);
      addToast("Erreur lors de l'inscription covoiturage", 'error');
    }
  }, [handleAddCarpool, addToast, isAuthenticated]);

  const handleRequestSeatWithToast = useCallback(async (gameId: string, passengerId: string, driverId: string) => {
    try {
      await handleRequestSeat(gameId, passengerId, driverId);
      addToast('✨ Demande envoyée au conducteur !', 'success');
    } catch (err) {
      console.error("Error requesting seat:", err);
      addToast("Erreur lors de la demande", 'error');
    }
  }, [handleRequestSeat, addToast]);

  const handleAcceptPassengerWithToast = useCallback(async (gameId: string, driverId: string, passengerId: string) => {
    try {
      await handleAcceptPassenger(gameId, driverId, passengerId);
      addToast('✅ Passager accepté !', 'success');
    } catch (err: any) {
      console.error("Error accepting passenger:", err);
      addToast(err.message || "Erreur lors de l'acceptation", 'error');
    }
  }, [handleAcceptPassenger, addToast]);

  const handleRejectPassengerWithToast = useCallback(async (gameId: string, driverId: string, passengerId: string) => {
    try {
      await handleRejectPassenger(gameId, driverId, passengerId);
      addToast('Demande refusée', 'info');
    } catch (err) {
      console.error("Error rejecting passenger:", err);
      addToast("Erreur lors du refus", 'error');
    }
  }, [handleRejectPassenger, addToast]);

  const handleCancelRequestWithToast = useCallback(async (gameId: string, passengerId: string) => {
    try {
      await handleCancelRequest(gameId, passengerId);
      addToast('Demande annulée', 'info');
    } catch (err) {
      console.error("Error canceling request:", err);
      addToast("Erreur lors de l'annulation", 'error');
    }
  }, [handleCancelRequest, addToast]);

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
          onOpenAdminStats={() => setIsAdminStatsOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      }
      topElements={
        <>
          <AnnouncementBanner />
          <EventSchema games={games} />
          {/* Ticker restored */}
          <MatchTicker games={sortedGames} />
        </>
      }
      toasts={
        <>
          <NetworkStatus />
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
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
          <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
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
          <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
            {isAdminStatsOpen && (
              <AdminStats
                games={games}
                onClose={() => setIsAdminStatsOpen(false)}
                onToast={addToast}
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
              userCarpools={userCarpools}
              onUnsubscribe={handleRemoveVolunteer}
              onRemoveCarpool={handleRemoveCarpool}
              onToast={addToast}
              allTeams={allTeams}
              favoriteTeams={favoriteTeams}
              onToggleFavorite={toggleFavoriteTeam}
            />
          )}

          {/* Auth Modal - Triggered when guest tries to volunteer */}
          <UserAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onGoogleLogin={handleGoogleLogin}
            onToast={addToast}
          />
        </>
      }
    >
      <main className="container mx-auto px-4 relative z-20 pt-4">
        <PullToRefresh onRefresh={async () => {
          // Simulate network check (Firestore is real-time, but this gives feedback)
          await new Promise(resolve => setTimeout(resolve, 800));
          addToast('Données synchronisées', 'success');
        }}>
          {/* Grid Stack Container for stable layout transition */}
          <div className="grid grid-cols-1">
            {/* Skeleton Layer - Maintains height contribution to grid */}
            <div
              className={`col-start-1 row-start-1 transition-opacity duration-500 ease-out ${loading ? 'opacity-100 z-20' : 'opacity-0 -z-10 pointer-events-none'}`}
              aria-hidden={!loading}
            >
              <SkeletonLoader />
            </div>

            {/* Content Layer - Superimposed in same grid cell */}
            <div className={`col-start-1 row-start-1 transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100 z-30'}`}>
              {/* Desktop View Toggle - always rendered, visibility controlled by parent opacity */}
              <div className="flex justify-center mb-8 hidden md:flex">
                <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-2xl shadow-lg border border-white/50 dark:border-slate-700 backdrop-blur-xl inline-flex relative">
                  {/* Active Indicator Background */}
                  <div
                    className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md transition-all duration-300 ease-out`}
                    style={{
                      left: currentView === 'home' ? '6px' : '50%',
                      width: 'calc(50% - 6px)',
                      transform: currentView === 'home' ? 'translateX(0)' : 'translateX(2px)'
                    }}
                  />

                  <button
                    onClick={() => handleViewChange('home')}
                    className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 min-w-[120px] flex items-center justify-center gap-2 ${currentView === 'home' ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    <List className="w-4 h-4" /> Liste
                  </button>
                  <button
                    onClick={() => handleViewChange('calendar')}
                    className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 min-w-[120px] flex items-center justify-center gap-2 ${currentView === 'calendar' ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    <Calendar className="w-4 h-4" /> Calendrier
                  </button>
                </div>
              </div>

              {/* Admin Toolbar - always rendered, visibility controlled by parent opacity */}
              <div className="flex justify-end mb-6 gap-4">
                {isAdmin && (
                  <AdminToolbar
                    onImport={() => setIsImportModalOpen(true)}
                    onAddGame={() => setIsAddingGame(true)}
                  />
                )}
              </div>

              {/* Empty State - conditional render (no space reservation needed) */}
              {!loading && games.length === 0 && !isAddingGame && (
                <div className="animate-fade-in-up">
                  <EmptyState
                    icon={<Trophy className="w-16 h-16 text-orange-500" strokeWidth={1.5} />}
                    title="Aucun match prévu"
                    description="Le calendrier est vide pour le moment. Revenez bientôt pour découvrir les prochains matchs !"
                    variant="fun"
                    action={isAdmin ? {
                      label: "Ajouter un match",
                      onClick: () => setIsAddingGame(true),
                      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    } : undefined}
                  />
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
                    onRequestSeat={handleRequestSeatWithToast}
                    onAcceptPassenger={handleAcceptPassengerWithToast}
                    onRejectPassenger={handleRejectPassengerWithToast}
                    onCancelRequest={handleCancelRequestWithToast}
                    onToast={addToast}
                    onEditRequest={setEditingGameId}
                    onCancelEdit={() => setEditingGameId(null)}
                    onDeleteRequest={handleDeleteGame}
                    onUpdateRequest={handleUpdateGame}
                  />
                </Suspense>
              </div>

              {/* Grouped Games List - Always mounted, hidden when not active */}
              {/* Grouped Games List - Always mounted, hidden when not active */}
              <div className={currentView === 'home' ? '' : 'hidden'}>
                {filteredGames.length > 0 ? (
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
                    onRequestSeat={handleRequestSeatWithToast}
                    onAcceptPassenger={handleAcceptPassengerWithToast}
                    onRejectPassenger={handleRejectPassengerWithToast}
                    onCancelRequest={handleCancelRequestWithToast}
                    onToast={addToast}
                    onEditRequest={setEditingGameId}
                    onCancelEdit={() => setEditingGameId(null)}
                    onDeleteRequest={handleDeleteGame}
                    onUpdateRequest={handleUpdateGame}
                  />
                ) : (
                  !loading && games.length > 0 && (
                    <EmptyState
                      icon={<Search className="w-12 h-12 text-slate-400" strokeWidth={1.5} />}
                      title="Aucun résultat"
                      description="Aucun match ne correspond à vos filtres actuels."
                      variant="simple"
                      className="mt-8 mb-20 animate-fade-in-up bg-white rounded-3xl shadow-lg border border-slate-100"
                      action={{
                        label: "Effacer les filtres",
                        onClick: () => setSelectedTeam(null), // Assuming resetting filter helps
                        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      }}
                    />
                  )
                )}
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
                  <EmptyState
                    icon={<CalendarDays className="w-12 h-12 text-slate-400" strokeWidth={1.5} />}
                    title="Planning vide"
                    description="Vous n'êtes inscrit à aucun match pour le moment. Retournez à l'accueil pour vous inscrire !"
                    variant="simple"
                    className="mt-8 mb-20 animate-fade-in-up bg-white rounded-3xl shadow-lg border border-slate-100"
                    action={{
                      label: "Voir tous les matchs",
                      onClick: () => handleViewChange('home')
                    }}
                  />
                )
              }
            </div>{/* End content layer */}
          </div>{/* End grid container */}
        </PullToRefresh>
      </main>
    </AppLayout>
  );
}

export default App;