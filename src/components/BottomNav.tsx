import React from 'react';
import { Camera, LayoutGrid, Settings } from 'lucide-react';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { id: 'capture', label: 'CAPTURA', icon: Camera },
    { id: 'gallery', label: 'GALERÍA', icon: LayoutGrid },
    { id: 'settings', label: 'AJUSTES', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-slate-50/90 backdrop-blur-md dark:bg-slate-900/90 z-50 border-t border-slate-200 dark:border-slate-800">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-transform duration-150 active:scale-95 ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="font-inter text-[11px] font-medium uppercase tracking-wider mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
