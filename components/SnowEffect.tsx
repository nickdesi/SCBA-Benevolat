import React, { useEffect, useRef, memo } from 'react';

// --- Constants (outside component to avoid recreation) ---
const ACCUMULATION_RES = 4; // Increased for fewer bins to process
const PARTICLE_COUNT = 25; // Reduced from 60 for better performance
const MAX_ACCUMULATION = 12;

// --- Simplified Particle Type (no text/rotation) ---
interface Particle {
    x: number;
    y: number;
    radius: number;
    speed: number;
    swayPhase: number;
    swayAmp: number;
    opacity: number;
}

const SnowEffect: React.FC = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let accumulation: number[] = [];
        let lastTime = 0;
        const targetFPS = 30; // Limit to 30fps for smoother feel
        const frameInterval = 1000 / targetFPS;

        const initAccumulation = () => {
            const bins = Math.ceil(canvas.width / ACCUMULATION_RES);
            accumulation = new Array(bins).fill(0);
        };

        const resetParticle = (randomY = false): Particle => ({
            x: Math.random() * canvas.width,
            y: randomY ? Math.random() * canvas.height : -10,
            radius: Math.random() * 3 + 2,
            speed: Math.random() * 0.8 + 0.3,
            swayPhase: Math.random() * Math.PI * 2,
            swayAmp: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.4 + 0.4,
        });

        const createParticles = () => {
            particles = Array.from({ length: PARTICLE_COUNT }, () => resetParticle(true));
        };

        const resizeCanvas = () => {
            canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
            createParticles();
            initAccumulation();
        };

        const draw = (currentTime: number) => {
            animationFrameId = requestAnimationFrame(draw);

            // Frame rate limiting
            const deltaTime = currentTime - lastTime;
            if (deltaTime < frameInterval) return;
            lastTime = currentTime - (deltaTime % frameInterval);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw accumulation (simplified path)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            for (let i = 0; i < accumulation.length; i++) {
                ctx.lineTo(i * ACCUMULATION_RES, canvas.height - accumulation[i]);
            }
            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fill();

            // Draw all particles as snowflakes
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Draw snowflake (6-pointed star)
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.swayPhase * 0.5); // Slow rotation
                ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.beginPath();

                // Draw 3 lines crossing through center (6 points)
                for (let j = 0; j < 3; j++) {
                    const angle = (j * Math.PI) / 3;
                    const len = p.radius * 1.5;
                    ctx.moveTo(Math.cos(angle) * len, Math.sin(angle) * len);
                    ctx.lineTo(Math.cos(angle + Math.PI) * len, Math.sin(angle + Math.PI) * len);
                }
                ctx.stroke();
                ctx.restore();

                // Update physics
                p.y += p.speed;
                p.swayPhase += 0.02;
                p.x += Math.sin(p.swayPhase) * p.swayAmp;

                // Accumulation logic
                const binIndex = Math.floor(Math.max(0, Math.min(canvas.width - 1, p.x)) / ACCUMULATION_RES);
                const currentAcc = accumulation[binIndex] || 0;

                if (p.y >= canvas.height - currentAcc - p.radius) {
                    if (currentAcc < MAX_ACCUMULATION) {
                        accumulation[binIndex] += 0.3;
                    }
                    particles[i] = resetParticle();
                } else if (p.y > canvas.height + 10) {
                    particles[i] = resetParticle();
                }

                // Wrap X
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.x < -10) p.x = canvas.width + 10;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animationFrameId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
            style={{ width: '100%', height: '100%', willChange: 'contents' }}
        />
    );
});

SnowEffect.displayName = 'SnowEffect';

export default SnowEffect;
