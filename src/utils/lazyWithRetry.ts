import { lazy, ComponentType } from 'react';

/**
 * Lazy load a React component with automatic retry upon chunk load failure.
 *
 * When a new deployment occurs on the server (Vite/Vercel/Dokploy), older hashed
 * asset chunks (e.g. `assets/ProfileModal-[hash].js`) may return HTTP 404.
 * This wrapper catches dynamic import errors, checks if a reload was already
 * attempted in this session, and reloads the page once to pull the fresh index HTML.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem('chunk_reload_retry') === 'true';

    try {
      const component = await componentImport();
      // Reset retry flag upon successful chunk resolution
      sessionStorage.removeItem('chunk_reload_retry');
      return component;
    } catch (error: unknown) {
      const err = error as Error;
      const isChunkError =
        err?.message?.includes('Failed to fetch dynamically imported module') ||
        err?.message?.includes('Loading chunk') ||
        err?.name === 'ChunkLoadError' ||
        (error && error.toString().includes('dynamically imported module'));

      if (isChunkError && !pageHasBeenRefreshed) {
        sessionStorage.setItem('chunk_reload_retry', 'true');
        window.location.reload();
        // Return a non-resolving promise while reload executes to prevent unhandled rejections
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }
  });
}
