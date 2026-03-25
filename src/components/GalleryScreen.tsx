import React, { useEffect, useState, useRef } from 'react';
import { getPhotos, deletePhoto, updatePhoto, PhotoRecord } from '../lib/db';
import { Trash2, Download, Folder, Share2, X, Crop as CropIcon, RotateCw, Save, ZoomIn, ZoomOut } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export const GalleryScreen = () => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [expandedPhoto, setExpandedPhoto] = useState<PhotoRecord | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editDataUrl, setEditDataUrl] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

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
    setIsEditing(false);
    setZoom(1);
    window.history.pushState({ fullScreen: true }, '');
  };

  const closeFullScreen = () => {
    setExpandedPhoto(null);
    setIsEditing(false);
    if (window.history.state?.fullScreen) {
      window.history.back();
    }
  };

  const startEditing = () => {
    if (expandedPhoto) {
      setEditDataUrl(expandedPhoto.dataUrl);
      setIsEditing(true);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  };

  const handleRotate = () => {
    setIsProcessing(true);
    setProcessingMessage('Rotando imagen...');
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.height;
        canvas.height = img.width;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          setEditDataUrl(canvas.toDataURL('image/jpeg', 0.9));
          setCrop(undefined);
          setCompletedCrop(undefined);
        }
        setIsProcessing(false);
      };
      img.src = editDataUrl;
    }, 50);
  };

  const handleSaveEdit = async () => {
    if (!expandedPhoto || !imgRef.current) return;
    
    setIsProcessing(true);
    setProcessingMessage('Guardando edición...');
    
    try {
      let finalDataUrl = editDataUrl;
      
      if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
          );
          finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        }
      }
      
      const updatedPhoto = { ...expandedPhoto, dataUrl: finalDataUrl };
      await updatePhoto(updatedPhoto);
      setExpandedPhoto(updatedPhoto);
      setIsEditing(false);
      await loadPhotos();
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Error al guardar la edición.');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPhotos = async () => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Cargando galería...');
      const loadedPhotos = await getPhotos();
      setPhotos(loadedPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Eliminar esta foto?')) {
      setIsProcessing(true);
      setProcessingMessage('Eliminando foto...');
      try {
        await deletePhoto(id);
        if (expandedPhoto && expandedPhoto.id === id) {
          closeFullScreen();
        }
        await loadPhotos();
      } finally {
        setIsProcessing(false);
      }
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
    setIsProcessing(true);
    setProcessingMessage('Preparando para compartir...');
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
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex-grow pt-24 pb-32 px-4 md:px-8 max-w-5xl mx-auto w-full overflow-y-auto">
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

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-[80vw]">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-900 dark:text-white font-medium text-center">{processingMessage}</p>
          </div>
        </div>
      )}

      {/* Full Screen Photo Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          {isEditing ? (
            <div className="flex flex-col items-center justify-center w-full h-full p-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-[70vh]"
              >
                <img
                  ref={imgRef}
                  src={editDataUrl}
                  alt="Edit"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </ReactCrop>
              
              <div className="absolute bottom-8 flex gap-4 bg-black/80 p-4 rounded-full backdrop-blur-md">
                <button 
                  onClick={handleRotate}
                  className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
                  title="Rotar"
                >
                  <RotateCw size={24} />
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  title="Guardar Cambios"
                >
                  <Save size={24} />
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="Cancelar Edición"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-full h-full overflow-auto">
                <div 
                  className="flex items-center justify-center min-h-full min-w-full"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}
                >
                  <img 
                    src={expandedPhoto.dataUrl} 
                    alt={expandedPhoto.name} 
                    className="max-w-full max-h-full object-contain cursor-pointer"
                    onClick={closeFullScreen}
                    decoding="async"
                  />
                </div>
              </div>
              
              <button 
                onClick={closeFullScreen} 
                className="absolute top-6 right-6 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="absolute bottom-24 flex gap-4 bg-black/50 p-2 rounded-full backdrop-blur-md">
                <button 
                  onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.min(prev + 0.5, 3)); }} 
                  className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={24} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.max(prev - 0.5, 0.5)); }} 
                  className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={24} />
                </button>
              </div>

              <div className="absolute bottom-8 flex gap-6 bg-black/50 p-4 rounded-full backdrop-blur-md">
                <button 
                  onClick={(e) => { e.stopPropagation(); startEditing(); }} 
                  className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
                  title="Editar (Recortar/Rotar)"
                >
                  <CropIcon size={24} />
                </button>
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
            </>
          )}
        </div>
      )}
    </main>
  );
};

