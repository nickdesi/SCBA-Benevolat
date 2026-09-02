import React from 'react';
import type { Role } from '../../types';
import VolunteerSlot from '../VolunteerSlot';

interface VolunteerSectionProps {
  roles: Role[];
  gameId: string;
  teamName: string;
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
  onUpdateVolunteer,
}) => {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white/60 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-100 dark:border-slate-800/80">
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
          animationDelay={index * 0.03}
        />
      ))}
    </div>
  );
};

export default VolunteerSection;
