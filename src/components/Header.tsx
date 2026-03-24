import React from 'react';
import { Clipboard, Zap, HelpCircle } from 'lucide-react';

export const Header = () => (
  <header className="flex items-center justify-between px-6 h-16 w-full bg-slate-50 dark:bg-slate-900 fixed top-0 z-50 border-b border-slate-200 dark:border-slate-800">
    <div className="flex items-center gap-3">
      <div className="text-blue-600 dark:text-blue-400">
        <Clipboard size={24} />
      </div>
      <h1 className="font-manrope font-black text-blue-700 dark:text-blue-400 tracking-tighter text-lg">TanFotos</h1>
    </div>
    <div className="flex items-center gap-4">
      <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-opacity duration-200 ease-in-out">
        <Zap className="text-slate-500" size={20} />
      </button>
      <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-opacity duration-200 ease-in-out">
        <HelpCircle className="text-slate-500" size={20} />
      </button>
    </div>
  </header>
);
