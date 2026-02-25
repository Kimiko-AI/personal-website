import React, { useEffect, useRef, useState } from 'react';

export interface ContextMenuAction {
  label: string;
  action: () => void;
  icon: React.ReactNode;
}

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, actions, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y, left: x });

  useEffect(() => {
    if (menuRef.current) {
        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = menuRef.current;
        const newPos = { top: y, left: x };

        if (x + offsetWidth > innerWidth) {
            newPos.left = innerWidth - offsetWidth - 5;
        }
        if (y + offsetHeight > innerHeight) {
            newPos.top = innerHeight - offsetHeight - 5;
        }
        setPosition(newPos);
    }
  }, [x, y]);

  const handleActionClick = (action: () => void) => {
    // Call action() before onClose() to ensure that security-sensitive
    // browser APIs (like getDisplayMedia) are still considered
    // user-initiated.
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute w-56 bg-slate-800/80 backdrop-blur-lg border border-slate-500/50 rounded-lg shadow-lg p-1 z-[9999]"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <ul>
        {actions.map((item) => (
          <li key={item.label}>
            <button
              onClick={() => handleActionClick(item.action)}
              className="w-full flex items-center gap-3 p-2 text-white rounded hover:bg-slate-700/70 transition-colors text-left"
            >
              <div className="w-5 h-5">{item.icon}</div>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;