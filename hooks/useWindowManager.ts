import { useState, useCallback, useRef } from 'react';
import type { AppDefinition, WindowInstance, AppID } from '../types';
import { APP_WINDOW_SIZES, DEFAULT_WINDOW_SIZE } from '../appRegistry';

export const useWindowManager = (APPS: AppDefinition[], isMobile: boolean) => {
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

    const { innerWidth, innerHeight } = window;
    const taskbarHeight = isMobile ? 56 : 48;

    let newWindow: WindowInstance;

    if (isMobile) {
      // On mobile, always open maximized
      newWindow = {
        id: `${appId}-${Date.now()}`,
        appId: appId,
        x: 0,
        y: 0,
        width: innerWidth,
        height: innerHeight - taskbarHeight,
        zIndex: nextZIndex.current++,
        isMinimized: false,
        isMaximized: true,
      };
    } else {
      // Desktop: use app-specific sizes with random offset
      const sizes = APP_WINDOW_SIZES[appId] || DEFAULT_WINDOW_SIZE;
      const maxX = Math.max(0, innerWidth - sizes.width - 50);
      const maxY = Math.max(0, innerHeight - taskbarHeight - sizes.height - 50);

      newWindow = {
        id: `${appId}-${Date.now()}`,
        appId: appId,
        x: Math.random() * Math.min(200, maxX) + 50,
        y: Math.random() * Math.min(100, maxY) + 50,
        width: Math.min(sizes.width, innerWidth - 20),
        height: Math.min(sizes.height, innerHeight - taskbarHeight - 20),
        zIndex: nextZIndex.current++,
        isMinimized: false,
        isMaximized: false,
      };
    }

    setWindows(prev => [...prev, newWindow]);
  }, [windows, APPS, isMobile]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(win => win.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      let targetWin: WindowInstance | null = null;
      let maxZ = 0;
      for (const win of prev) {
        if (win.zIndex > maxZ) maxZ = win.zIndex;
        if (win.id === id) targetWin = win;
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
