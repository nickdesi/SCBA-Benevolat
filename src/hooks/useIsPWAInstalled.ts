import { useEffect, useState } from 'react';

/**
 * Checks if the application is currently running as an installed PWA / standalone mode.
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Hook to reactively track whether the PWA is installed / running in standalone mode.
 */
export function useIsPWAInstalled(): boolean {
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isPWAInstalled());

  useEffect(() => {
    const check = () => {
      setIsInstalled(isPWAInstalled());
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', check);
    window.addEventListener('appinstalled', check);

    return () => {
      mediaQuery.removeEventListener('change', check);
      window.removeEventListener('appinstalled', check);
    };
  }, []);

  return isInstalled;
}
