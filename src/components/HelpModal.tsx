import React from 'react';
import { X, Camera, LayoutGrid, Settings, Split, Moon, Sun, Share2, Save, Trash2, Download } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">Ayuda y Guía de Uso</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow space-y-8 text-gray-700 dark:text-gray-300">
          
          <section>
            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Camera size={20} /> Pantalla de Captura
            </h4>
            <p className="mb-3 text-sm leading-relaxed">
              Es la pantalla principal donde tomas las fotografías de los documentos de los pacientes. 
              Alinea el documento dentro del marco en pantalla y presiona el botón circular inferior para tomar la foto.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                  <Split size={16} />
                </div>
                <div>
                  <strong>Modo Dual (Ajustes):</strong> Si activas el Modo Dual en Ajustes, la cámara te pedirá tomar dos fotos (frente y reverso) y las unirá automáticamente en una sola imagen.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                  <Save size={16} />
                </div>
                <div>
                  <strong>Guardado:</strong> Al tomar la foto, aparecerá un cuadro para poner el nombre del paciente y la fecha. Puedes guardarla en tu dispositivo o compartirla directamente por WhatsApp.
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <LayoutGrid size={20} /> Galería
            </h4>
            <p className="mb-3 text-sm leading-relaxed">
              Aquí puedes ver todas las fotos que has tomado y guardado en la aplicación.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Share2 size={16} className="text-green-500" />
                <span><strong>Compartir:</strong> Envía la imagen por WhatsApp u otra app.</span>
              </li>
              <li className="flex items-center gap-3">
                <Download size={16} className="text-blue-500" />
                <span><strong>Descargar:</strong> Guarda una copia en tu dispositivo.</span>
              </li>
              <li className="flex items-center gap-3">
                <Trash2 size={16} className="text-red-500" />
                <span><strong>Eliminar:</strong> Borra la foto de la galería (requiere confirmación).</span>
              </li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Settings size={20} /> Ajustes
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <strong>Carpeta de almacenamiento:</strong> Selecciona la carpeta exacta de tu dispositivo donde quieres que se guarden los archivos físicos.
              </li>
              <li>
                <strong>Modo Dual:</strong> Activa o desactiva la función de tomar dos fotos y unirlas en una sola. Una vez activado, se mantendrá así hasta que lo desactives.
              </li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Moon size={20} /> Modo Oscuro
            </h4>
            <p className="text-sm leading-relaxed">
              Puedes cambiar entre el modo claro y oscuro usando el icono del sol/luna en la esquina superior derecha de la pantalla.
            </p>
          </section>

        </div>
        
        <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
