import React, { useEffect, useRef } from 'react';

const SnowEffect: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        // Particle: x, y, size, speed (vertical), swaySpeed (oscillation), swayPhase, opacity, snowflakeChar, rotation, rotationSpeed
        let particles: {
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
        }[] = [];

        // Accumulation now tracks height with slightly less resolution
        let accumulation: number[] = [];
        const ACCUMULATION_RES = 2; // pixel width per bin

        const snowflakeChars = ['❄', '❅', '❆', '•']; // Added dot for variety

        const initAccumulation = () => {
            if (!canvas) return;
            const bins = Math.ceil(canvas.width / ACCUMULATION_RES);
            accumulation = new Array(bins).fill(0);
        };

        const createParticles = () => {
            const particleCount = 60; // Slightly reduced count for performance with text
            for (let i = 0; i < particleCount; i++) {
                particles.push(resetParticle(true));
            }
        };

        const resetParticle = (randomY = false) => {
            const width = canvas ? canvas.width : window.innerWidth;
            const height = canvas ? canvas.height : window.innerHeight;
            return {
                x: Math.random() * width,
                y: randomY ? Math.random() * height : -20, // Start slightly above
                size: Math.random() * 10 + 8, // Font size 8-18px
                speed: Math.random() * 0.5 + 0.2, // Slightly faster: 0.2 to 0.7
                swaySpeed: (Math.random() - 0.5) * 0.02,
                swayPhase: Math.random() * Math.PI * 2,
                opacity: Math.random() * 0.5 + 0.3,
                char: snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            };
        };

        const resizeCanvas = () => {
            canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
            particles = [];
            createParticles();
            initAccumulation();
        };

        const drawAccumulation = () => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            for (let i = 0; i < accumulation.length; i++) {
                const x = i * ACCUMULATION_RES;
                const h = accumulation[i];
                ctx.lineTo(x, canvas.height - h);
            }
            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fill();
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw accumulation
            drawAccumulation();

            // 2. Draw particles
            particles.forEach((p, index) => {
                ctx.save(); // Save state for rotation
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);

                ctx.font = `${p.size}px sans-serif`;
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.char, 0, 0);

                ctx.restore(); // Restore state

                // Update
                p.y += p.speed;
                p.swayPhase += p.swaySpeed;
                p.x += Math.sin(p.swayPhase) * 0.3;
                p.rotation += p.rotationSpeed;

                // Accumulation Logic
                // We use a simplified check for text particles: if bottom of char simply touches pile
                const binIndex = Math.floor(Math.max(0, Math.min(canvas.width - 1, p.x)) / ACCUMULATION_RES);
                const currentAcc = accumulation[binIndex] || 0;

                if (p.y >= canvas.height - currentAcc - (p.size / 2)) {
                    // Hit logic: Add to pile
                    if (currentAcc < 15) {
                        accumulation[binIndex] += p.size * 0.1; // Add height
                        // Spread
                        if (binIndex > 0) accumulation[binIndex - 1] += p.size * 0.05;
                        if (binIndex < accumulation.length - 1) accumulation[binIndex + 1] += p.size * 0.05;
                    }
                    particles[index] = resetParticle();
                } else if (p.y > canvas.height + 20) {
                    particles[index] = resetParticle();
                }

                // Wrap X
                if (p.x > canvas.width + 20) p.x = -20;
                if (p.x < -20) p.x = canvas.width + 20;
            });

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
