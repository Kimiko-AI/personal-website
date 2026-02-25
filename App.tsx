import React, { useState, useCallback, useEffect } from 'react';
import type { AppDefinition, AppID } from './types';
import Window from './components/Window';
import Taskbar from './components/Taskbar';
import ContextMenu, { ContextMenuAction } from './components/ContextMenu';
import NotesApp from './apps/NotesApp';
import ClockApp from './apps/ClockApp';
import ImageConverterApp from './apps/ImageConverterApp';
import SettingsApp from './apps/SettingsApp';
import WeatherApp from './apps/WeatherApp';
import TerminalApp from './apps/TerminalApp';
import TicTacToeApp from './apps/games/TicTacToeApp';
import SnakeApp from './apps/games/SnakeApp';
import { NotesIcon, ClockIcon, ScreenshotIcon, ImageIcon, SettingsIcon, WeatherIcon, TerminalIcon, GamepadIcon } from './constants';
import { useWindowManager } from './hooks/useWindowManager';

const APPS: AppDefinition[] = [
  { id: 'notes', name: 'Notes', icon: <NotesIcon className="text-yellow-300" />, component: NotesApp },
  { id: 'clock', name: 'Clock', icon: <ClockIcon className="text-sky-300" />, component: ClockApp },
  { id: 'imageConverter', name: 'Image Converter', icon: <ImageIcon className="text-purple-400" />, component: ImageConverterApp },
  { id: 'weather', name: 'Weather', icon: <WeatherIcon className="text-blue-300" />, component: WeatherApp },
  { id: 'terminal', name: 'Terminal', icon: <TerminalIcon className="text-green-400" />, component: TerminalApp },
  { id: 'settings', name: 'Settings', icon: <SettingsIcon className="text-slate-400" />, component: SettingsApp },
  { id: 'tictactoe', name: 'Tic Tac Toe', icon: <GamepadIcon className="text-pink-400" />, component: TicTacToeApp },
  { id: 'snake', name: 'Snake', icon: <GamepadIcon className="text-green-500" />, component: SnakeApp },
];

const DEFAULT_BACKGROUND_CLASSES = 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900';
const BACKGROUND_STORAGE_KEY = 'web-desktop-background';

const App: React.FC = () => {
  const {
    windows,
    openApp,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    moveWindow,
    resizeWindow,
  } = useWindowManager(APPS);

  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});
  const [backgroundClasses, setBackgroundClasses] = useState(DEFAULT_BACKGROUND_CLASSES);
  
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

  const handleOpenApp = useCallback((appId: AppID) => {
    openApp(appId);
    closeMenus();
  }, [openApp, closeMenus]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    closeMenus();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const takeScreenshot = async () => {
    try {
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
    { label: 'Settings', action: () => handleOpenApp('settings'), icon: <SettingsIcon className="text-slate-400" /> },
    { label: 'Take Screenshot', action: takeScreenshot, icon: <ScreenshotIcon className="text-green-400" /> },
    { label: 'Open Weather', action: () => handleOpenApp('weather'), icon: <WeatherIcon className="text-blue-300" /> },
    { label: 'Open Terminal', action: () => handleOpenApp('terminal'), icon: <TerminalIcon className="text-green-400" /> },
    { label: 'Open Notes', action: () => handleOpenApp('notes'), icon: <NotesIcon className="text-yellow-300" /> },
    { label: 'Open Clock', action: () => handleOpenApp('clock'), icon: <ClockIcon className="text-sky-300" /> },
    { label: 'Image Converter', action: () => handleOpenApp('imageConverter'), icon: <ImageIcon className="text-purple-400" /> },
    { label: 'Tic Tac Toe', action: () => handleOpenApp('tictactoe'), icon: <GamepadIcon className="text-pink-400" /> },
    { label: 'Snake', action: () => handleOpenApp('snake'), icon: <GamepadIcon className="text-green-500" /> },
  ];

  return (
    <div className={`h-screen w-screen overflow-hidden font-sans select-none relative ${backgroundClasses}`} style={backgroundStyle}>
      <main className="w-full h-full relative" onClick={closeMenus} onContextMenu={handleContextMenu}>
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
              onMaximize={maximizeWindow}
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
        onAppLaunch={handleOpenApp}
        onWindowFocus={focusWindow}
        isStartMenuOpen={isStartMenuOpen}
        onStartMenuToggle={() => setIsStartMenuOpen(prev => !prev)}
      />
    </div>
  );
};

export default App;