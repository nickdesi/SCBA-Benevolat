/**
 * Utility for haptic feedback using the Web Vibration API.
 * Patterns:
 * - light: single short pulse
 * - medium: slightly longer pulse
 * - success: pattern for success actions
 * - warning: pattern for warning/errors
 * - elite: premium double-tap pattern
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' | 'elite' | number | number[] = 'light') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        let pattern: number | number[];

        switch (type) {
            case 'light':
                pattern = 6;
                break;
            case 'medium':
                pattern = 15;
                break;
            case 'success':
                pattern = [10, 30, 10];
                break;
            case 'warning':
                pattern = [50, 50, 50];
                break;
            case 'elite':
                pattern = [10, 40, 5];
                break;
            default:
                pattern = type;
        }

        navigator.vibrate(pattern);
    }
};
