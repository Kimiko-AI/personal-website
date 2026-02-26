import React, { useState, useEffect } from 'react';
import type { AppDefinition, WindowInstance, AppID } from '../types';
import { StartMenuIcon } from '../constants';
import StartMenu from './StartMenu';

interface TaskbarProps {
    apps: AppDefinition[];
    openWindows: WindowInstance[];
    onAppLaunch: (id: AppID) => void;
    onWindowFocus: (id: string) => void;
    isStartMenuOpen: boolean;
    onStartMenuToggle: () => void;
    isMobile: boolean;
}

const Taskbar: React.FC<TaskbarProps> = ({ apps, openWindows, onAppLaunch, onWindowFocus, isStartMenuOpen, onStartMenuToggle, isMobile }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getAppById = (id: AppID) => apps.find(app => app.id === id);

    const height = isMobile ? 'h-14' : 'h-12';
    const btnPadding = isMobile ? 'p-3' : 'p-2';
    const iconSize = isMobile ? 'w-7 h-7' : 'w-6 h-6';
    const windowBtnHeight = isMobile ? 'h-11' : 'h-9';
    const windowBtnPadding = isMobile ? 'px-4' : 'px-3';
    const windowIconSize = isMobile ? 'w-6 h-6' : 'w-5 h-5';

    return (
        <footer className={`fixed bottom-0 left-0 right-0 ${height} bg-slate-900/80 backdrop-blur-lg border-t border-slate-500/30 flex items-center justify-between px-2 z-50 taskbar-safe`}>
            <div className="relative">
                <button
                    onClick={onStartMenuToggle}
                    className={`${btnPadding} rounded transition-colors ${isStartMenuOpen ? 'bg-slate-700' : 'hover:bg-slate-700/50 active:bg-slate-700'}`}
                >
                    <StartMenuIcon className={`${iconSize} text-white`} />
                </button>
                <StartMenu apps={apps} onAppClick={onAppLaunch} isOpen={isStartMenuOpen} isMobile={isMobile} />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto flex-1 mx-2 no-scrollbar">
                {openWindows.map(win => {
                    const app = getAppById(win.appId);
                    if (!app) return null;
                    return (
                        <button
                            key={win.id}
                            onClick={() => onWindowFocus(win.id)}
                            className={`${windowBtnHeight} ${windowBtnPadding} flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 active:bg-slate-600 rounded-md transition-colors flex-shrink-0`}
                            title={app.name}
                        >
                            <div className={`${windowIconSize} text-white`}>{app.icon}</div>
                            {!isMobile && (
                                <span className="text-white text-xs max-w-20 truncate hidden sm:inline">{app.name}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className={`text-white ${isMobile ? 'text-xs' : 'text-sm'} px-2 font-mono flex-shrink-0`}>
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </footer>
    );
};

export default Taskbar;
