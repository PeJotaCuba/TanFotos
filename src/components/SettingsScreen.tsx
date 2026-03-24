import React, { useState, useEffect } from 'react';
import { Folder, Save, AlertCircle } from 'lucide-react';
import { saveDirectoryHandle, getDirectoryHandle } from '../lib/db';

export const SettingsScreen = () => {
  const [folderPath, setFolderPath] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      setIsSupported(false);
    }

    const loadSettings = async () => {
      const savedPath = localStorage.getItem('tanFotos_folderPath') || 'Descargas (por defecto)';
      setFolderPath(savedPath);
      
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

  return (
    <main className="flex-grow pt-24 pb-32 px-4 md:px-8 max-w-5xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8">Ajustes</h2>
      
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Carpeta de almacenamiento local
        </label>
        <div className="flex gap-4">
          <div className="relative flex-grow">
            <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={folderPath}
              readOnly
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-gray-600 focus:outline-none"
              placeholder="Descargas (por defecto)"
            />
          </div>
          <button 
            onClick={handleSelectFolder}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            <Folder size={20} />
            Seleccionar
          </button>
        </div>
        
        {!isSupported && (
          <p className="mt-4 text-sm text-amber-600 flex items-center gap-2">
            <AlertCircle size={16} />
            Tu navegador no soporta elegir una carpeta específica. Las fotos irán a Descargas.
          </p>
        )}
        
        {isSupported && (
          <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
            <AlertCircle size={16} />
            Esta carpeta se utilizará para guardar las imágenes capturadas localmente.
          </p>
        )}
      </div>
    </main>
  );
};
