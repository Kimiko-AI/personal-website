import React, { useState, useEffect, useCallback, useRef } from 'react';

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION: Direction = 'RIGHT';
const INITIAL_SPEED = 150;

const SnakeApp: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    if (containerRef.current) containerRef.current.focus();
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        if (direction !== 'DOWN') setDirection('UP');
        break;
      case 'ArrowDown':
      case 's':
        if (direction !== 'UP') setDirection('DOWN');
        break;
      case 'ArrowLeft':
      case 'a':
        if (direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 'ArrowRight':
      case 'd':
        if (direction !== 'LEFT') setDirection('RIGHT');
        break;
      case ' ':
        setIsPaused(prev => !prev);
        break;
    }
  }, [direction, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { ...head };

        switch (direction) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        // Check wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const speed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
    const intervalId = setInterval(moveSnake, speed);

    return () => clearInterval(intervalId);
  }, [direction, food, gameOver, isPaused, score, generateFood]);

  // Touch controls
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || gameOver) return;
    
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30 && direction !== 'LEFT') setDirection('RIGHT');
      else if (dx < -30 && direction !== 'RIGHT') setDirection('LEFT');
    } else {
      if (dy > 30 && direction !== 'UP') setDirection('DOWN');
      else if (dy < -30 && direction !== 'DOWN') setDirection('UP');
    }
    setTouchStart(null);
  };

  return (
    <div 
      className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-4 outline-none"
      ref={containerRef}
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-between w-full max-w-md mb-4 px-4">
        <h1 className="text-2xl font-bold text-green-400">Snake</h1>
        <div className="text-xl font-mono">Score: {score}</div>
      </div>
      
      <div 
        className="relative bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden"
        style={{ width: 'min(90vw, 400px)', height: 'min(90vw, 400px)' }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute ${index === 0 ? 'bg-green-400' : 'bg-green-600'} rounded-sm`}
            style={{
              left: `${(segment.x / GRID_SIZE) * 100}%`,
              top: `${(segment.y / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
            }}
          />
        ))}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            left: `${(food.x / GRID_SIZE) * 100}%`,
            top: `${(food.y / GRID_SIZE) * 100}%`,
            width: `${100 / GRID_SIZE}%`,
            height: `${100 / GRID_SIZE}%`,
          }}
        />
        
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-red-500 mb-2">Game Over!</h2>
            <p className="text-xl mb-4">Final Score: {score}</p>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
        
        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <h2 className="text-3xl font-bold text-white">PAUSED</h2>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-slate-400 text-sm text-center">
        Use Arrow Keys or WASD to move.<br/>
        Space to pause. Swipe on touch devices.
      </div>
    </div>
  );
};

export default SnakeApp;
