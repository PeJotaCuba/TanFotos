import React, { useState, useEffect } from 'react';
import { Folder, Save, AlertCircle, Split } from 'lucide-react';
import { saveDirectoryHandle, getDirectoryHandle } from '../lib/db';

export const SettingsScreen = () => {
  const [folderPath, setFolderPath] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [dualMode, setDualMode] = useState(false);

  useEffect(() => {
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      setIsSupported(false);
    }

    const loadSettings = async () => {
      const savedPath = localStorage.getItem('tanFotos_folderPath') || 'Descargas (por defecto)';
      setFolderPath(savedPath);
      
      const savedDualMode = localStorage.getItem('tanFotos_dualMode') === 'true';
      setDualMode(savedDualMode);
      
      try {
        const handle = await getDirectoryHandle();
        if (handle && handle.name) {
          setFolderPath(handle.name);
        }
      } catch (e) {
        console.error("Error loading directory handle", e);
      }
    };
    
    loadSettings();
  }, []);

  const handleSelectFolder = async () => {
    if (!isSupported) {
      alert('Tu navegador no soporta la selección de carpetas nativa. Las fotos se guardarán en tu carpeta de Descargas por defecto.');
      return;
    }

    try {
      // @ts-ignore
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      
      await saveDirectoryHandle(directoryHandle);
      setFolderPath(directoryHandle.name);
      localStorage.setItem('tanFotos_folderPath', directoryHandle.name);
      
      alert(`Carpeta "${directoryHandle.name}" seleccionada correctamente.`);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error selecting folder:', error);
        alert('Hubo un error al seleccionar la carpeta.');
      }
    }
  };

  const handleToggleDualMode = () => {
    const newDualMode = !dualMode;
    setDualMode(newDualMode);
    localStorage.setItem('tanFotos_dualMode', String(newDualMode));
  };

  return (
    <main className="flex-grow pt-24 pb-32 px-4 md:px-8 max-w-5xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Ajustes</h2>
      
      <div className="space-y-6">
        {/* Folder Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Carpeta de almacenamiento local
          </label>
          <div className="flex gap-4">
            <div className="relative flex-grow">
              <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={folderPath}
                readOnly
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                placeholder="Descargas (por defecto)"
              />
            </div>
            <button 
              onClick={handleSelectFolder}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap transition-colors"
            >
              <Folder size={20} />
              Seleccionar
            </button>
          </div>
          
          {!isSupported && (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2">
              <AlertCircle size={16} />
              Tu navegador no soporta elegir una carpeta específica. Las fotos irán a Descargas.
            </p>
          )}
          
          {isSupported && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <AlertCircle size={16} />
              Esta carpeta se utilizará para guardar las imágenes capturadas localmente.
            </p>
          )}
        </div>

        {/* Dual Mode Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Split size={20} className="text-blue-600 dark:text-blue-400" />
              Modo Dual
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Toma dos fotos (frente y reverso) y únelas en una sola imagen.
            </p>
          </div>
          
          <button
            onClick={handleToggleDualMode}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              dualMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                dualMode ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </main>
  );
};
