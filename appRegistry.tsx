import React from 'react';
import type { AppDefinition } from './types';
import NotesApp from './apps/NotesApp';
import ClockApp from './apps/ClockApp';
import ImageConverterApp from './apps/ImageConverterApp';
import SettingsApp from './apps/SettingsApp';
import WeatherApp from './apps/WeatherApp';
import TerminalApp from './apps/TerminalApp';
import FlappyBirdApp from './apps/games/FlappyBirdApp';
import SnakeApp from './apps/games/SnakeApp';
import QRCodeApp from './apps/QRCodeApp';
import {
    NotesIcon,
    ClockIcon,
    ImageIcon,
    SettingsIcon,
    WeatherIcon,
    TerminalIcon,
    GamepadIcon,
    QRCodeIcon,
} from './constants';

export const APPS: AppDefinition[] = [
    { id: 'notes', name: 'Notes', icon: <NotesIcon className="text-yellow-300" />, component: NotesApp },
    { id: 'clock', name: 'Clock', icon: <ClockIcon className="text-sky-300" />, component: ClockApp },
    { id: 'imageConverter', name: 'Image Converter', icon: <ImageIcon className="text-purple-400" />, component: ImageConverterApp },
    { id: 'weather', name: 'Weather', icon: <WeatherIcon className="text-blue-300" />, component: WeatherApp },
    { id: 'terminal', name: 'Terminal', icon: <TerminalIcon className="text-green-400" />, component: TerminalApp },
    { id: 'settings', name: 'Settings', icon: <SettingsIcon className="text-slate-400" />, component: SettingsApp },
    { id: 'qrcode', name: 'QR Generator', icon: <QRCodeIcon className="text-indigo-400" />, component: QRCodeApp },
    { id: 'flappybird', name: 'Flappy Bird', icon: <GamepadIcon className="text-yellow-400" />, component: FlappyBirdApp },
    { id: 'snake', name: 'Snake', icon: <GamepadIcon className="text-green-500" />, component: SnakeApp },
];

/** Per-app default window sizes for desktop */
export const APP_WINDOW_SIZES: Partial<Record<string, { width: number; height: number }>> = {
    imageConverter: { width: 640, height: 500 },
    terminal: { width: 900, height: 600 },
    snake: { width: 520, height: 640 },
    flappybird: { width: 450, height: 700 },
    qrcode: { width: 700, height: 550 },
};

export const DEFAULT_WINDOW_SIZE = { width: 500, height: 400 };
