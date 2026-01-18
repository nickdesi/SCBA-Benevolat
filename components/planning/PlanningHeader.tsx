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
            <div className="flex items-center gap-2 sm:gap-4 bg-white/70 dark:bg-slate-900/60 p-1.5 sm:p-2 rounded-full border border-white/50 dark:border-slate-700 shadow-xl shadow-indigo-500/10 w-full md:w-auto justify-between md:justify-center backdrop-blur-xl transition-all hover:shadow-indigo-500/20 hover:border-indigo-500/30">
                <button
                    onClick={onPrevWeek}
                    className="p-3 sm:p-4 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all active:scale-95 shadow-sm hover:shadow-md"
                    aria-label="Semaine précédente"
                >
                    <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                </button>

                <div className="flex flex-col items-center min-w-[140px] px-2">
                    <h2 className="text-slate-800 dark:text-white font-bold text-lg md:text-xl leading-none mb-1 tracking-tight capitalize font-sport">
                        {formattedMonth}
                    </h2>
                    <span className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/20">
                        {getWeekRange(currentDate)}
                    </span>
                </div>

                <button
                    onClick={onNextWeek}
                    className="p-3 sm:p-4 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all active:scale-95 shadow-sm hover:shadow-md"
                    aria-label="Semaine suivante"
                >
                    <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                </button>
            </div>

            {/* Actions (Bottom on mobile, Right on desktop) */}
            <button
                onClick={onToday}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:scale-95 border border-white/20"
            >
                <Calendar size={18} />
                <span className="text-sm uppercase tracking-wide">Aujourd'hui</span>
            </button>

        </div>
    );
};

export default PlanningHeader;
