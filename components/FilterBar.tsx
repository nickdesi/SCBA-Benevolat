import React from 'react';

interface FilterBarProps {
    teams: string[];
    selectedTeam: string | null;
    onSelectTeam: (team: string | null) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ teams, selectedTeam, onSelectTeam }) => {
    if (teams.length === 0) return null;

    return (
        <div className="sticky top-0 z-30 mb-8 py-4 backdrop-blur-xl bg-slate-50/80 border-b border-slate-200/50 -mx-4 px-4 container mx-auto overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 min-w-max justify-center md:justify-start">
                <button
                    onClick={() => onSelectTeam(null)}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 transform active:scale-95 ${selectedTeam === null
                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20 scale-105'
                        : 'bg-white text-slate-500 hover:text-slate-700 hover:bg-white/80 shadow-sm hover:shadow-md'
                        }`}
                >
                    Tous
                </button>
                {teams.map((team) => (
                    <button
                        key={team}
                        onClick={() => onSelectTeam(team)}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 transform active:scale-95 whitespace-nowrap ${selectedTeam === team
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30 scale-105'
                            : 'bg-white text-slate-500 hover:text-slate-700 hover:bg-white/80 shadow-sm hover:shadow-md'
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
