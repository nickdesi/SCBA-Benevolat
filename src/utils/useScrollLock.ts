import { useEffect } from 'react';

/**
 * Custom hook to lock the body scroll when a component (like a modal) is open.
 * @param isOpen - Boolean indicating if the scroll should be locked.
 */
export const useScrollLock = (isOpen: boolean) => {
    useEffect(() => {
        if (isOpen) {
            // Store the original overflow style to restore it later
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);
};

export default useScrollLock;
