import React, { useEffect, useState } from 'react';
import { getPhotos, deletePhoto, PhotoRecord } from '../lib/db';
import { Trash2, Download, Folder, Share2, X } from 'lucide-react';

export const GalleryScreen = () => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [expandedPhoto, setExpandedPhoto] = useState<PhotoRecord | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (expandedPhoto) {
        setExpandedPhoto(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [expandedPhoto]);

  const openFullScreen = (photo: PhotoRecord) => {
    setExpandedPhoto(photo);
    window.history.pushState({ fullScreen: true }, '');
  };

  const closeFullScreen = () => {
    setExpandedPhoto(null);
    if (window.history.state?.fullScreen) {
      window.history.back();
    }
  };

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

  const handleShare = async (photo: PhotoRecord) => {
    try {
      const res = await fetch(photo.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], photo.name, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: photo.name,
          text: `Documento: ${photo.name}`
        });
      } else {
        alert('Tu navegador no soporta compartir imágenes directamente a WhatsApp.');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <main className="flex-grow pt-24 pb-32 px-4 md:px-8 max-w-5xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Galería</h2>
      
      {photos.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
          <p>No hay fotos guardadas aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
              <div 
                className="aspect-[3/4] bg-gray-100 dark:bg-gray-900 relative cursor-pointer"
                onClick={() => openFullScreen(photo)}
              >
                <img 
                  src={photo.dataUrl} 
                  alt={photo.name} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShare(photo); }}
                    className="p-2 bg-green-500/90 text-white rounded-full shadow-md hover:bg-green-600 active:scale-95 transition-transform"
                    title="Compartir por WhatsApp"
                  >
                    <Share2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(photo); }}
                    className="p-2 bg-blue-600/90 text-white rounded-full shadow-md hover:bg-blue-700 active:scale-95 transition-transform"
                    title="Descargar"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); photo.id && handleDelete(photo.id); }}
                    className="p-2 bg-red-600/90 text-white rounded-full shadow-md hover:bg-red-700 active:scale-95 transition-transform"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3 flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate" title={photo.name}>{photo.name}</p>
                  {photo.folder && (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 truncate" title={photo.folder}>
                      <Folder size={10} />
                      {photo.folder}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                  {new Date(photo.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Screen Photo Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <img 
            src={expandedPhoto.dataUrl} 
            alt={expandedPhoto.name} 
            className="max-w-full max-h-full object-contain cursor-pointer"
            onClick={closeFullScreen}
            decoding="async"
          />
          
          <button 
            onClick={closeFullScreen} 
            className="absolute top-6 right-6 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="absolute bottom-8 flex gap-6 bg-black/50 p-4 rounded-full backdrop-blur-md">
            <button 
              onClick={(e) => { e.stopPropagation(); handleShare(expandedPhoto); }} 
              className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              title="Compartir por WhatsApp"
            >
              <Share2 size={24} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDownload(expandedPhoto); }} 
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              title="Descargar"
            >
              <Download size={24} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (expandedPhoto.id) {
                  handleDelete(expandedPhoto.id);
                  closeFullScreen();
                }
              }} 
              className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={24} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

