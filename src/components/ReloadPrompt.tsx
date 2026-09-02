import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, CheckCircle2, Sparkles, X } from 'lucide-react';

const ONE_HOUR_MS = 60 * 60 * 1000;

const ReloadPrompt: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const shouldReloadOnControllerChangeRef = useRef(false);
  const hasReloadedRef = useRef(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (!r) return;

      // Vérification initiale des mises à jour
      r.update();

      // Polling régulier toutes les heures avec fetch no-store pour bypasser le cache
      const intervalId = window.setInterval(async () => {
        if (!navigator.onLine) return;
        try {
          if (swUrl) {
            const resp = await fetch(swUrl, {
              cache: 'no-store',
              headers: {
                cache: 'no-store',
                'cache-control': 'no-cache',
              },
            });
            if (resp?.status === 200) {
              await r.update();
            }
          } else {
            await r.update();
          }
        } catch (err) {
          console.debug('[PWA] Échec vérification mise à jour:', err);
        }
      }, ONE_HOUR_MS);

      return () => clearInterval(intervalId);
    },
    onRegisterError(error) {
      console.warn('[PWA] Erreur enregistrement Service Worker:', error);
    },
  });

  // Rechargement automatique dès que le nouveau Service Worker prend le contrôle
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      if (!shouldReloadOnControllerChangeRef.current || hasReloadedRef.current) return;
      hasReloadedRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Auto-dismiss pour la notification offlineReady après 4 secondes
  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => {
        setOfflineReady(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, setOfflineReady]);

  // Signaler aux autres composants (InstallPrompt) qu'une notification ReloadPrompt est visible
  const isAnyVisible = isUpdating || needRefresh || offlineReady;
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(isAnyVisible ? 'pwa-reload-visible' : 'pwa-reload-hidden'),
    );
  }, [isAnyVisible]);

  const handleUpdate = async () => {
    shouldReloadOnControllerChangeRef.current = true;
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch {
      window.location.reload();
    }
  };

  const handleDismissOfflineReady = () => {
    setOfflineReady(false);
  };

  const handleDismissNeedRefresh = () => {
    setNeedRefresh(false);
  };

  return (
    <aside aria-label="Notifications de mise à jour PWA">
      <AnimatePresence>
        {/* Mise à jour en cours */}
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-4 left-4 right-4 md:top-6 md:right-6 md:left-auto md:w-96 z-[99999]"
            style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/40 backdrop-blur-xl flex items-center gap-3.5">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm md:text-base text-white">
                  Mise à jour en cours...
                </h3>
                <p className="text-xs md:text-sm text-slate-300 mt-0.5">
                  La page va se rafraîchir automatiquement.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notification Mise à jour disponible (needRefresh) */}
        {needRefresh && !isUpdating && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-4 left-4 right-4 md:top-6 md:right-6 md:left-auto md:w-[400px] z-[99999]"
            style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="bg-slate-900/95 text-white p-4.5 rounded-2xl shadow-2xl border border-indigo-500/40 backdrop-blur-xl flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-white">
                      Nouvelle version disponible !
                    </h3>
                    <p className="text-xs md:text-sm text-slate-300 mt-0.5 leading-relaxed">
                      Une mise à jour de l'application SCBA Bénévoles est prête.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismissNeedRefresh}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-[#272890] hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm py-2.5 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Mettre à jour
                </button>
                <button
                  onClick={handleDismissNeedRefresh}
                  className="text-xs md:text-sm text-slate-400 hover:text-slate-200 py-2.5 px-3 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notification Prêt hors-ligne (offlineReady) */}
        {offlineReady && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-4 left-4 right-4 md:top-6 md:right-6 md:left-auto md:w-96 z-[99998]"
            style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Prêt pour le mode hors-ligne</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Consultation active sans connexion internet.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissOfflineReady}
                className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 py-1.5 px-3 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default ReloadPrompt;
