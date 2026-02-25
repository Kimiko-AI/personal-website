import { useState, useCallback, useRef } from 'react';
import type { AppDefinition, WindowInstance, AppID } from '../types';

export const useWindowManager = (APPS: AppDefinition[]) => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const nextZIndex = useRef(10);

  const openApp = useCallback((appId: AppID) => {
    const existingWindow = windows.find(win => win.appId === appId && win.isMinimized);
    if (existingWindow) {
      focusWindow(existingWindow.id);
      return;
    }

    const appDef = APPS.find(app => app.id === appId);
    if (!appDef) return;

    const getWidth = () => {
        switch(appId) {
            case 'imageConverter': return 640;
            case 'terminal': return 900;
            case 'snake': return 500;
            case 'tictactoe': return 400;
            default: return 500;
        }
    }

    const getHeight = () => {
        switch(appId) {
            case 'imageConverter': return 500;
            case 'terminal': return 600;
            case 'snake': return 600;
            case 'tictactoe': return 500;
            default: return 400;
        }
    }

    const newWindow: WindowInstance = {
      id: `${appId}-${Date.now()}`,
      appId: appId,
      x: Math.random() * 200 + 50,
      y: Math.random() * 100 + 50,
      width: getWidth(),
      height: getHeight(),
      zIndex: nextZIndex.current++,
      isMinimized: false,
      isMaximized: false,
    };
    setWindows(prev => [...prev, newWindow]);
  }, [windows, APPS]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(win => win.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      let targetWin: WindowInstance | null = null;
      let maxZ = 0;
      for (const win of prev) {
        if (win.zIndex > maxZ) {
          maxZ = win.zIndex;
        }
        if (win.id === id) {
          targetWin = win;
        }
      }

      if (targetWin && targetWin.zIndex === maxZ && !targetWin.isMinimized) {
        return prev;
      }

      return prev.map(win => {
        if (win.id === id) {
          return { ...win, zIndex: nextZIndex.current++, isMinimized: false };
        }
        return win;
      });
    });
  }, []);
  
  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => 
      prev.map(win => win.id === id ? { ...win, isMinimized: true } : win)
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => 
      prev.map(win => win.id === id ? { ...win, isMaximized: !win.isMaximized, isMinimized: false } : win)
    );
  }, []);

  const moveWindow = useCallback((id: string, newPos: { x: number; y: number }) => {
    setWindows(prev =>
      prev.map(win => (win.id === id ? { ...win, x: newPos.x, y: newPos.y } : win))
    );
  }, []);
  
  const resizeWindow = useCallback((id: string, newSize: { width: number; height: number }) => {
    setWindows(prev =>
        prev.map(win => (win.id === id ? { ...win, width: newSize.width, height: newSize.height } : win))
    );
  }, []);

  return {
    windows,
    openApp,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    moveWindow,
    resizeWindow,
  };
};
