import type React from 'react';

export type AppID = 'notes' | 'clock' | 'imageConverter' | 'noSleep' | 'settings' | 'weather';

export interface AppDefinition {
  id: AppID;
  name: string;
  icon: React.ReactNode;
  component: React.FC;
}

export interface WindowInstance {
  id: string;
  appId: AppID;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
}