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
 * Universal scroll to a visible game element with guaranteed visual highlight and header offset.
 * Compatible with Brave Mobile, Chrome Mobile, iOS Safari, and Desktop.
 */
export const scrollToGameCard = (gameId: string, addHighlight: boolean = true): boolean => {
  const el = findVisibleGameElement(gameId);
  if (el) {
    // 1. Calculate absolute target position with header & ticker offset (~95px)
    const rect = el.getBoundingClientRect();
    const currentScroll =
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const targetY = Math.max(0, rect.top + currentScroll - 95);

    // 2. Perform smooth scroll via window.scrollTo
    try {
      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, targetY);
    }

    // 3. Fallback for strict browsers (Brave Mobile, old WebKit)
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      el.scrollIntoView(true);
    }

    // 4. Guaranteed visual feedback via rounded-aware box-shadow + border glow
    if (addHighlight) {
      const prevTransition = el.style.transition;
      const prevBoxShadow = el.style.boxShadow;
      const prevBorderColor = el.style.borderColor;

      el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      el.style.boxShadow = '0 0 0 3px #3b82f6, 0 0 35px rgba(59, 130, 246, 0.7)';
      el.style.borderColor = '#3b82f6';

      setTimeout(() => {
        el.style.boxShadow = prevBoxShadow;
        el.style.borderColor = prevBorderColor;
        setTimeout(() => {
          el.style.transition = prevTransition;
        }, 300);
      }, 2500);
    }
    return true;
  }
  return false;
};
