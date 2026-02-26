import React, { useState, useCallback } from 'react';
import type { AppID } from './types';
import Window from './components/Window';
import Taskbar from './components/Taskbar';
import ContextMenu, { ContextMenuAction } from './components/ContextMenu';
import { APPS } from './appRegistry';
import { ScreenshotIcon, SettingsIcon, WeatherIcon, TerminalIcon, NotesIcon, ClockIcon, ImageIcon, GamepadIcon } from './constants';
import { useWindowManager } from './hooks/useWindowManager';
import { useDesktopBackground } from './hooks/useDesktopBackground';
import { useIsMobile } from './hooks/useIsMobile';

const App: React.FC = () => {
  const isMobile = useIsMobile();
  const { backgroundStyle, backgroundClasses } = useDesktopBackground();

  const {
    windows,
    openApp,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    moveWindow,
    resizeWindow,
  } = useWindowManager(APPS, isMobile);

  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const closeMenus = useCallback(() => {
    setIsStartMenuOpen(false);
    setContextMenu(null);
  }, []);

  const handleOpenApp = useCallback((appId: AppID) => {
    openApp(appId);
    closeMenus();
  }, [openApp, closeMenus]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isMobile) return; // No context menu on mobile
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
              isMobile={isMobile}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onMaximize={maximizeWindow}
              onFocus={focusWindow}
              onMove={moveWindow}
              onResize={resizeWindow}
            />
          );
        })}
        {contextMenu && !isMobile && (
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
        isMobile={isMobile}
      />
    </div>
  );
};

export default App;