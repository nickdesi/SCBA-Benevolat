import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const ReloadPrompt: React.FC = () => {
    const [isUpdating, setIsUpdating] = useState(false);

    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
            // Check for updates every 30 seconds (more aggressive)
            if (r) {
                setInterval(() => {
                    console.log('Checking for SW updates...');
                    r.update();
                }, 30 * 1000);
                // Also check immediately on mount
                r.update();

                // Clear old caches on registration
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => {
                            // Delete old workbox caches
                            if (name.includes('workbox') || name.includes('precache')) {
                                console.log('Clearing old cache:', name);
                                caches.delete(name);
                            }
                        });
                    });
                }
            }
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    // Auto-refresh when update is available
    useEffect(() => {
        if (needRefresh && !isUpdating) {
            setIsUpdating(true);
            console.log('Update detected, refreshing...');

            const performUpdate = async () => {
                // Try to skip waiting (force activate)
                updateServiceWorker(true);

                // Wait a short moment for SW to activate, then reload unconditionally
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            };

            performUpdate();
        }
    }, [needRefresh, isUpdating, updateServiceWorker]);

    const closeOfflineReady = () => {
        setOfflineReady(false);
    };

    // Show updating notification
    if (isUpdating) {
        return (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 z-[99999] w-[90%] md:w-auto">
                <div className="bg-slate-800 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in-up">
                    <div className="animate-spin text-2xl">🔄</div>
                    <div>
                        <h3 className="font-bold text-base">Mise à jour en cours...</h3>
                        <p className="text-sm text-slate-300">La page va se rafraîchir automatiquement.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show offline ready notification
    if (offlineReady) {
        return (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 z-[99999] w-[90%] md:w-auto">
                <div className="bg-slate-800 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex flex-col gap-3 animate-fade-in-up">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                            <h3 className="font-bold text-base">Application prête hors ligne</h3>
                            <p className="text-sm text-slate-300 mt-0.5">L'application peut être utilisée sans internet.</p>
                        </div>
                    </div>
                    <button
                        onClick={closeOfflineReady}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default ReloadPrompt;
