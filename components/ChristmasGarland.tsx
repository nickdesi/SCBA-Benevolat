import React, { useMemo, memo } from 'react';

// --- Constants (outside component) ---
const COLORS = ['#f87171', '#4ade80', '#fbbf24', '#60a5fa'];
const LIGHTS_COUNT = 8; // Reduced from 12
const RADIUS_X = 58;
const RADIUS_Y = 58;

// CSS animation uses only opacity (GPU-friendly, no layout recalc)
const garlandStyles = `
@keyframes garland-glow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}
`;

interface ChristmasGarlandProps {
    children: React.ReactNode;
    className?: string;
}

const ChristmasGarland: React.FC<ChristmasGarlandProps> = memo(({ children, className = '' }) => {
    const lights = useMemo(() =>
        Array.from({ length: LIGHTS_COUNT }, (_, i) => {
            const angle = (i / LIGHTS_COUNT) * 2 * Math.PI;
            const left = 50 + RADIUS_X * Math.cos(angle);
            const top = 50 + RADIUS_Y * Math.sin(angle);
            const color = COLORS[i % COLORS.length];
            const delay = (i % 4) * 0.4;

            return (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 6px ${color}`,
                        animation: `garland-glow 2s infinite ease-in-out ${delay}s`,
                        transform: 'translate(-50%, -50%)',
                        willChange: 'opacity',
                    }}
                />
            );
        }),
        []);

    return (
        <div className={`relative inline-block ${className}`}>
            <style>{garlandStyles}</style>
            <div className="absolute inset-0 pointer-events-none z-20">
                {lights}
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
});

ChristmasGarland.displayName = 'ChristmasGarland';

export default ChristmasGarland;

