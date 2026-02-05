import React from 'react';
import type { Role } from '../../types';
import VolunteerSlot from '../VolunteerSlot';

interface VolunteerSectionProps {
    roles: Role[];
    gameId: string;
    isAdmin: boolean;
    userRegistrations?: Map<string, string>;
    isAuthenticated?: boolean;
    onVolunteer: (gameId: string, roleId: string, parentName: string | string[]) => void;
    onRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => void;
    onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
}

const VolunteerSection: React.FC<VolunteerSectionProps> = ({
    roles,
    gameId,
    isAdmin,
    userRegistrations,
    isAuthenticated,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer
}) => {
    return (
        <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Postes à pourvoir</h4>
            <div className="space-y-2">
                {roles.map((role, index) => (
                    <VolunteerSlot
                        key={role.id}
                        role={role}
                        gameId={gameId}
                        isAdmin={isAdmin}
                        myRegistrationName={userRegistrations?.get(`${gameId}_${role.id}`)}
                        isAuthenticated={isAuthenticated}
                        onVolunteer={(parentName) => onVolunteer(gameId, role.id, parentName)}
                        onRemoveVolunteer={(volunteerName) => onRemoveVolunteer(gameId, role.id, volunteerName)}
                        onUpdateVolunteer={(oldName, newName) => onUpdateVolunteer(gameId, role.id, oldName, newName)}
                        animationDelay={index * 0.05}
                    />
                ))}
            </div>
        </div>
    );
};

export default VolunteerSection;
