import { useRef, useState, useCallback, MouseEvent } from 'react';

export const useDraggableScroll = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = useCallback((e: MouseEvent) => {
        if (!ref.current) return;
        setIsDragging(true);
        setStartX(e.pageX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);
        ref.current.style.cursor = 'grabbing';
        ref.current.style.userSelect = 'none';
    }, []);

    const onMouseLeave = useCallback(() => {
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.cursor = 'grab';
            ref.current.style.removeProperty('user-select');
        }
    }, []);

    const onMouseUp = useCallback(() => {
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.cursor = 'grab';
            ref.current.style.removeProperty('user-select');
        }
    }, []);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        ref.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft]);

    return {
        ref,
        events: {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove
        },
        style: {
            cursor: 'grab' as const
        }
    };
};
