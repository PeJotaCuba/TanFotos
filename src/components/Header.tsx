import React, { useState } from 'react';
import { Clipboard, Moon, Sun, HelpCircle, Menu, X, Camera, Image, Settings } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onShowHelp: () => void;
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, onShowHelp, currentScreen, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'capture', label: 'Captura', icon: Camera },
    { id: 'gallery', label: 'Galería', icon: Image },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <header className="flex items-center justify-between px-6 h-16 w-full bg-slate-50 dark:bg-slate-900 fixed top-0 z-50 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 -ml-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="text-blue-600 dark:text-blue-400">
          <Clipboard size={24} />
        </div>
        <h1 className="font-manrope font-black text-blue-700 dark:text-blue-400 tracking-tighter text-lg">TanFotos</h1>
      </div>
      
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-lg ${currentScreen === item.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleDarkMode}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors duration-200 ease-in-out"
          title="Alternar Modo Oscuro"
        >
          {isDarkMode ? (
            <Sun className="text-amber-400" size={20} />
          ) : (
            <Moon className="text-slate-500" size={20} />
          )}
        </button>
        <button 
          onClick={onShowHelp}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors duration-200 ease-in-out"
          title="Ayuda"
        >
          <HelpCircle className="text-slate-500 dark:text-slate-400" size={20} />
        </button>
      </div>
    </header>
  );
};
