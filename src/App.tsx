/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CaptureScreen } from './components/CaptureScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { GalleryScreen } from './components/GalleryScreen';
import { HelpModal } from './components/HelpModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('capture');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    // Load dark mode preference
    const savedMode = localStorage.getItem('tanFotos_darkMode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('tanFotos_darkMode', String(newMode));
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        onShowHelp={() => setShowHelp(true)} 
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
      {currentScreen === 'capture' && <CaptureScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'gallery' && <GalleryScreen />}
      {currentScreen === 'settings' && <SettingsScreen />}
      
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
