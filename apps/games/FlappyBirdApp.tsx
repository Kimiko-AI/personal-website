import React, { useState, useEffect, useRef, useCallback } from 'react';

// ===== Game Constants =====
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.45;
const JUMP_FORCE = -7.5;
const PIPE_WIDTH = 60;
const PIPE_GAP = 155;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_INTERVAL = 100; // frames
const BIRD_SIZE = 24;
const BIRD_X = 80;

// ===== Colors =====
const COLORS = {
    sky: '#0f172a',
    skyGrad: '#1e293b',
    bird: '#facc15',
    birdOutline: '#eab308',
    birdEye: '#1e293b',
    pipe: '#22c55e',
    pipeDark: '#16a34a',
    pipeHighlight: '#4ade80',
    pipeCap: '#15803d',
    ground: '#78716c',
    groundDark: '#57534e',
    text: '#ffffff',
    scoreGlow: '#facc15',
};

interface Pipe {
    x: number;
    topHeight: number;
    scored: boolean;
}

const FlappyBirdApp: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animFrameRef = useRef<number>(0);

    // Game state refs (using refs for animation loop performance)
    const birdY = useRef(CANVAS_HEIGHT / 2);
    const birdVelocity = useRef(0);
    const birdRotation = useRef(0);
    const pipes = useRef<Pipe[]>([]);
    const frameCount = useRef(0);
    const score = useRef(0);
    const bestScore = useRef(parseInt(localStorage.getItem('flappy-best') || '0'));
    const gameState = useRef<'idle' | 'playing' | 'dead'>('idle');
    const groundOffset = useRef(0);

    const [displayScore, setDisplayScore] = useState(0);
    const [displayBest, setDisplayBest] = useState(bestScore.current);
    const [displayState, setDisplayState] = useState<'idle' | 'playing' | 'dead'>('idle');
    const [scale, setScale] = useState(1);

    // Calculate scale to fit container
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const scaleX = rect.width / CANVAS_WIDTH;
                const scaleY = (rect.height - 10) / CANVAS_HEIGHT;
                setScale(Math.min(scaleX, scaleY, 1.2));
            }
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    const resetGame = useCallback(() => {
        birdY.current = CANVAS_HEIGHT / 2;
        birdVelocity.current = 0;
        birdRotation.current = 0;
        pipes.current = [];
        frameCount.current = 0;
        score.current = 0;
        gameState.current = 'idle';
        setDisplayScore(0);
        setDisplayState('idle');
    }, []);

    const jump = useCallback(() => {
        if (gameState.current === 'dead') {
            resetGame();
            return;
        }
        if (gameState.current === 'idle') {
            gameState.current = 'playing';
            setDisplayState('playing');
        }
        birdVelocity.current = JUMP_FORCE;
    }, [resetGame]);

    // Draw a single frame
    const drawFrame = useCallback((ctx: CanvasRenderingContext2D) => {
        const w = CANVAS_WIDTH;
        const h = CANVAS_HEIGHT;
        const groundY = h - 50;

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, COLORS.sky);
        skyGrad.addColorStop(1, COLORS.skyGrad);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Stars (subtle)
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 137.5) % w;
            const sy = (i * 73.1) % (groundY - 50);
            ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // ===== Update & Draw Pipes =====
        if (gameState.current === 'playing') {
            frameCount.current++;
            groundOffset.current = (groundOffset.current + PIPE_SPEED) % 40;

            // Spawn pipes
            if (frameCount.current % PIPE_SPAWN_INTERVAL === 0) {
                const minTop = 80;
                const maxTop = groundY - PIPE_GAP - 80;
                const topHeight = Math.random() * (maxTop - minTop) + minTop;
                pipes.current.push({ x: w + 10, topHeight, scored: false });
            }

            // Move pipes
            pipes.current = pipes.current.filter(p => p.x + PIPE_WIDTH > -10);
            for (const pipe of pipes.current) {
                pipe.x -= PIPE_SPEED;

                // Scoring
                if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X) {
                    pipe.scored = true;
                    score.current++;
                    setDisplayScore(score.current);
                }
            }
        }

        // Draw pipes
        for (const pipe of pipes.current) {
            // Top pipe body
            const topPipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
            topPipeGrad.addColorStop(0, COLORS.pipeDark);
            topPipeGrad.addColorStop(0.3, COLORS.pipeHighlight);
            topPipeGrad.addColorStop(0.7, COLORS.pipe);
            topPipeGrad.addColorStop(1, COLORS.pipeDark);
            ctx.fillStyle = topPipeGrad;
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

            // Top pipe cap
            ctx.fillStyle = COLORS.pipeCap;
            ctx.fillRect(pipe.x - 4, pipe.topHeight - 20, PIPE_WIDTH + 8, 20);
            ctx.strokeStyle = COLORS.pipeDark;
            ctx.lineWidth = 1;
            ctx.strokeRect(pipe.x - 4, pipe.topHeight - 20, PIPE_WIDTH + 8, 20);

            // Bottom pipe body
            const bottomY = pipe.topHeight + PIPE_GAP;
            ctx.fillStyle = topPipeGrad;
            ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, groundY - bottomY);

            // Bottom pipe cap
            ctx.fillStyle = COLORS.pipeCap;
            ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 20);
            ctx.strokeStyle = COLORS.pipeDark;
            ctx.strokeRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 20);
        }

        // ===== Update Bird =====
        if (gameState.current === 'playing') {
            birdVelocity.current += GRAVITY;
            birdY.current += birdVelocity.current;
            birdRotation.current = Math.min(Math.max(birdVelocity.current * 3, -30), 70);
        } else if (gameState.current === 'idle') {
            // Gentle hover
            birdY.current = CANVAS_HEIGHT / 2 + Math.sin(Date.now() / 300) * 10;
            birdRotation.current = 0;
        }

        // ===== Draw Bird =====
        ctx.save();
        ctx.translate(BIRD_X, birdY.current);
        ctx.rotate((birdRotation.current * Math.PI) / 180);

        // Body
        ctx.fillStyle = COLORS.bird;
        ctx.beginPath();
        ctx.ellipse(0, 0, BIRD_SIZE, BIRD_SIZE * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.birdOutline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Wing
        ctx.fillStyle = COLORS.birdOutline;
        const wingFlap = Math.sin(Date.now() / 80) * 5;
        ctx.beginPath();
        ctx.ellipse(-5, wingFlap, 12, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(10, -6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.birdEye;
        ctx.beginPath();
        ctx.arc(12, -6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(BIRD_SIZE - 2, -3);
        ctx.lineTo(BIRD_SIZE + 12, 2);
        ctx.lineTo(BIRD_SIZE - 2, 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // ===== Collision Detection =====
        if (gameState.current === 'playing') {
            // Ground/ceiling
            if (birdY.current + BIRD_SIZE > groundY || birdY.current - BIRD_SIZE < 0) {
                gameState.current = 'dead';
                setDisplayState('dead');
                if (score.current > bestScore.current) {
                    bestScore.current = score.current;
                    localStorage.setItem('flappy-best', String(bestScore.current));
                    setDisplayBest(bestScore.current);
                }
            }

            // Pipes
            for (const pipe of pipes.current) {
                const birdLeft = BIRD_X - BIRD_SIZE;
                const birdRight = BIRD_X + BIRD_SIZE;
                const birdTop = birdY.current - BIRD_SIZE * 0.8;
                const birdBottom = birdY.current + BIRD_SIZE * 0.8;

                if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
                    if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
                        gameState.current = 'dead';
                        setDisplayState('dead');
                        if (score.current > bestScore.current) {
                            bestScore.current = score.current;
                            localStorage.setItem('flappy-best', String(bestScore.current));
                            setDisplayBest(bestScore.current);
                        }
                    }
                }
            }
        }

        // ===== Ground =====
        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(0, groundY, w, 50);
        // Ground stripes
        ctx.fillStyle = COLORS.groundDark;
        for (let gx = -groundOffset.current; gx < w; gx += 40) {
            ctx.fillRect(gx, groundY, 20, 6);
        }
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w, groundY);
        ctx.stroke();

        // ===== Score Display =====
        if (gameState.current === 'playing') {
            ctx.fillStyle = COLORS.text;
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 6;
            ctx.fillText(String(score.current), w / 2, 60);
            ctx.shadowBlur = 0;
        }

        // ===== Overlays =====
        if (gameState.current === 'idle') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = COLORS.scoreGlow;
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Flappy Bird', w / 2, h / 2 - 60);
            ctx.fillStyle = COLORS.text;
            ctx.font = '18px sans-serif';
            ctx.fillText('Tap or Press Space to Start', w / 2, h / 2);
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`Best: ${bestScore.current}`, w / 2, h / 2 + 35);
        }

        if (gameState.current === 'dead') {
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 40px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', w / 2, h / 2 - 50);
            ctx.fillStyle = COLORS.text;
            ctx.font = 'bold 28px monospace';
            ctx.fillText(`Score: ${score.current}`, w / 2, h / 2);
            ctx.font = '18px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`Best: ${bestScore.current}`, w / 2, h / 2 + 35);
            ctx.fillStyle = COLORS.text;
            ctx.font = '16px sans-serif';
            ctx.fillText('Tap or Press Space to Retry', w / 2, h / 2 + 75);
        }
    }, []);

    // Main game loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = () => {
            drawFrame(ctx);
            animFrameRef.current = requestAnimationFrame(loop);
        };
        animFrameRef.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animFrameRef.current);
    }, [drawFrame]);

    // Keyboard
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [jump]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-slate-950 flex flex-col items-center justify-center select-none outline-none overflow-hidden"
            tabIndex={0}
            onClick={jump}
            onTouchStart={(e) => { e.preventDefault(); jump(); }}
        >
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }}
                className="rounded-lg"
            />
            <div className="flex gap-6 mt-2 text-xs text-slate-500">
                <span>Score: {displayScore}</span>
                <span>Best: {displayBest}</span>
            </div>
        </div>
    );
};

export default FlappyBirdApp;
