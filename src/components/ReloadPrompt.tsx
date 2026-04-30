import React, { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_INTERVAL_MS = 30 * 1000;

const ReloadPrompt: React.FC = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const updateIntervalRef = useRef<number | null>(null);
    const shouldReloadOnControllerChangeRef = useRef(false);
    const hasReloadedRef = useRef(false);

    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            if (!r) return;

            r.update();
            updateIntervalRef.current = window.setInterval(() => {
                r.update();
            }, UPDATE_CHECK_INTERVAL_MS);
        },
        onRegisterError(error) {
            console.warn('SW registration error', error);
        },
    });

    useEffect(() => {
        return () => {
            if (updateIntervalRef.current !== null) {
                window.clearInterval(updateIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const reloadOnControllerChange = () => {
            if (!shouldReloadOnControllerChangeRef.current || hasReloadedRef.current) return;

            hasReloadedRef.current = true;
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', reloadOnControllerChange);
        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', reloadOnControllerChange);
        };
    }, []);

    // Auto-refresh when update is available
    useEffect(() => {
        if (needRefresh && !isUpdating) {
            shouldReloadOnControllerChangeRef.current = true;
            setIsUpdating(true);
            updateServiceWorker(true);
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
