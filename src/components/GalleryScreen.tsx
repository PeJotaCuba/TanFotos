import React, { useEffect, useState } from 'react';
import { getPhotos, deletePhoto, PhotoRecord } from '../lib/db';
import { Trash2, Download, Folder } from 'lucide-react';

export const GalleryScreen = () => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const loadedPhotos = await getPhotos();
      setPhotos(loadedPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Eliminar esta foto?')) {
      await deletePhoto(id);
      await loadPhotos();
    }
  };

  const handleDownload = (photo: PhotoRecord) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex-grow pt-24 pb-32 px-4 md:px-8 max-w-5xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8">Galería</h2>
      
      {photos.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <p>No hay fotos guardadas aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
              <div className="aspect-[3/4] bg-gray-100 relative">
                <img 
                  src={photo.dataUrl} 
                  alt={photo.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <button 
                    onClick={() => handleDownload(photo)}
                    className="p-2 bg-blue-600/90 text-white rounded-full shadow-md hover:bg-blue-700 active:scale-95 transition-transform"
                    title="Descargar"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => photo.id && handleDelete(photo.id)}
                    className="p-2 bg-red-600/90 text-white rounded-full shadow-md hover:bg-red-700 active:scale-95 transition-transform"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3 flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-800 truncate" title={photo.name}>{photo.name}</p>
                  {photo.folder && (
                    <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 truncate" title={photo.folder}>
                      <Folder size={10} />
                      {photo.folder}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  {new Date(photo.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

