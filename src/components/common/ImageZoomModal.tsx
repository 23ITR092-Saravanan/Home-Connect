import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageImage } from './StorageImage';

export const ImageZoomModal: React.FC = () => {
  const { zoomImage, closeZoom } = useApp();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setScale(1);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomImage, closeZoom]);

  if (!zoomImage) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 transition-opacity animate-in fade-in"
      onClick={closeZoom}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="truncate pr-4">
            <h3 className="text-sm font-semibold text-slate-100 truncate">
              {zoomImage.title || 'Product Photo / Shop Asset'}
            </h3>
            <span className="text-xs text-slate-400">High-Resolution Visual Inspection</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale((s) => Math.min(s + 0.25, 2.5))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.25, 0.75))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale(1)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={closeZoom}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors ml-2"
              title="Close modal"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[350px] bg-slate-950/60">
          <StorageImage
            src={zoomImage.url}
            storagePath={zoomImage.storagePath}
            alt={zoomImage.title || 'Zoomed item'}
            className="max-h-[75vh] max-w-full object-contain transition-transform duration-200 rounded-lg cursor-zoom-in"
            style={{ transform: `scale(${scale})` }}
            onClick={() => setScale((s) => (s > 1 ? 1 : 1.75))}
          />
        </div>

        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Click image to toggle 1.75× zoom or use controls above</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
