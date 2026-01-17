import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface PlanningHeaderProps {
    currentDate: Date;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onToday: () => void;
}

const PlanningHeader: React.FC<PlanningHeaderProps> = ({
    currentDate,
    onPrevWeek,
    onNextWeek,
    onToday
}) => {
    // Format: "Janvier 2025"
    const monthLabel = currentDate.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric'
    });

    // Capitalize first letter
    const formattedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    // Get week range (assuming Start is Monday)
    const getWeekRange = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
    };

    return (
        <div className="flex flex-row items-center justify-start gap-4 sm:gap-6 px-1 mb-4 select-none">

            {/* Left: Title & Nav */}
            <div className="flex items-center gap-3 sm:gap-4">
                {/* Text Info */}
                <div className="flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-none tracking-tight">
                        {formattedMonth}
                    </h2>
                    <span className="text-xs text-slate-400 font-medium mt-0.5">
                        {getWeekRange(currentDate)}
                    </span>
                </div>

                {/* Navigation Arrows (Mini) */}
                <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/50 ml-1">
                    <button
                        onClick={onPrevWeek}
                        className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
                        aria-label="Semaine précédente"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-700/50 mx-0.5"></div>
                    <button
                        onClick={onNextWeek}
                        className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
                        aria-label="Semaine suivante"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Right: Actions */}
            <button
                onClick={onToday}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-lg border border-slate-700 transition-all active:scale-95"
            >
                <Calendar size={16} className="text-blue-400" />
                <span className="hidden sm:inline">Aujourd'hui</span>
            </button>

        </div>
    );
};

export default PlanningHeader;
