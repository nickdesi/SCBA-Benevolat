import React from 'react';

interface FilterBarProps {
    teams: string[];
    selectedTeam: string | null;
    onSelectTeam: (team: string | null) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ teams, selectedTeam, onSelectTeam }) => {
    if (teams.length === 0) return null;

    return (
        <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 container mx-auto">
            <div className="flex gap-2 min-w-max">
                <button
                    onClick={() => onSelectTeam(null)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedTeam === null
                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 ring-2 ring-slate-800 ring-offset-2'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    Tous les matchs
                </button>
                {teams.map((team) => (
                    <button
                        key={team}
                        onClick={() => onSelectTeam(team)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedTeam === team
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-200 ring-2 ring-red-500 ring-offset-2'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {team}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FilterBar;
