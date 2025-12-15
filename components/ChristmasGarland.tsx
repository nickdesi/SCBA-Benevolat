import React, { useMemo } from 'react';

// --- Constants (outside component) ---
const COLORS = ['#f87171', '#4ade80', '#fbbf24', '#60a5fa'];
const LIGHTS_COUNT = 12;
const RADIUS_X = 60;
const RADIUS_Y = 60;

interface ChristmasGarlandProps {
    children: React.ReactNode;
    className?: string;
}

const ChristmasGarland: React.FC<ChristmasGarlandProps> = ({ children, className = '' }) => {
    const lights = useMemo(() =>
        Array.from({ length: LIGHTS_COUNT }, (_, i) => {
            const angle = (i / LIGHTS_COUNT) * 2 * Math.PI;
            const left = 50 + RADIUS_X * Math.cos(angle);
            const top = 50 + RADIUS_Y * Math.sin(angle);
            const color = COLORS[i % COLORS.length];
            const delay = (i % 3) * 0.5;

            return (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 4px ${color}`,
                        animation: `garland-blink 1.5s infinite ease-in-out ${delay}s`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            );
        }),
        []);

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Inline keyframes to ensure they're always present */}
            <style>{`
                @keyframes garland-blink {
                    0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.8); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                }
            `}</style>
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

