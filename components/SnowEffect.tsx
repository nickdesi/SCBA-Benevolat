import React, { useEffect, useRef } from 'react';

// --- Constants (outside component to avoid recreation) ---
const SNOWFLAKE_CHARS = ['❄', '❅', '❆', '•'];
const ACCUMULATION_RES = 2; // pixel width per bin
const PARTICLE_COUNT = 60;
const MAX_ACCUMULATION = 15;

// --- Particle Type ---
interface Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
    swaySpeed: number;
    swayPhase: number;
    opacity: number;
    char: string;
    rotation: number;
    rotationSpeed: number;
}

const SnowEffect: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let accumulation: number[] = [];

        const initAccumulation = () => {
            const bins = Math.ceil(canvas.width / ACCUMULATION_RES);
            accumulation = new Array(bins).fill(0);
        };

        const resetParticle = (randomY = false): Particle => ({
            x: Math.random() * canvas.width,
            y: randomY ? Math.random() * canvas.height : -20,
            size: Math.random() * 10 + 8,
            speed: Math.random() * 0.5 + 0.2,
            swaySpeed: (Math.random() - 0.5) * 0.02,
            swayPhase: Math.random() * Math.PI * 2,
            opacity: Math.random() * 0.5 + 0.3,
            char: SNOWFLAKE_CHARS[Math.floor(Math.random() * SNOWFLAKE_CHARS.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
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

        const drawAccumulation = () => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            for (let i = 0; i < accumulation.length; i++) {
                ctx.lineTo(i * ACCUMULATION_RES, canvas.height - accumulation[i]);
            }
            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fill();
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawAccumulation();

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.font = `${p.size}px sans-serif`;
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.char, 0, 0);
                ctx.restore();

                // Update physics
                p.y += p.speed;
                p.swayPhase += p.swaySpeed;
                p.x += Math.sin(p.swayPhase) * 0.3;
                p.rotation += p.rotationSpeed;

                // Accumulation logic
                const binIndex = Math.floor(Math.max(0, Math.min(canvas.width - 1, p.x)) / ACCUMULATION_RES);
                const currentAcc = accumulation[binIndex] || 0;

                if (p.y >= canvas.height - currentAcc - p.size / 2) {
                    if (currentAcc < MAX_ACCUMULATION) {
                        accumulation[binIndex] += p.size * 0.1;
                        if (binIndex > 0) accumulation[binIndex - 1] += p.size * 0.05;
                        if (binIndex < accumulation.length - 1) accumulation[binIndex + 1] += p.size * 0.05;
                    }
                    particles[i] = resetParticle();
                } else if (p.y > canvas.height + 20) {
                    particles[i] = resetParticle();
                }

                // Wrap X
                if (p.x > canvas.width + 20) p.x = -20;
                if (p.x < -20) p.x = canvas.width + 20;
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default SnowEffect;
