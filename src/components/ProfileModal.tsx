import React from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { User } from 'firebase/auth';
import type { Game, UserRegistration } from '../types';
import { VolunteerDashboard } from './volunteer/VolunteerDashboard';
import type { UserCarpoolRegistration } from '../hooks/useCarpoolRegistrations';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  registrations: UserRegistration[];
  games: Game[];
  userCarpools: UserCarpoolRegistration[];
  onUnsubscribe: (
    gameId: string,
    roleId: string,
    volunteerName: string,
    registrationId?: string,
  ) => Promise<void>;
  onRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  allTeams: string[];
  favoriteTeams: string[];
  onToggleFavorite: (team: string) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  registrations,
  games,
  userCarpools,
  onUnsubscribe,
  onRemoveCarpool,
  onToast,
  allTeams,
  favoriteTeams,
  onToggleFavorite,
}) => {
  const dragControls = useDragControls();

  const handleDragStart = (e: React.PointerEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      dragControls.start(e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content — bottom sheet on mobile, centered dialog on sm+ */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragDirectionLock
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 80 || info.velocity.y > 300) {
                onClose();
              }
            }}
            className="relative w-full sm:max-w-4xl h-[92dvh] sm:h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
          >
            {/* Drag handle — mobile only (touch target 44px+) */}
            <div
              onPointerDown={handleDragStart}
              className="sm:hidden flex items-center justify-center pt-3 pb-2 px-6 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
              aria-label="Glisser vers le bas pour fermer"
              role="button"
              tabIndex={0}
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors" />
            </div>
            <VolunteerDashboard
              user={user}
              registrations={registrations}
              games={games}
              userCarpools={userCarpools}
              onClose={onClose}
              onUnsubscribe={onUnsubscribe}
              onRemoveCarpool={onRemoveCarpool}
              onToast={onToast}
              allTeams={allTeams}
              favoriteTeams={favoriteTeams}
              onToggleFavorite={onToggleFavorite}
              onDragStart={handleDragStart}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
