import React, { useState, useEffect, useCallback, Suspense, lazy, startTransition } from 'react';
import { User } from 'firebase/auth';
import { List, Calendar, Trophy, Search, CalendarDays } from 'lucide-react';
import Header from './components/Header';
import GameList from './components/GameList';
import MatchTicker from './components/MatchTicker';
import SkeletonLoader from './components/SkeletonLoader';
import ReloadPrompt from './components/ReloadPrompt';
import InstallPrompt from './components/InstallPrompt';
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
// AdminStats must be declared at module level — NOT inside App() to avoid
// creating a new lazy reference on every render (which remounts the component).
const AdminStats = lazy(() => import('./components/AdminStats'));

import AdminToolbar from './components/AdminToolbar';
import PullToRefresh from './components/PullToRefresh';
import { EmptyState } from './components/EmptyState';
import { AppLayout } from './components/Layout/AppLayout';
import { AnnouncementBanner } from './components/Layout/AnnouncementBanner';
import NetworkStatus from './components/NetworkStatus';
import { useAppActions } from './hooks/useAppActions';

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
    const unsubscribe = onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      if (user) {
        // Source de vérité : custom claim 'admin' défini côté serveur (Cloud Function).
        // Fallback : email vérifié pendant la période de transition (avant que le claim soit présent).
        const tokenResult = await user.getIdTokenResult();
        const adminByClaim = tokenResult.claims['admin'] === true;
        const adminByEmail = user.email === 'benevole@scba.fr';
        setIsAdmin(adminByClaim || adminByEmail);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const {
    addGameWithToast,
    updateGameWithToast,
    deleteGameWithToast,
    importCSVWithToast,
    volunteerWithToast,
    removeVolunteerWithToast,
    updateVolunteerWithToast,
    addCarpoolWithToast,
    requestSeatWithToast,
    acceptPassengerWithToast,
    rejectPassengerWithToast,
    cancelRequestWithToast
  } = useAppActions({
    isAuthenticated,
    setIsAuthModalOpen,
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
    handleCancelRequest
  });

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      addToast('Déconnexion réussie', 'success');
    } catch {
      addToast('Erreur lors de la déconnexion', 'error');
    }
  }, [addToast]);

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
          onUnsubscribe={removeVolunteerWithToast}
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
          <InstallPrompt />
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
                onImport={async (d) => { if (await importCSVWithToast(d)) setIsImportModalOpen(false); }}
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
              onUnsubscribe={removeVolunteerWithToast}
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
            onGoogleLogin={async () => { await signInWithGoogle(); setIsAuthModalOpen(false); addToast('Connexion !', 'success'); }}
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
          <div className="grid grid-cols-1 min-h-[400px]">
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
                      onSave={async (d) => { if (await addGameWithToast(d)) setIsAddingGame(false); }}
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
                    onVolunteer={volunteerWithToast}
                    onRemoveVolunteer={removeVolunteerWithToast}
                    onUpdateVolunteer={updateVolunteerWithToast}
                    onAddCarpool={addCarpoolWithToast}
                    onRemoveCarpool={handleRemoveCarpool}
                    onRequestSeat={requestSeatWithToast}
                    onAcceptPassenger={acceptPassengerWithToast}
                    onRejectPassenger={rejectPassengerWithToast}
                    onCancelRequest={cancelRequestWithToast}
                    onToast={addToast}
                    onEditRequest={setEditingGameId}
                    onCancelEdit={() => setEditingGameId(null)}
                    onDeleteRequest={deleteGameWithToast}
                    onUpdateRequest={async (g) => { if (await updateGameWithToast(g)) setEditingGameId(null); }}
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
                    onVolunteer={volunteerWithToast}
                    onRemoveVolunteer={removeVolunteerWithToast}
                    onUpdateVolunteer={updateVolunteerWithToast}
                    onAddCarpool={addCarpoolWithToast}
                    onRemoveCarpool={handleRemoveCarpool}
                    onRequestSeat={requestSeatWithToast}
                    onAcceptPassenger={acceptPassengerWithToast}
                    onRejectPassenger={rejectPassengerWithToast}
                    onCancelRequest={cancelRequestWithToast}
                    onToast={addToast}
                    onEditRequest={setEditingGameId}
                    onCancelEdit={() => setEditingGameId(null)}
                    onDeleteRequest={deleteGameWithToast}
                    onUpdateRequest={async (g) => { if (await updateGameWithToast(g)) setEditingGameId(null); }}
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