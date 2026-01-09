import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const controls = useAnimation();
    const containerRef = useRef<HTMLDivElement>(null);
    const THRESHOLD = 80;

    const handleDragEnd = async (_: any, info: PanInfo) => {
        if (info.offset.y >= THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            await controls.start({ y: THRESHOLD }); // Stay open
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                controls.start({ y: 0 }); // Close
            }
        } else {
            controls.start({ y: 0 });
        }
    };

    return (
        <div ref={containerRef} className="relative overflow-hidden">
            {/* Loading Indicator */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{
                    y: isRefreshing ? 20 : Math.min(0, -50),
                    opacity: isRefreshing ? 1 : 0
                }}
                className="absolute top-0 left-0 right-0 flex justify-center items-center z-10 pointer-events-none"
            >
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin bg-white p-1 shadow-md"></div>
            </motion.div>

            {/* Draggable Content */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: THRESHOLD * 2 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative z-20 touch-pan-y"
                style={{ y: 0 }} // Default
            >
                {children}
            </motion.div>
        </div>
    );
};

export default PullToRefresh;
