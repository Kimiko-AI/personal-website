import React, { useState, useEffect } from 'react';

const DEFAULT_BACKGROUND_CLASSES = 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900';
const BACKGROUND_STORAGE_KEY = 'web-desktop-background';

export const useDesktopBackground = () => {
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

  return { backgroundStyle, backgroundClasses };
};
