import React from 'react';
import type { AppDefinition, AppID } from '../types';

interface StartMenuProps {
  apps: AppDefinition[];
  onAppClick: (id: AppID) => void;
  isOpen: boolean;
  isMobile: boolean;
}

const StartMenu: React.FC<StartMenuProps> = ({ apps, onAppClick, isOpen, isMobile }) => {
  if (!isOpen) return null;

  if (isMobile) {
    // Full-width grid layout for mobile
    return (
      <div className="fixed inset-x-0 bottom-14 bg-slate-900/95 backdrop-blur-xl border-t border-slate-500/30 p-4 z-[9998] animate-slide-up taskbar-safe">
        <h2 className="text-white text-lg font-bold mb-3 px-1">Apps</h2>
        <div className="grid grid-cols-4 gap-3">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => onAppClick(app.id)}
              className="flex flex-col items-center gap-1.5 p-3 text-white rounded-xl hover:bg-slate-700/70 active:bg-slate-600/70 transition-colors"
            >
              <div className="w-10 h-10">{app.icon}</div>
              <span className="text-xs text-center leading-tight">{app.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop: compact list
  return (
    <div className="absolute bottom-full mb-2 w-64 bg-slate-800/80 backdrop-blur-lg border border-slate-500/50 rounded-lg shadow-lg p-2 animate-slide-up">
      <ul>
        {apps.map((app) => (
          <li key={app.id}>
            <button
              onClick={() => onAppClick(app.id)}
              className="w-full flex items-center gap-3 p-2 text-white rounded hover:bg-slate-700/70 transition-colors text-left"
            >
              <div className="w-6 h-6">{app.icon}</div>
              <span>{app.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StartMenu;
