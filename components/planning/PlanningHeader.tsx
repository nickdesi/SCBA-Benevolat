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
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-8 select-none">

            {/* Navigation Pill (Center on Desktop, Top on Mobile) */}
            <div className="flex items-center gap-4 bg-slate-950/80 p-2 rounded-full border border-slate-800 shadow-xl w-full md:w-auto justify-between md:justify-center backdrop-blur-md">
                <button
                    onClick={onPrevWeek}
                    className="p-3 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all active:scale-90"
                    aria-label="Semaine précédente"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="flex flex-col items-center min-w-[150px] px-2">
                    <h2 className="text-white font-bold text-lg md:text-xl leading-none mb-1 tracking-tight">
                        {formattedMonth}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        {getWeekRange(currentDate)}
                    </span>
                </div>

                <button
                    onClick={onNextWeek}
                    className="p-3 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all active:scale-90"
                    aria-label="Semaine suivante"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Actions (Bottom on mobile, Right on desktop) */}
            <button
                onClick={onToday}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:scale-95"
            >
                <Calendar size={20} />
                <span className="text-base">Aujourd'hui</span>
            </button>

        </div>
    );
};

export default PlanningHeader;
