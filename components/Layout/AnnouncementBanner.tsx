import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Megaphone, X } from 'lucide-react';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { AnimatePresence, motion } from 'framer-motion';

export const AnnouncementBanner: React.FC = () => {
    const { announcements, loading } = useAnnouncements();
    const [visible, setVisible] = useState(true);

    // Get the highest priority announcement
    const activeAnnouncement = announcements[0];

    // Local dismiss logic (per session or persistent?)
    // Design decision: Local storage for "Info" and "Warning", but "Urgent" always shows until expired.
    useEffect(() => {
        if (activeAnnouncement) {
            const dismissedId = localStorage.getItem('dismissed_announcement');
            if (dismissedId === activeAnnouncement.id && activeAnnouncement.type !== 'urgent') {
                setVisible(false);
            } else {
                setVisible(true);
            }
        }
    }, [activeAnnouncement]);

    if (loading || !activeAnnouncement || !visible) return null;

    const handleDismiss = () => {
        // Urgent messages cannot be dismissed (or maybe just temporarily?)
        // Let's allow dismiss for UX but it will reappear on refresh if urgent? 
        // No, standard UX: allow dismiss, but saves to local storage so it doesn't pop back up immediately.
        // BUT for Urgent, maybe we ignore local storage check on next load?
        // Let's stick to simple: Dismiss = Hide for now, store ID in localStorage.

        if (activeAnnouncement.type !== 'urgent') {
            localStorage.setItem('dismissed_announcement', activeAnnouncement.id);
        }
        setVisible(false);
    };

    const getStyles = () => {
        switch (activeAnnouncement.type) {
            case 'urgent':
                return 'bg-red-600 text-white animate-pulse-slow'; // Custom Keyframe or standard pulse? standard is clear enough
            case 'warning':
                return 'bg-orange-500 text-white';
            case 'info':
            default:
                return 'bg-blue-600 text-white';
        }
    };

    const getIcon = () => {
        switch (activeAnnouncement.type) {
            case 'urgent':
                return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
            case 'info':
            default:
                return <Info className="w-5 h-5 flex-shrink-0" />;
        }
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`${getStyles()} relative z-40 shadow-md overflow-hidden`}
                    role="alert"
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                            {getIcon()}
                            <p className="text-sm font-medium leading-tight">
                                <span className="sr-only">{activeAnnouncement.type}:</span>
                                {activeAnnouncement.message}
                            </p>
                        </div>

                        {/* Close button - Only if not SUPER urgent? Let's allow closing always for UI sanity */}
                        <button
                            onClick={handleDismiss}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                            aria-label="Fermer l'annonce"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
