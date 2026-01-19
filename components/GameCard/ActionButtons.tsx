import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { GoogleCalendarIcon, OutlookCalendarIcon, AppleCalendarIcon } from '../Icons';
import type { Game } from '../../types';
import { downloadGameCalendar, getGoogleCalendarUrl, getOutlookCalendarUrl } from '../../utils/calendar';

interface ActionButtonsProps {
    game: Game;
    isHomeGame: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ game, isHomeGame }) => {
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
        <div ref={calendarPickerRef} className="relative mb-4 flex gap-2">
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                className="flex-1 py-2.5 px-4 flex items-center justify-center gap-2
                    text-xs sm:text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl
                    hover:bg-indigo-100 transition-colors"
                aria-label="Ajouter au calendrier"
            >
                <Calendar className="w-4 h-4" />
                <span>Calendrier</span>
            </motion.button>

            {/* Calendar Dropdown */}
            {showCalendarPicker && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                >
                    <button onClick={handleGoogleCalendar} className="w-full px-4 py-3 flex gap-3 hover:bg-slate-50 text-sm font-medium text-slate-700 items-center">
                        <GoogleCalendarIcon className="w-5 h-5" /> Google
                    </button>
                    <button onClick={handleOutlookCalendar} className="w-full px-4 py-3 flex gap-3 hover:bg-slate-50 text-sm font-medium text-slate-700 border-t border-slate-50 items-center">
                        <OutlookCalendarIcon className="w-5 h-5" /> Outlook
                    </button>
                    <button onClick={handleAppleCalendar} className="w-full px-4 py-3 flex gap-3 hover:bg-slate-50 text-sm font-medium text-slate-700 border-t border-slate-50 items-center">
                        <AppleCalendarIcon className="w-5 h-5" /> Apple (.ics)
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default ActionButtons;
