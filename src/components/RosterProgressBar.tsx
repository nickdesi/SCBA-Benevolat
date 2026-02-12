import React from 'react';

interface RosterProgressBarProps {
    totalSlots: number;
    filledSlots: number;
    className?: string;
}

const RosterProgressBar: React.FC<RosterProgressBarProps> = ({ totalSlots, filledSlots, className = "" }) => {
    const percentage = totalSlots > 0 ? Math.min(100, Math.round((filledSlots / totalSlots) * 100)) : 0;

    // Determine color based on completion
    let colorClass = "bg-red-500";
    if (percentage >= 100) colorClass = "bg-emerald-500";
    else if (percentage >= 50) colorClass = "bg-amber-500";

    return (
        <div className={`w-full ${className}`}>
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Effectif Match</span>
                <span className={`text-xs font-bold ${percentage >= 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {percentage}%
                </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClass} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default RosterProgressBar;
