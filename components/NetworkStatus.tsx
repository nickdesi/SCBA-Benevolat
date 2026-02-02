import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * NetworkStatus - Displays online/offline status banner
 * Shows when connection is lost and auto-hides when restored
 */
const NetworkStatus: React.FC = memo(() => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            // Haptic feedback on reconnection
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 30, 50]);
            }
            // Auto-hide after 2s
            setTimeout(() => setShowReconnected(false), 2000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
            // Haptic feedback on disconnect
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {/* Offline Banner */}
            {!isOnline && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 shadow-lg"
                    style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
                >
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                        <WifiOff className="w-4 h-4" />
                        <span>Hors ligne — Les données peuvent être obsolètes</span>
                    </div>
                </motion.div>
            )}

            {/* Reconnected Toast */}
            {showReconnected && isOnline && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-3 shadow-lg"
                    style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
                >
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                        <Wifi className="w-4 h-4" />
                        <span>Reconnecté ✓</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

NetworkStatus.displayName = 'NetworkStatus';

export default NetworkStatus;
