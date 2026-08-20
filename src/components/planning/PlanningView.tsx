import React, { useState, useEffect, useCallback, memo } from 'react';
import type { Game, CarpoolEntry } from '../../types';
import PlanningHeader from './PlanningHeader';
import DesktopGrid from './DesktopGrid';
import MobileTimeline from './MobileTimeline';
import { scrollToGameCard } from '../../utils/scrollUtils';

interface PlanningViewProps {
  games: Game[];
  isAdmin: boolean;
  editingGameId: string | null;
  onVolunteer: (gameId: string, roleId: string, parentName: string | string[]) => void;
  onRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => void;
  onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
  onAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => void;
  onRemoveCarpool: (gameId: string, entryId: string) => void;
  onRequestSeat?: (gameId: string, passengerId: string, driverId: string) => void;
  onAcceptPassenger?: (gameId: string, driverId: string, passengerId: string) => void;
  onRejectPassenger?: (gameId: string, driverId: string, passengerId: string) => void;
  onCancelRequest?: (gameId: string, passengerId: string) => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onEditRequest: (gameId: string) => void;
  onCancelEdit: () => void;
  onDeleteRequest: (gameId: string) => void;
  onUpdateRequest: (game: Game) => void;
  userRegistrations?: Map<string, string[]>;
  isAuthenticated?: boolean;
}

const PlanningView: React.FC<PlanningViewProps> = memo(
  ({
    games,
    isAdmin,
    editingGameId,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer,
    onAddCarpool,
    onRemoveCarpool,
    onRequestSeat,
    onAcceptPassenger,
    onRejectPassenger,
    onCancelRequest,
    onToast,
    onEditRequest,
    onCancelEdit,
    onDeleteRequest,
    onUpdateRequest,
    userRegistrations,
    isAuthenticated,
  }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleNextWeek = () => {
      const next = new Date(currentDate);
      next.setDate(currentDate.getDate() + 7);
      setCurrentDate(next);
    };

    const handlePrevWeek = () => {
      const prev = new Date(currentDate);
      prev.setDate(currentDate.getDate() - 7);
      setCurrentDate(prev);
    };

    const handleToday = () => {
      setCurrentDate(new Date());
    };

    // Listen for ticker click → navigate to the correct week and scroll to game
    const [targetGameId, setTargetGameId] = useState<string | null>(null);

    const handleTickerNavigate = useCallback((e: Event) => {
      const { dateISO, gameId } = (e as CustomEvent).detail || {};
      if (dateISO) {
        // Robust local date parsing (sets to noon local time to avoid timezone week shift)
        const parts = dateISO.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          setCurrentDate(new Date(y, m, d, 12, 0, 0));
        } else {
          setCurrentDate(new Date(dateISO));
        }
      }
      if (gameId) {
        setTargetGameId(gameId);
      }
    }, []);

    useEffect(() => {
      window.addEventListener('ticker:navigate', handleTickerNavigate);
      return () => window.removeEventListener('ticker:navigate', handleTickerNavigate);
    }, [handleTickerNavigate]);

    // Polling effect: once week changes or targetGameId is set, scroll to the visible card as soon as it mounts
    useEffect(() => {
      if (!targetGameId) return;

      let attempts = 0;
      const maxAttempts = 30; // 30 * 50ms = 1.5s
      const timer = setInterval(() => {
        attempts++;
        if (scrollToGameCard(targetGameId, true)) {
          clearInterval(timer);
          // Re-adjust scroll after Framer Motion AnimatePresence and layout transitions finish
          setTimeout(() => scrollToGameCard(targetGameId, false), 250);
          setTimeout(() => {
            scrollToGameCard(targetGameId, false);
            setTargetGameId(null);
          }, 500);
        } else if (attempts >= maxAttempts) {
          clearInterval(timer);
          setTargetGameId(null);
        }
      }, 50);

      return () => clearInterval(timer);
    }, [targetGameId, currentDate]);

    // Common props to pass to GameCard through grid components
    const gameCardProps = {
      isAdmin,
      editingGameId,
      onVolunteer,
      onRemoveVolunteer,
      onUpdateVolunteer,
      onAddCarpool,
      onRemoveCarpool,
      onRequestSeat,
      onAcceptPassenger,
      onRejectPassenger,
      onCancelRequest,
      onToast,
      onEditRequest,
      onCancelEdit,
      onDeleteRequest,
      onUpdateRequest,
      userRegistrations,
      isAuthenticated,
    };

    return (
      <div>
        <PlanningHeader
          currentDate={currentDate}
          onNextWeek={handleNextWeek}
          onPrevWeek={handlePrevWeek}
          onToday={handleToday}
        />

        <DesktopGrid games={games} currentDate={currentDate} {...gameCardProps} />

        <MobileTimeline games={games} currentDate={currentDate} {...gameCardProps} />
      </div>
    );
  },
);

PlanningView.displayName = 'PlanningView';

export default PlanningView;
