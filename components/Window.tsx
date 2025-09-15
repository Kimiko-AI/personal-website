import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AppDefinition, WindowInstance } from '../types';
import { CloseIcon, MinimizeIcon } from '../constants';

interface WindowProps {
  instance: WindowInstance;
  app: AppDefinition;
  onClose: (id: string) => void;
  onMinimize: (id:string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, newPos: { x: number; y: number }) => void;
  onResize: (id: string, newSize: { width: number; height: number }) => void;
}

const Window: React.FC<WindowProps> = ({ instance, app, onClose, onMinimize, onFocus, onMove, onResize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    onFocus(instance.id);
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - instance.x,
      y: e.clientY - instance.y,
    };
    e.preventDefault();
  }, [instance.id, instance.x, instance.y, onFocus]);
  
  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, direction: string) => {
      e.stopPropagation();
      onFocus(instance.id);
      setIsResizing(direction);
      resizeStart.current = {
          x: e.clientX,
          y: e.clientY,
          width: instance.width,
          height: instance.height,
      };
      e.preventDefault();
  }, [instance.id, instance.width, instance.height, onFocus]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onMove(instance.id, {
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      } else if (isResizing) {
          let newWidth = resizeStart.current.width;
          let newHeight = resizeStart.current.height;
          const dx = e.clientX - resizeStart.current.x;
          const dy = e.clientY - resizeStart.current.y;

          if (isResizing.includes('right')) {
              newWidth = resizeStart.current.width + dx;
          }
          if (isResizing.includes('bottom')) {
              newHeight = resizeStart.current.height + dy;
          }
          
          const minWidth = 300;
          const minHeight = 200;

          onResize(instance.id, {
              width: Math.max(minWidth, newWidth),
              height: Math.max(minHeight, newHeight),
          });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, instance.id, onMove, onResize]);


  const transitionClasses = 'transition-all duration-200 ease-in-out';
  const visibilityClasses = instance.isMinimized ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100';

  return (
    <div
      className={`absolute flex flex-col bg-slate-700 border border-slate-500/50 rounded-lg shadow-2xl shadow-black/50 overflow-hidden ${visibilityClasses} ${isResizing ? '' : transitionClasses}`}
      style={{
        transform: `translate(${instance.x}px, ${instance.y}px)`,
        width: instance.width,
        height: instance.height,
        zIndex: instance.zIndex,
      }}
      onMouseDown={() => onFocus(instance.id)}
    >
      <header
        className="flex items-center justify-between bg-slate-800/80 backdrop-blur-sm text-white h-8 px-2 select-none cursor-grab active:cursor-grabbing flex-shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5">{app.icon}</div>
          <span className="text-sm font-semibold">{app.name}</span>
        </div>
        <div className="flex items-center space-x-1">
           <button onClick={() => onMinimize(instance.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-600 transition-colors">
             <MinimizeIcon className="w-4 h-4 text-white" />
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
      <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')} />
      <div className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')} />
      <div className="absolute top-0 right-0 h-full w-2 cursor-ew-resize z-10" onMouseDown={(e) => handleResizeMouseDown(e, 'right')} />
    </div>
  );
};

export default Window;