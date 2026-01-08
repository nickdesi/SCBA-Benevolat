import React, { useState } from 'react';
import type { Game, CarpoolEntry } from '../../types';
import PlanningHeader from './PlanningHeader';
import DesktopGrid from './DesktopGrid';
import MobileTimeline from './MobileTimeline';

interface PlanningViewProps {
    games: Game[];
    isAdmin: boolean;
    editingGameId: string | null;
    onVolunteer: (gameId: string, roleId: string, parentName: string) => void;
    onRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => void;
    onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
    onAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => void;
    onRemoveCarpool: (gameId: string, entryId: string) => void;
    onToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onEditRequest: (gameId: string) => void;
    onCancelEdit: () => void;
    onDeleteRequest: (gameId: string) => void;
    onUpdateRequest: (game: Game) => void;
    userRegistrations?: Map<string, string>;
    isAuthenticated?: boolean;
}

const PlanningView: React.FC<PlanningViewProps> = ({
    games,
    isAdmin,
    editingGameId,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer,
    onAddCarpool,
    onRemoveCarpool,
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

    // Common props to pass to GameCard through grid components
    const gameCardProps = {
        isAdmin,
        editingGameId,
        onVolunteer,
        onRemoveVolunteer,
        onUpdateVolunteer,
        onAddCarpool,
        onRemoveCarpool,
        onToast,
        onEditRequest,
        onCancelEdit,
        onDeleteRequest,
        onUpdateRequest,
        userRegistrations,
        isAuthenticated,
    };

    return (
        <div className="animate-fade-in">
            <PlanningHeader
                currentDate={currentDate}
                onNextWeek={handleNextWeek}
                onPrevWeek={handlePrevWeek}
                onToday={handleToday}
            />

            <DesktopGrid
                games={games}
                currentDate={currentDate}
                {...gameCardProps}
            />

            <MobileTimeline
                games={games}
                currentDate={currentDate}
                {...gameCardProps}
            />
        </div>
    );
};

export default PlanningView;
