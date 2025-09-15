
import React, { useState, useEffect } from 'react';
// FIX: Import AppID to correctly type component props and local functions.
import type { AppDefinition, WindowInstance, AppID } from '../types';
import { StartMenuIcon } from '../constants';
import StartMenu from './StartMenu';

interface TaskbarProps {
    apps: AppDefinition[];
    openWindows: WindowInstance[];
    // FIX: Update onAppLaunch to accept any AppID, not just a subset.
    onAppLaunch: (id: AppID) => void;
    onWindowFocus: (id: string) => void;
    isStartMenuOpen: boolean;
    onStartMenuToggle: () => void;
}

const Taskbar: React.FC<TaskbarProps> = ({ apps, openWindows, onAppLaunch, onWindowFocus, isStartMenuOpen, onStartMenuToggle }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // FIX: Update getAppById to accept any AppID to handle all possible open windows.
    const getAppById = (id: AppID) => apps.find(app => app.id === id);

    return (
        <footer className="fixed bottom-0 left-0 right-0 h-12 bg-slate-900/80 backdrop-blur-lg border-t border-slate-500/30 flex items-center justify-between px-2 z-50">
            <div className="relative">
                <button
                    onClick={onStartMenuToggle}
                    className={`p-2 rounded transition-colors ${isStartMenuOpen ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
                >
                    <StartMenuIcon className="w-6 h-6 text-white" />
                </button>
                <StartMenu apps={apps} onAppClick={onAppLaunch} isOpen={isStartMenuOpen} />
            </div>

            <div className="flex items-center gap-2">
                {openWindows.map(win => {
                    const app = getAppById(win.appId);
                    if (!app) return null;
                    return (
                        <button
                            key={win.id}
                            onClick={() => onWindowFocus(win.id)}
                            className="h-9 px-3 flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors"
                            title={app.name}
                        >
                            <div className="w-5 h-5 text-white">{app.icon}</div>
                        </button>
                    )
                })}
            </div>

            <div className="text-white text-sm px-2 font-mono">
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </footer>
    );
};

export default Taskbar;
