import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AppDefinition, WindowInstance } from '../types';
import { CloseIcon, MinimizeIcon, MaximizeIcon, RestoreIcon } from '../constants';

interface WindowProps {
  instance: WindowInstance;
  app: AppDefinition;
  onClose: (id: string) => void;
  onMinimize: (id:string) => void;
  onMaximize: (id:string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, newPos: { x: number; y: number }) => void;
  onResize: (id: string, newSize: { width: number; height: number }) => void;
}

const getClientPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if ('changedTouches' in e && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: (e as any).clientX, y: (e as any).clientY };
};

const Window: React.FC<WindowProps> = ({ instance, app, onClose, onMinimize, onMaximize, onFocus, onMove, onResize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    onFocus(instance.id);
    if (instance.isMaximized) return;
    setIsDragging(true);
    const pos = getClientPos(e);
    dragOffset.current = {
      x: pos.x - instance.x,
      y: pos.y - instance.y,
    };
    lastPosition.current = { x: instance.x, y: instance.y };
    if (e.type === 'mousedown') e.preventDefault();
  }, [instance.id, instance.x, instance.y, instance.isMaximized, onFocus]);
  
  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, direction: string) => {
      e.stopPropagation();
      onFocus(instance.id);
      if (instance.isMaximized) return;
      setIsResizing(direction);
      const pos = getClientPos(e);
      resizeStart.current = {
          x: pos.x,
          y: pos.y,
          width: instance.width,
          height: instance.height,
      };
      if (e.type === 'mousedown') e.preventDefault();
  }, [instance.id, instance.width, instance.height, onFocus, instance.isMaximized]);

  const handleDoubleClick = useCallback(() => {
    onMaximize(instance.id);
  }, [instance.id, onMaximize]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const pos = getClientPos(e);
      if (isDragging) {
        const newX = pos.x - dragOffset.current.x;
        const newY = pos.y - dragOffset.current.y;
        lastPosition.current = { x: newX, y: newY };
        
        if (windowRef.current) {
            windowRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
        }
      } else if (isResizing) {
          let newWidth = resizeStart.current.width;
          let newHeight = resizeStart.current.height;
          let newX = instance.x;
          let newY = instance.y;
          const dx = pos.x - resizeStart.current.x;
          const dy = pos.y - resizeStart.current.y;

          if (isResizing.includes('right')) {
              newWidth = resizeStart.current.width + dx;
          } else if (isResizing.includes('left')) {
              newWidth = resizeStart.current.width - dx;
              newX = instance.x + dx;
          }

          if (isResizing.includes('bottom')) {
              newHeight = resizeStart.current.height + dy;
          } else if (isResizing.includes('top')) {
              newHeight = resizeStart.current.height - dy;
              newY = instance.y + dy;
          }
          
          const minWidth = 300;
          const minHeight = 200;

          if (newWidth < minWidth) {
              if (isResizing.includes('left')) newX -= (minWidth - newWidth);
              newWidth = minWidth;
          }
          if (newHeight < minHeight) {
              if (isResizing.includes('top')) newY -= (minHeight - newHeight);
              newHeight = minHeight;
          }

          if (windowRef.current) {
              windowRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
              windowRef.current.style.width = `${newWidth}px`;
              windowRef.current.style.height = `${newHeight}px`;
          }
          lastPosition.current = { x: newX, y: newY };
      }
    };

    const handleMouseUp = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        const pos = getClientPos(e);
        const { innerWidth, innerHeight } = window;
        const availableHeight = innerHeight - 48; // Account for taskbar
        
        // Snapping logic
        if (pos.y < 10 && pos.x > 10 && pos.x < innerWidth - 10) {
            onMaximize(instance.id);
        } else if (pos.x < 10 && pos.y < 10) {
            onMove(instance.id, { x: 0, y: 0 });
            onResize(instance.id, { width: innerWidth / 2, height: availableHeight / 2 });
        } else if (pos.x < 10 && pos.y > availableHeight - 50) {
            onMove(instance.id, { x: 0, y: availableHeight / 2 });
            onResize(instance.id, { width: innerWidth / 2, height: availableHeight / 2 });
        } else if (pos.x > innerWidth - 10 && pos.y < 10) {
            onMove(instance.id, { x: innerWidth / 2, y: 0 });
            onResize(instance.id, { width: innerWidth / 2, height: availableHeight / 2 });
        } else if (pos.x > innerWidth - 10 && pos.y > availableHeight - 50) {
            onMove(instance.id, { x: innerWidth / 2, y: availableHeight / 2 });
            onResize(instance.id, { width: innerWidth / 2, height: availableHeight / 2 });
        } else if (pos.x < 10) {
            onMove(instance.id, { x: 0, y: 0 });
            onResize(instance.id, { width: innerWidth / 2, height: availableHeight });
        } else if (pos.x > innerWidth - 10) {
            onMove(instance.id, { x: innerWidth / 2, y: 0 });
            onResize(instance.id, { width: innerWidth / 2, height: availableHeight });
        } else {
            onMove(instance.id, lastPosition.current);
        }
      } else if (isResizing) {
        onMove(instance.id, lastPosition.current);
        if (windowRef.current) {
            onResize(instance.id, { 
                width: parseInt(windowRef.current.style.width || String(instance.width)), 
                height: parseInt(windowRef.current.style.height || String(instance.height)) 
            });
        }
      }
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isResizing, instance.id, instance.x, instance.y, onMove, onResize, onMaximize]);


  const transitionClasses = 'transition-all duration-200 ease-in-out';
  const visibilityClasses = instance.isMinimized ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100';

  const style: React.CSSProperties = instance.isMaximized ? {
    top: 0,
    left: 0,
    width: '100%',
    height: 'calc(100% - 48px)',
    zIndex: instance.zIndex,
  } : {
    transform: `translate(${instance.x}px, ${instance.y}px)`,
    width: instance.width,
    height: instance.height,
    zIndex: instance.zIndex,
  };

  return (
    <div
      ref={windowRef}
      className={`absolute flex flex-col bg-slate-700 border border-slate-500/50 rounded-lg shadow-2xl shadow-black/50 overflow-hidden ${visibilityClasses} ${isDragging || isResizing ? '' : transitionClasses}`}
      style={style}
      onMouseDown={() => onFocus(instance.id)}
    >
      <header
        className="flex items-center justify-between bg-slate-800/80 backdrop-blur-sm text-white h-8 px-2 select-none cursor-grab active:cursor-grabbing flex-shrink-0"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5">{app.icon}</div>
          <span className="text-sm font-semibold">{app.name}</span>
        </div>
        <div className="flex items-center space-x-1">
           <button onClick={() => onMinimize(instance.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-600 transition-colors">
             <MinimizeIcon className="w-4 h-4 text-white" />
           </button>
           <button onClick={() => onMaximize(instance.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-600 transition-colors">
             {instance.isMaximized ? <RestoreIcon className="w-4 h-4 text-white" /> : <MaximizeIcon className="w-4 h-4 text-white" />}
           </button>
          <button onClick={() => onClose(instance.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500 transition-colors">
            <CloseIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>
      <main className="flex-grow overflow-hidden">
        <app.component />
      </main>

      {/* Resize Handles */}
      {!instance.isMaximized && (
        <>
          <div className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')} onTouchStart={(e) => handleResizeMouseDown(e, 'top-left')} />
          <div className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')} onTouchStart={(e) => handleResizeMouseDown(e, 'top-right')} />
          <div className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')} onTouchStart={(e) => handleResizeMouseDown(e, 'bottom-left')} />
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')} onTouchStart={(e) => handleResizeMouseDown(e, 'bottom-right')} />
          
          <div className="absolute top-0 left-4 right-4 h-2 cursor-ns-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'top')} onTouchStart={(e) => handleResizeMouseDown(e, 'top')} />
          <div className="absolute bottom-0 left-4 right-4 h-2 cursor-ns-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')} onTouchStart={(e) => handleResizeMouseDown(e, 'bottom')} />
          <div className="absolute top-4 bottom-4 left-0 w-2 cursor-ew-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'left')} onTouchStart={(e) => handleResizeMouseDown(e, 'left')} />
          <div className="absolute top-4 bottom-4 right-0 w-2 cursor-ew-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'right')} onTouchStart={(e) => handleResizeMouseDown(e, 'right')} />
        </>
      )}
    </div>
  );
};

export default Window;