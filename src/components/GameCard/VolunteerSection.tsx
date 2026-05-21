import React from 'react';
import type { Role } from '../../types';
import VolunteerSlot from '../VolunteerSlot';

interface VolunteerSectionProps {
    roles: Role[];
    gameId: string;
    teamName: string; // New prop
    isAdmin: boolean;
    userRegistrations?: Map<string, string[]>;
    isAuthenticated?: boolean;
    onVolunteer: (gameId: string, roleId: string, parentName: string | string[]) => void;
    onRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => void;
    onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
}

const VolunteerSection: React.FC<VolunteerSectionProps> = ({
    roles,
    gameId,
    teamName,
    isAdmin,
    userRegistrations,
    isAuthenticated,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer
}) => {
    return (
        <div>


            <div className="space-y-4"> {/* Increased spacing for grid layout breathing room */}
                {roles.map((role, index) => (
                    <VolunteerSlot
                        key={role.id}
                        role={role}
                        gameId={gameId}
                        teamName={teamName}
                        isAdmin={isAdmin}
                        myRegistrationNames={userRegistrations?.get(`${gameId}_${role.id}`)}
                        isAuthenticated={isAuthenticated}
                        onVolunteer={onVolunteer}
                        onRemoveVolunteer={onRemoveVolunteer}
                        onUpdateVolunteer={onUpdateVolunteer}
                        animationDelay={index * 0.05}
                    />
                ))}
            </div>
        </div>
    );
};

export default VolunteerSection;
