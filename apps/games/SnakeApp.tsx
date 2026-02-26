import React, { useState, useEffect, useCallback, useRef } from 'react';

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION: Direction = 'RIGHT';
const BASE_TICK_MS = 120;
const MIN_TICK_MS = 50;

const OPPOSITES: Record<Direction, Direction> = {
  UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
};

const SnakeApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Game state stored in refs for smooth animation loop
  const snake = useRef<Point[]>([...INITIAL_SNAKE]);
  const direction = useRef<Direction>(INITIAL_DIRECTION);
  const directionQueue = useRef<Direction[]>([]);
  const food = useRef<Point>({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const gameOver = useRef(false);
  const isPaused = useRef(false);
  const lastTick = useRef(0);
  const boardSize = useRef(400);

  // React state for UI only
  const [displayScore, setDisplayScore] = useState(0);
  const [displayGameOver, setDisplayGameOver] = useState(false);
  const [displayPaused, setDisplayPaused] = useState(false);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
    }
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    snake.current = [{ x: 10, y: 10 }];
    direction.current = INITIAL_DIRECTION;
    directionQueue.current = [];
    food.current = { x: 15, y: 10 };
    scoreRef.current = 0;
    gameOver.current = false;
    isPaused.current = false;
    lastTick.current = 0;
    setDisplayScore(0);
    setDisplayGameOver(false);
    setDisplayPaused(false);
    if (containerRef.current) containerRef.current.focus();
  }, []);

  // Enqueue a direction change (handles rapid input correctly)
  const enqueueDirection = useCallback((newDir: Direction) => {
    if (gameOver.current) return;

    // Determine what the "current effective direction" is
    const queue = directionQueue.current;
    const effectiveDir = queue.length > 0 ? queue[queue.length - 1] : direction.current;

    // Don't allow opposite or same direction
    if (newDir === effectiveDir || newDir === OPPOSITES[effectiveDir]) return;

    // Cap queue to 3 to prevent overflow from spamming
    if (queue.length < 3) {
      directionQueue.current = [...queue, newDir];
    }
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver.current && (e.key === ' ' || e.key === 'Enter')) {
        resetGame();
        return;
      }
      if (e.key === ' ') {
        isPaused.current = !isPaused.current;
        setDisplayPaused(isPaused.current);
        return;
      }

      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP', w: 'UP', W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
      };
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        enqueueDirection(dir);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [enqueueDirection, resetGame]);

  // Touch swipe handler
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || gameOver.current) return;
    const end = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = end.x - touchStart.current.x;
    const dy = end.y - touchStart.current.y;

    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
      if (Math.abs(dx) > Math.abs(dy)) {
        enqueueDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        enqueueDirection(dy > 0 ? 'DOWN' : 'UP');
      }
    }
    touchStart.current = null;
  }, [enqueueDirection]);

  // Calculate board size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const maxSize = Math.min(rect.width - 16, rect.height - 130, 500);
        boardSize.current = Math.max(200, maxSize);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Main game + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (timestamp: number) => {
      const size = boardSize.current;
      const cellSize = size / GRID_SIZE;

      // Set canvas size
      canvas.width = size;
      canvas.height = size;

      // Game tick
      const tickMs = Math.max(MIN_TICK_MS, BASE_TICK_MS - Math.floor(scoreRef.current / 50) * 8);
      if (!gameOver.current && !isPaused.current && timestamp - lastTick.current >= tickMs) {
        lastTick.current = timestamp;

        // Consume from direction queue
        if (directionQueue.current.length > 0) {
          direction.current = directionQueue.current.shift()!;
        }

        // Move
        const head = snake.current[0];
        const newHead = { ...head };
        switch (direction.current) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          gameOver.current = true;
          setDisplayGameOver(true);
        }
        // Self collision
        else if (snake.current.some(s => s.x === newHead.x && s.y === newHead.y)) {
          gameOver.current = true;
          setDisplayGameOver(true);
        } else {
          snake.current = [newHead, ...snake.current];

          if (newHead.x === food.current.x && newHead.y === food.current.y) {
            scoreRef.current += 10;
            setDisplayScore(scoreRef.current);
            food.current = generateFood(snake.current);
          } else {
            snake.current.pop();
          }
        }
      }

      // ===== Render =====
      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, size, size);

      // Grid lines (subtle)
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(size, i * cellSize);
        ctx.stroke();
      }

      // Food with glow
      const fx = food.current.x * cellSize;
      const fy = food.current.y * cellSize;
      const pulse = 0.8 + Math.sin(timestamp / 200) * 0.2;

      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8 * pulse;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(fx + cellSize / 2, fy + cellSize / 2, cellSize * 0.4 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Snake
      for (let i = snake.current.length - 1; i >= 0; i--) {
        const seg = snake.current[i];
        const sx = seg.x * cellSize;
        const sy = seg.y * cellSize;
        const pad = 1;

        if (i === 0) {
          // Head with gradient
          const headGrad = ctx.createRadialGradient(
            sx + cellSize / 2, sy + cellSize / 2, 0,
            sx + cellSize / 2, sy + cellSize / 2, cellSize
          );
          headGrad.addColorStop(0, '#86efac');
          headGrad.addColorStop(1, '#22c55e');
          ctx.fillStyle = headGrad;
          ctx.shadowColor = '#4ade80';
          ctx.shadowBlur = 6;
        } else {
          // Body — gradient from green to darker green
          const t = i / snake.current.length;
          const r = Math.round(34 + (22 - 34) * t);
          const g = Math.round(197 + (163 - 197) * t);
          const b = Math.round(94 + (74 - 94) * t);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.shadowBlur = 0;
        }

        const radius = Math.min(cellSize * 0.2, 4);
        ctx.beginPath();
        ctx.roundRect(sx + pad, sy + pad, cellSize - pad * 2, cellSize - pad * 2, radius);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Eyes on head
      if (snake.current.length > 0) {
        const head = snake.current[0];
        const hx = head.x * cellSize;
        const hy = head.y * cellSize;
        const eyeSize = cellSize * 0.15;
        ctx.fillStyle = '#1e293b';

        let e1x = 0, e1y = 0, e2x = 0, e2y = 0;
        switch (direction.current) {
          case 'RIGHT': e1x = 0.65; e1y = 0.25; e2x = 0.65; e2y = 0.75; break;
          case 'LEFT': e1x = 0.35; e1y = 0.25; e2x = 0.35; e2y = 0.75; break;
          case 'UP': e1x = 0.25; e1y = 0.35; e2x = 0.75; e2y = 0.35; break;
          case 'DOWN': e1x = 0.25; e1y = 0.65; e2x = 0.75; e2y = 0.65; break;
        }
        ctx.beginPath();
        ctx.arc(hx + cellSize * e1x, hy + cellSize * e1y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx + cellSize * e2x, hy + cellSize * e2y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Paused overlay
      if (isPaused.current && !gameOver.current) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${size * 0.08}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', size / 2, size / 2);
      }

      // Game Over overlay
      if (gameOver.current) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ef4444';
        ctx.font = `bold ${size * 0.08}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', size / 2, size / 2 - size * 0.06);
        ctx.fillStyle = '#fff';
        ctx.font = `${size * 0.05}px sans-serif`;
        ctx.fillText(`Score: ${scoreRef.current}`, size / 2, size / 2 + size * 0.02);
        ctx.font = `${size * 0.035}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Tap or Press Space to Retry', size / 2, size / 2 + size * 0.08);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [generateFood]);

  // D-pad handler
  const handleDpadPress = useCallback((dir: Direction) => {
    if (gameOver.current) return;
    enqueueDirection(dir);
  }, [enqueueDirection]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-2 sm:p-4 outline-none select-none"
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => { if (gameOver.current) resetGame(); }}
    >
      {/* Header */}
      <div className="flex justify-between w-full max-w-lg mb-2 px-2">
        <h1 className="text-xl sm:text-2xl font-bold text-green-400">Snake</h1>
        <div className="text-lg sm:text-xl font-mono">Score: {displayScore}</div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="rounded-lg border-2 border-slate-700"
        style={{ width: boardSize.current, height: boardSize.current, maxWidth: '100%', maxHeight: '100%' }}
      />

      {/* D-pad — mobile only */}
      <div className="mt-2 sm:hidden">
        <div className="grid grid-cols-3 gap-1 w-36">
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDpadPress('UP'); }}
            className="w-12 h-12 bg-slate-700 active:bg-green-600 rounded-lg flex items-center justify-center text-2xl font-bold text-white transition-colors"
          >▲</button>
          <div />

          <button
            onTouchStart={(e) => { e.preventDefault(); handleDpadPress('LEFT'); }}
            className="w-12 h-12 bg-slate-700 active:bg-green-600 rounded-lg flex items-center justify-center text-2xl font-bold text-white transition-colors"
          >◀</button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (gameOver.current) { resetGame(); return; }
              isPaused.current = !isPaused.current;
              setDisplayPaused(isPaused.current);
            }}
            className="w-12 h-12 bg-slate-600 active:bg-slate-500 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300 transition-colors"
          >{displayPaused ? '▶' : '⏸'}</button>
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDpadPress('RIGHT'); }}
            className="w-12 h-12 bg-slate-700 active:bg-green-600 rounded-lg flex items-center justify-center text-2xl font-bold text-white transition-colors"
          >▶</button>

          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDpadPress('DOWN'); }}
            className="w-12 h-12 bg-slate-700 active:bg-green-600 rounded-lg flex items-center justify-center text-2xl font-bold text-white transition-colors"
          >▼</button>
          <div />
        </div>
      </div>

      {/* Controls hint — desktop only */}
      <div className="mt-2 text-slate-500 text-xs text-center hidden sm:block">
        Arrow Keys / WASD to move · Space to pause
      </div>
    </div>
  );
};

export default SnakeApp;
