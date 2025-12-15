import React, { useMemo } from 'react';

// --- Constants (outside component) ---
const COLORS = ['#f87171', '#4ade80', '#fbbf24', '#60a5fa'];
const LIGHTS_COUNT = 12;
const RADIUS_X = 60; // Horizontal radius %
const RADIUS_Y = 60; // Vertical radius %

interface ChristmasGarlandProps {
    children: React.ReactNode;
    className?: string;
}

const ChristmasGarland: React.FC<ChristmasGarlandProps> = ({ children, className = '' }) => {
    // Memoize lights since their positions are static
    const lights = useMemo(() =>
        Array.from({ length: LIGHTS_COUNT }, (_, i) => {
            const angle = (i / LIGHTS_COUNT) * 2 * Math.PI;
            const left = 50 + RADIUS_X * Math.cos(angle);
            const top = 50 + RADIUS_Y * Math.sin(angle);
            const color = COLORS[i % COLORS.length];
            const animationDelay = `${(i % 3) * 0.5}s`;

            return (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full garland-light"
                    style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 4px ${color}`,
                        animationDelay,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            );
        }),
        []);

    return (
        <div className={`relative inline-block ${className}`}>
            <div className="absolute inset-0 pointer-events-none z-20">
                {lights}
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default ChristmasGarland;
