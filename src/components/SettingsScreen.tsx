import React, { useState, useEffect } from 'react';
import { Folder, Save, AlertCircle } from 'lucide-react';

export const SettingsScreen = () => {
  const [folderPath, setFolderPath] = useState('');

  useEffect(() => {
    const savedPath = localStorage.getItem('tanFotos_folderPath') || '/Documentos/TanFotos';
    setFolderPath(savedPath);
  }, []);

  const handleSave = () => {
    localStorage.setItem('tanFotos_folderPath', folderPath);
    alert('Carpeta de almacenamiento actualizada.');
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
              onChange={(e) => setFolderPath(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="/Documentos/TanFotos"
            />
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Save size={20} />
            Guardar
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
          <AlertCircle size={16} />
          Esta carpeta se utilizará para guardar las imágenes capturadas localmente.
        </p>
      </div>
    </main>
  );
};
