
import React from 'react';
import type { AppDefinition, AppID } from '../types';

interface StartMenuProps {
  apps: AppDefinition[];
  onAppClick: (id: AppID) => void;
  isOpen: boolean;
}

const StartMenu: React.FC<StartMenuProps> = ({ apps, onAppClick, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full mb-2 w-64 bg-slate-800/80 backdrop-blur-lg border border-slate-500/50 rounded-lg shadow-lg p-2">
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
