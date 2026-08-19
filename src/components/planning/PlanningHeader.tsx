import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getDaysOfWeek } from '../../utils/dateUtils';

// ⚡ Bolt: Cache Intl.DateTimeFormat to avoid performance hit of Date.toLocaleDateString in render cycles
const monthYearFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
});
const dayMonthFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});

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
  onToday,
}) => {
  // Format: "Janvier 2025"
  const monthLabel = monthYearFormatter.format(currentDate);

  // Capitalize first letter
  const formattedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  // Get week range using shared utility
  const getWeekRange = (date: Date) => {
    const weekDays = getDaysOfWeek(date);
    const start = weekDays[0];
    const end = weekDays[6];

    return `${dayMonthFormatter.format(start)} - ${dayMonthFormatter.format(end)}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 select-none">
      {/* Navigation Pill */}
      <div className="flex items-center gap-2 sm:gap-3 bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-indigo-500/5 w-full sm:w-auto justify-between sm:justify-center backdrop-blur-xl transition-all">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={onPrevWeek}
          className="p-2.5 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 hover:text-[#3629e1] dark:text-slate-300 dark:hover:text-indigo-400 transition-colors shadow-xs"
          aria-label="Semaine précédente"
        >
          <ChevronLeft size={20} />
        </motion.button>

        <div className="flex flex-col items-center min-w-[140px] px-3">
          <h2 className="font-sport font-black text-slate-900 dark:text-white text-base md:text-lg leading-tight tracking-tight uppercase">
            {formattedMonth}
          </h2>
          <span className="text-[11px] text-[#3629e1] dark:text-indigo-300 font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/50 mt-0.5">
            {getWeekRange(currentDate)}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={onNextWeek}
          className="p-2.5 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 hover:text-[#3629e1] dark:text-slate-300 dark:hover:text-indigo-400 transition-colors shadow-xs"
          aria-label="Semaine suivante"
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* Aujourd'hui Action Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        onClick={onToday}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3629e1] to-[#272890] hover:from-[#2a21b4] hover:to-[#1a1a5e] text-white font-bold rounded-full shadow-md shadow-[#3629e1]/20 transition-all border border-white/20 min-h-[42px]"
      >
        <Calendar size={16} />
        <span className="text-xs uppercase tracking-wider font-sport">Aujourd'hui</span>
      </motion.button>
    </div>
  );
};

export default PlanningHeader;
