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
 * Scroll to a visible game element with temporary focus highlight
 */
export const scrollToGameCard = (gameId: string): boolean => {
  const el = findVisibleGameElement(gameId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
    setTimeout(() => {
      el.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2');
    }, 1500);
    return true;
  }
  return false;
};
