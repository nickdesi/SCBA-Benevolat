import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullY, setPullY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isDragging = useRef(false);
    const THRESHOLD = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY <= 0) {
            startY.current = e.touches[0].clientY;
            isDragging.current = true;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (window.scrollY === 0 && diff > 0) {
            // Apply resistance
            setPullY(Math.min(diff * 0.5, THRESHOLD * 1.5));
            // Prevent native pull to refresh if possible, though not always cancellable
        } else {
            setPullY(0);
            isDragging.current = false;
        }
    };

    const handleTouchEnd = async () => {
        isDragging.current = false;
        if (pullY >= THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullY(0);
            }
        } else {
            setPullY(0);
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Loading Indicator */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{
                    y: isRefreshing ? 20 : (pullY > 0 ? pullY * 0.5 : -50),
                    opacity: isRefreshing || pullY > 0 ? 1 : 0,
                    rotate: isRefreshing ? 360 : pullY * 2
                }}
                transition={{ duration: isRefreshing ? 1 : 0.2, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                className="absolute top-0 left-0 right-0 flex justify-center items-center z-10 pointer-events-none"
            >
                <div className={`w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent ${isRefreshing ? '' : ''} bg-white p-1 shadow-md`} />
            </motion.div>

            {/* Content */}
            <motion.div
                animate={{ y: isRefreshing ? THRESHOLD : pullY }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative z-20"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default PullToRefresh;
