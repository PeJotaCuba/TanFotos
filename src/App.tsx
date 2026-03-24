/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CaptureScreen } from './components/CaptureScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { GalleryScreen } from './components/GalleryScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('capture');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      {currentScreen === 'capture' && <CaptureScreen />}
      {currentScreen === 'gallery' && <GalleryScreen />}
      {currentScreen === 'settings' && <SettingsScreen />}
      <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
    </div>
  );
}
