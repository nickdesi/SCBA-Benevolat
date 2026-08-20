/**
 * Utility to find the truly visible GameCard DOM element across responsive layouts
 * (DesktopGrid hidden on mobile, MobileTimeline hidden on desktop, GameList).
 */
export const findVisibleGameElement = (gameId: string): HTMLElement | null => {
  const elements = document.querySelectorAll<HTMLElement>(
    `[data-game-id="${gameId}"], #game-${gameId}`,
  );

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    // An element is truly visible if it has layout dimensions and an active offsetParent (not inside display: none)
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && el.offsetParent !== null) {
      return el;
    }
  }

  return null;
};

/**
 * Scroll to a visible game element with temporary focus highlight.
 * Performs multiple scroll adjustments to compensate for Framer Motion layout animations.
 */
export const scrollToGameCard = (gameId: string, addHighlight: boolean = true): boolean => {
  const el = findVisibleGameElement(gameId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (addHighlight) {
      el.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2', 'shadow-2xl');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2', 'shadow-2xl');
      }, 2000);
    }
    return true;
  }
  return false;
};
