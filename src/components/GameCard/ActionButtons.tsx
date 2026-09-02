import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { GoogleCalendarIcon, OutlookCalendarIcon, AppleCalendarIcon } from '../Icons';
import type { Game } from '../../types';
import {
  downloadGameCalendar,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
} from '../../utils/calendar';

interface ActionButtonsProps {
  game: Game;
  isHomeGame: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ game, isHomeGame: _isHomeGame }) => {
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const calendarPickerRef = useRef<HTMLDivElement>(null);

  // Close calendar picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarPickerRef.current && !calendarPickerRef.current.contains(event.target as Node)) {
        setShowCalendarPicker(false);
      }
    };
    if (showCalendarPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendarPicker]);

  // Calendar Handlers
  const handleGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(game);
    if (url) window.open(url, '_blank');
    setShowCalendarPicker(false);
  };
  const handleOutlookCalendar = () => {
    const url = getOutlookCalendarUrl(game);
    if (url) window.open(url, '_blank');
    setShowCalendarPicker(false);
  };
  const handleAppleCalendar = () => {
    downloadGameCalendar(game);
    setShowCalendarPicker(false);
  };

  return (
    <div ref={calendarPickerRef} className="relative mb-3 flex gap-2">
      <motion.button
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => setShowCalendarPicker(!showCalendarPicker)}
        className="flex-1 min-h-[44px] py-2.5 px-4 flex items-center justify-center gap-2.5
                    text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100
                    bg-slate-100/95 dark:bg-slate-800/95 hover:bg-slate-200/90 dark:hover:bg-slate-700/90
                    border border-slate-200/80 dark:border-slate-700/80 rounded-xl transition-all shadow-xs"
        aria-label="Ajouter au calendrier"
      >
        <Calendar
          className="w-4.5 h-4.5 text-[#3629e1] dark:text-indigo-400 flex-shrink-0"
          aria-hidden="true"
        />
        <span>Ajouter au calendrier</span>
      </motion.button>

      {/* Calendar Dropdown */}
      {showCalendarPicker && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden backdrop-blur-xl"
        >
          <button
            onClick={handleGoogleCalendar}
            aria-label="Ajouter à Google Agenda"
            className="w-full px-4 py-2.5 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-bold text-slate-700 dark:text-slate-200 items-center transition-colors"
          >
            <GoogleCalendarIcon className="w-4 h-4" aria-hidden="true" /> Google Agenda
          </button>
          <button
            onClick={handleOutlookCalendar}
            aria-label="Ajouter à Outlook"
            className="w-full px-4 py-2.5 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-bold text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-700/50 items-center transition-colors"
          >
            <OutlookCalendarIcon className="w-4 h-4" aria-hidden="true" /> Outlook
          </button>
          <button
            onClick={handleAppleCalendar}
            aria-label="Télécharger le fichier ICS"
            className="w-full px-4 py-2.5 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-bold text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-700/50 items-center transition-colors"
          >
            <AppleCalendarIcon className="w-4 h-4" aria-hidden="true" /> Apple / iCal (.ics)
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ActionButtons;
