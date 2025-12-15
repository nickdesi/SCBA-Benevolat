import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const ReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 z-[99999] w-[90%] md:w-auto">
            <div className="bg-slate-800 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex flex-col gap-3 animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">
                        {offlineReady ? '✅' : '🚀'}
                    </span>
                    <div>
                        <h3 className="font-bold text-base">
                            {offlineReady ? 'Application prête hors ligne' : 'Mise à jour disponible'}
                        </h3>
                        <p className="text-sm text-slate-300 mt-0.5">
                            {offlineReady
                                ? 'L\'application peut être utilisée sans internet.'
                                : 'Une nouvelle version est disponible.'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mt-1">
                    {needRefresh && (
                        <button
                            onClick={async () => {
                                await updateServiceWorker(true);
                                // Force reload if SW update doesn't trigger it
                                setTimeout(() => {
                                    window.location.reload();
                                }, 100);
                            }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Mettre à jour
                        </button>
                    )}
                    <button
                        onClick={close}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReloadPrompt;
