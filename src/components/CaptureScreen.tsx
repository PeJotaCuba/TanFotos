import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, Save, X, Share2, Split, Smartphone } from 'lucide-react';
import { savePhoto, getDirectoryHandle } from '../lib/db';

interface CaptureScreenProps {
  onNavigate?: (screen: string) => void;
}

export const CaptureScreen: React.FC<CaptureScreenProps> = ({ onNavigate }) => {
  const [firstPhoto, setFirstPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Read dual mode from settings
  const dualMode = localStorage.getItem('tanFotos_dualMode') === 'true';

  // Modal state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('Paciente ');
  const [photoDate, setPhotoDate] = useState('');

  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
      try {
        // Ensure any previous stream is stopped before requesting a new one
        if (videoRef.current && videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject as MediaStream;
          oldStream.getTracks().forEach(track => track.stop());
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode,
            width: { ideal: 1920 }, // 1080p is plenty for mobile and much faster than 4K
            height: { ideal: 1080 }
          }
        });
        
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
        } else if (stream) {
          // If component unmounted while waiting for camera
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const openSaveModal = (dataUrl: string, type: string) => {
    setPreviewPhoto(dataUrl);
    setPhotoName('Paciente ');
    
    // Set current date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setPhotoDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas dimensions to match video exactly (full frame)
    const isStreamPortrait = video.videoHeight > video.videoWidth;
    
    if (isLandscape && isStreamPortrait) {
      // Force landscape output from a portrait stream
      canvas.width = video.videoHeight;
      canvas.height = video.videoWidth;
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((90 * Math.PI) / 180);
      context.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2, video.videoWidth, video.videoHeight);
      // Reset transform for future operations
      context.setTransform(1, 0, 0, 1, 0, 0);
    } else if (!isLandscape && !isStreamPortrait) {
      // Force portrait output from a landscape stream
      canvas.width = video.videoHeight;
      canvas.height = video.videoWidth;
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((-90 * Math.PI) / 180);
      context.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2, video.videoWidth, video.videoHeight);
      context.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      // Stream matches desired orientation
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // Good quality, much faster

    if (dualMode) {
      if (!firstPhoto) {
        // First photo of dual mode
        setFirstPhoto(dataUrl);
        alert('Primera foto tomada. Por favor, tome la segunda foto (reverso).');
      } else {
        setIsProcessing(true);
        setProcessingMessage('Procesando imagen dual...');
        
        // Use setTimeout to allow UI to update and show loading spinner
        setTimeout(async () => {
          try {
            // Second photo of dual mode - combine them
            const img1 = new Image();
            const img2 = new Image();
            
            img1.src = firstPhoto;
            img2.src = dataUrl;

            await Promise.all([
              new Promise(resolve => img1.onload = resolve),
              new Promise(resolve => img2.onload = resolve)
            ]);

            // Combine top and bottom
            canvas.width = Math.max(img1.width, img2.width);
            canvas.height = img1.height + img2.height;
            
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.drawImage(img1, 0, 0);
            context.drawImage(img2, 0, img1.height);
            
            const combinedDataUrl = canvas.toDataURL('image/jpeg', 0.85); // Good quality, much faster
            openSaveModal(combinedDataUrl, 'dual');
            setFirstPhoto(null);
          } finally {
            setIsProcessing(false);
          }
        }, 50);
      }
    } else {
      // Single mode
      openSaveModal(dataUrl, 'single');
    }
  };

  const confirmSave = async () => {
    if (!previewPhoto) return;

    setIsProcessing(true);
    setProcessingMessage('Guardando foto...');

    try {
      const baseName = photoName.trim();
      const dateSuffix = photoDate ? `_${photoDate}` : '';
      const finalName = `${baseName}${dateSuffix}.jpg`;
      const folderName = localStorage.getItem('tanFotos_folderPath') || 'Descargas';
      
      // Save to IndexedDB for Gallery
      await savePhoto({
        dataUrl: previewPhoto,
        timestamp: Date.now(),
        name: finalName,
        folder: folderName
      });

      let savedToDir = false;
      try {
        const dirHandle = await getDirectoryHandle();
        if (dirHandle) {
          // Request permission if needed
          if ((await dirHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
            if ((await dirHandle.requestPermission({ mode: 'readwrite' })) !== 'granted') {
              throw new Error('Permission not granted');
            }
          }
          
          const fileHandle = await dirHandle.getFileHandle(finalName, { create: true });
          const writable = await fileHandle.createWritable();
          
          const res = await fetch(previewPhoto);
          const blob = await res.blob();
          
          await writable.write(blob);
          await writable.close();
          savedToDir = true;
        }
      } catch (e) {
        console.error("Error saving to directory handle, falling back to download", e);
      }

      if (!savedToDir) {
        // Fallback: Trigger download to local device
        const link = document.createElement('a');
        link.href = previewPhoto;
        link.download = finalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setPreviewPhoto(null);
      
      // Redirect to gallery after successful save
      if (onNavigate) {
        onNavigate('gallery');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const shareViaWhatsApp = async () => {
    if (!previewPhoto) return;
    
    setIsProcessing(true);
    setProcessingMessage('Preparando para compartir...');
    
    try {
      const baseName = photoName.trim();
      const dateSuffix = photoDate ? `_${photoDate}` : '';
      const finalName = `${baseName}${dateSuffix}.jpg`;
      
      const res = await fetch(previewPhoto);
      const blob = await res.blob();
      const file = new File([blob], finalName, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: finalName,
          text: `Documento: ${finalName}`
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
    <main className="flex-grow relative mt-16 mb-20 overflow-hidden bg-gray-900">
      {/* Live Camera Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay gradient for better UI visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

      {dualMode && (
        <div className="absolute top-20 left-4 z-10 bg-blue-600/90 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 backdrop-blur-md">
          <Split size={16} />
          Modo Dual Activado
        </div>
      )}

      {/* Orientation Toggle */}
      <button
        onClick={() => setIsLandscape(!isLandscape)}
        className="absolute top-20 right-4 z-10 bg-black/50 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 backdrop-blur-md border border-white/20 transition-all"
      >
        <Smartphone className={`transition-transform duration-300 ${isLandscape ? 'rotate-90' : ''}`} size={18} />
        {isLandscape ? 'Horizontal' : 'Vertical'}
      </button>

      {firstPhoto && (
        <div className="absolute top-32 left-4 z-10 bg-blue-600/80 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          Esperando segunda foto...
        </div>
      )}

      {/* Scanning Frame */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`relative border-2 border-white/50 rounded-xl transition-all duration-300 ${isLandscape ? 'w-5/6 h-2/5 md:w-3/4 md:h-1/2' : 'w-4/5 h-2/3 md:w-3/5 md:h-3/4'}`}>
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
          
          <div className="absolute inset-4 rounded-xl backdrop-blur-[1px] bg-white/5 border border-white/10 flex items-center justify-center">
            <p className={`text-white font-medium tracking-wide text-center px-4 drop-shadow-md transition-transform duration-300 ${isLandscape ? 'rotate-90' : ''}`}>
              {dualMode && !firstPhoto ? 'ALINEE EL FRENTE DEL DOCUMENTO' : 
               dualMode && firstPhoto ? 'ALINEE EL REVERSO DEL DOCUMENTO' : 
               'ALINEE EL DOCUMENTO DENTRO DEL MARCO'}
            </p>
          </div>
        </div>
      </div>

      {/* UI Overlays */}
      <div className="absolute inset-x-0 bottom-8 px-8 flex flex-col items-center gap-6">
        {/* Capture Controls */}
        <div className="flex items-center justify-center gap-12 w-full">
          <div className="w-12 h-12"></div> {/* Spacer to keep camera button centered */}
          <button 
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-white p-1.5 shadow-2xl active:scale-95 transition-transform"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <Camera className={`text-white transition-transform duration-300 ${isLandscape ? 'rotate-90' : ''}`} size={32} />
            </div>
          </button>
          <button 
            onClick={toggleCamera}
            className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 text-white flex items-center justify-center border border-white/20"
          >
            <RotateCcw className={`transition-transform duration-300 ${isLandscape ? 'rotate-90' : ''}`} size={24} />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-[80vw]">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-900 dark:text-white font-medium text-center">{processingMessage}</p>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Guardar Foto</h3>
              <button onClick={() => setPreviewPhoto(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow">
              <div className="w-full flex items-center justify-center mb-4 bg-transparent">
                <img src={previewPhoto} alt="Preview" className="max-w-full h-auto max-h-[35vh] object-contain rounded-lg shadow-md border border-gray-200 dark:border-gray-700" decoding="async" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del paciente</label>
                  <input 
                    type="text" 
                    value={photoName}
                    onChange={(e) => setPhotoName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                  <input 
                    type="date" 
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col gap-3 flex-shrink-0">
              <div className="flex gap-3">
                <button 
                  onClick={confirmSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  <Save size={18} />
                  Guardar
                </button>
                <button 
                  onClick={shareViaWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                >
                  <Share2 size={18} />
                  WhatsApp
                </button>
              </div>
              <button 
                onClick={() => setPreviewPhoto(null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

