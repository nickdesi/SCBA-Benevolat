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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-4 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm mb-6">

            {/* Date Navigation */}
            <div className="flex items-center gap-4 bg-slate-950/80 p-1.5 rounded-full border border-slate-800 shadow-lg">
                <button
                    onClick={onPrevWeek}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    aria-label="Semaine précédente"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex flex-col items-center min-w-[140px]">
                    <span className="text-white font-bold text-lg leading-none mb-0.5">
                        {formattedMonth}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        {getWeekRange(currentDate)}
                    </span>
                </div>

                <button
                    onClick={onNextWeek}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    aria-label="Semaine suivante"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Actions */}
            <button
                onClick={onToday}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
            >
                <Calendar size={16} />
                <span>Aujourd'hui</span>
            </button>

        </div>
    );
};

export default PlanningHeader;
