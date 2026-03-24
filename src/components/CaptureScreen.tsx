import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, Split, Save, X, Share2 } from 'lucide-react';
import { savePhoto, getDirectoryHandle } from '../lib/db';

export const CaptureScreen = () => {
  const [dualMode, setDualMode] = useState(false);
  const [firstPhoto, setFirstPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Modal state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const openSaveModal = (dataUrl: string, type: string) => {
    setPreviewPhoto(dataUrl);
    const timestamp = Date.now();
    setPhotoName(`TanFotos_${type}_${timestamp}`);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    if (dualMode) {
      if (!firstPhoto) {
        // First photo of dual mode
        setFirstPhoto(dataUrl);
        alert('Primera foto tomada. Por favor, tome la segunda foto (reverso).');
      } else {
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
        
        const combinedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        openSaveModal(combinedDataUrl, 'dual');
        setFirstPhoto(null);
      }
    } else {
      // Single mode
      openSaveModal(dataUrl, 'single');
    }
  };

  const confirmSave = async () => {
    if (!previewPhoto) return;

    const finalName = photoName.endsWith('.jpg') ? photoName : `${photoName}.jpg`;
    const folderName = localStorage.getItem('tanFotos_folderPath') || 'Descargas';
    
    // Save to IndexedDB for Gallery
    await savePhoto({
      dataUrl: previewPhoto,
      timestamp: Date.now(),
      name: finalName,
      folder: folderName
    });

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
        
        setPreviewPhoto(null);
        alert('Foto guardada correctamente en la carpeta seleccionada.');
        return;
      }
    } catch (e) {
      console.error("Error saving to directory handle, falling back to download", e);
    }

    // Fallback: Trigger download to local device
    const link = document.createElement('a');
    link.href = previewPhoto;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setPreviewPhoto(null);
    alert('Foto guardada correctamente.');
  };

  const shareViaWhatsApp = async () => {
    if (!previewPhoto) return;
    
    const finalName = photoName.endsWith('.jpg') ? photoName : `${photoName}.jpg`;
    
    try {
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

      {/* Dual Mode Toggle */}
      <div className="absolute top-6 left-4 z-10">
        <button 
          onClick={() => {
            setDualMode(!dualMode);
            setFirstPhoto(null); // Reset if toggled
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 transition-all ${dualMode ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}
        >
          <Split size={20} />
          <span className="text-sm font-medium">{dualMode ? 'Dual: ON' : 'Dual: OFF'}</span>
        </button>
      </div>

      {firstPhoto && (
        <div className="absolute top-20 left-4 z-10 bg-blue-600/80 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          Esperando segunda foto...
        </div>
      )}

      {/* Scanning Frame */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-4/5 h-2/3 md:w-3/5 md:h-3/4 border-2 border-white/50 rounded-xl">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
          
          <div className="absolute inset-4 rounded-xl backdrop-blur-[1px] bg-white/5 border border-white/10 flex items-center justify-center">
            <p className="text-white font-medium tracking-wide text-center px-4 drop-shadow-md">
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
              <Camera className="text-white" size={32} />
            </div>
          </button>
          <button 
            onClick={toggleCamera}
            className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 text-white flex items-center justify-center border border-white/20"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      {/* Save Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Guardar Foto</h3>
              <button onClick={() => setPreviewPhoto(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <img src={previewPhoto} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del archivo</label>
                  <input 
                    type="text" 
                    value={photoName}
                    onChange={(e) => setPhotoName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex flex-col gap-3">
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
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100"
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

