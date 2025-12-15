import React from 'react';

interface ChristmasGarlandProps {
    children: React.ReactNode;
    className?: string; // Allow passing className for positioning
}

const ChristmasGarland: React.FC<ChristmasGarlandProps> = ({ children, className = '' }) => {
    // Colors: Red, Green, Gold, Blue
    const colors = ['#f87171', '#4ade80', '#fbbf24', '#60a5fa'];
    const lightsCount = 12; // Number of lights around the logo

    const lights = Array.from({ length: lightsCount }).map((_, i) => {
        // Position lights in a circle/ellipse
        // We'll use CSS to position them absolutely around the border
        // Simplified approach: distribute them by percentage along the edge? 
        // Or simpler: circular arrangement using calc()

        const angle = (i / lightsCount) * 2 * Math.PI;
        // Radius percentages (approximate for the logo's aspect ratio)
        // Logo is w-16 h-20 (mobile) to w-20 h-24 (desktop) => approx 0.8 aspect ratio width/height
        // We'll use % based positioning from center (50% 50%)

        // Adjust radius to be slightly outside the content
        const rX = 60; // Horizontal radius %
        const rY = 60; // Vertical radius %

        const left = 50 + rX * Math.cos(angle);
        const top = 50 + rY * Math.sin(angle);

        const color = colors[i % colors.length];
        const animationDelay = `${(i % 3) * 0.5}s`;

        return (
            <div
                key={i}
                className="absolute w-2 h-2 rounded-full shadow-sm transition-opacity duration-1000"
                style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 4px ${color}`,
                    animation: `blink 1.5s infinite ease-in-out ${animationDelay}`,
                    transform: 'translate(-50%, -50%)', // Center the dot
                }}
            />
        );
    });

    return (
        <div className={`relative inline-block ${className}`}>
            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.8); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); box-shadow: 0 0 8px currentColor; }
                }
            `}</style>

            {/* Render lights behind and in front? Just showing them around essentially */}
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
