import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { AppDefinition, WindowInstance, AppID } from './types';
import Window from './components/Window';
import Taskbar from './components/Taskbar';
import ContextMenu, { ContextMenuAction } from './components/ContextMenu';
import NotesApp from './apps/NotesApp';
import ClockApp from './apps/ClockApp';
import ImageConverterApp from './apps/ImageConverterApp';
import SettingsApp from './apps/SettingsApp';
import WeatherApp from './apps/WeatherApp';
import { NotesIcon, ClockIcon, ScreenshotIcon, ImageIcon, SettingsIcon, WeatherIcon } from './constants';

const APPS: AppDefinition[] = [
  { id: 'notes', name: 'Notes', icon: <NotesIcon className="text-yellow-300" />, component: NotesApp },
  { id: 'clock', name: 'Clock', icon: <ClockIcon className="text-sky-300" />, component: ClockApp },
  { id: 'imageConverter', name: 'Image Converter', icon: <ImageIcon className="text-purple-400" />, component: ImageConverterApp },
  { id: 'weather', name: 'Weather', icon: <WeatherIcon className="text-blue-300" />, component: WeatherApp },
  { id: 'settings', name: 'Settings', icon: <SettingsIcon className="text-slate-400" />, component: SettingsApp },
];

const DEFAULT_BACKGROUND_CLASSES = 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900';
const BACKGROUND_STORAGE_KEY = 'web-desktop-background';

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});
  const [backgroundClasses, setBackgroundClasses] = useState(DEFAULT_BACKGROUND_CLASSES);
  const nextZIndex = useRef(10);
  
  useEffect(() => {
    const updateBackground = () => {
        const storedBackground = localStorage.getItem(BACKGROUND_STORAGE_KEY);
        if (storedBackground) {
            setBackgroundStyle({
                backgroundImage: storedBackground,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            });
            setBackgroundClasses('');
        } else {
            setBackgroundStyle({});
            setBackgroundClasses(DEFAULT_BACKGROUND_CLASSES);
        }
    };

    updateBackground();

    window.addEventListener('storage', updateBackground);
    return () => {
        window.removeEventListener('storage', updateBackground);
    };
  }, []);

  const closeMenus = useCallback(() => {
    setIsStartMenuOpen(false);
    setContextMenu(null);
  }, []);

  const openApp = useCallback((appId: AppID) => {
    const existingWindow = windows.find(win => win.appId === appId && win.isMinimized);
    if (existingWindow) {
      focusWindow(existingWindow.id);
      return;
    }

    const appDef = APPS.find(app => app.id === appId);
    if (!appDef) return;

    const newWindow: WindowInstance = {
      id: `${appId}-${Date.now()}`,
      appId: appId,
      x: Math.random() * 200 + 50,
      y: Math.random() * 100 + 50,
      width: appDef.id === 'imageConverter' ? 640 : 500,
      height: appDef.id === 'imageConverter' ? 500 : 400,
      zIndex: nextZIndex.current++,
      isMinimized: false,
    };
    setWindows(prev => [...prev, newWindow]);
    closeMenus();
  }, [windows, closeMenus]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(win => win.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => 
      prev.map(win => {
        if (win.id === id) {
          const newZIndex = win.zIndex < nextZIndex.current - 1 ? nextZIndex.current++ : win.zIndex;
          return { ...win, zIndex: newZIndex, isMinimized: false };
        }
        return win;
      })
    );
  }, []);
  
  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => 
      prev.map(win => win.id === id ? { ...win, isMinimized: true } : win)
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    closeMenus();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const takeScreenshot = async () => {
    try {
        // Fix: Cast video constraints to 'any' to allow the 'cursor' property,
        // which is valid for getDisplayMedia but may not be in the default TS types.
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as any, audio: false });
        const video = document.createElement('video');
        
        video.onloadedmetadata = () => {
            video.play();
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            
            setTimeout(() => {
              context?.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/png');
              const a = document.createElement('a');
              a.href = dataUrl;
              a.download = `screenshot-${new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.png`;
              a.click();
              stream.getTracks().forEach(track => track.stop());
            }, 100);
        };
        video.srcObject = stream;
    } catch (err) {
        console.error("Screenshot failed:", err);
    }
  };

  const contextMenuActions: ContextMenuAction[] = [
    { label: 'Settings', action: () => openApp('settings'), icon: <SettingsIcon className="text-slate-400" /> },
    { label: 'Take Screenshot', action: takeScreenshot, icon: <ScreenshotIcon className="text-green-400" /> },
    { label: 'Open Weather', action: () => openApp('weather'), icon: <WeatherIcon className="text-blue-300" /> },
    { label: 'Open Notes', action: () => openApp('notes'), icon: <NotesIcon className="text-yellow-300" /> },
    { label: 'Open Clock', action: () => openApp('clock'), icon: <ClockIcon className="text-sky-300" /> },
    { label: 'Image Converter', action: () => openApp('imageConverter'), icon: <ImageIcon className="text-purple-400" /> },
  ];

  return (
    <div className={`h-screen w-screen overflow-hidden font-sans select-none ${backgroundClasses}`} style={backgroundStyle}>
      <main className="w-full h-full" onClick={closeMenus} onContextMenu={handleContextMenu}>
        {windows.map(win => {
          const app = APPS.find(a => a.id === win.appId);
          if (!app) return null;
          return (
            <Window
              key={win.id}
              instance={win}
              app={app}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onFocus={focusWindow}
              onMove={moveWindow}
              onResize={resizeWindow}
            />
          );
        })}
        {contextMenu && (
          <ContextMenu 
            x={contextMenu.x}
            y={contextMenu.y}
            actions={contextMenuActions}
            onClose={closeMenus}
          />
        )}
      </main>
      <Taskbar
        apps={APPS}
        openWindows={windows}
        onAppLaunch={openApp}
        onWindowFocus={focusWindow}
        isStartMenuOpen={isStartMenuOpen}
        onStartMenuToggle={() => setIsStartMenuOpen(prev => !prev)}
      />
    </div>
  );
};

export default App;