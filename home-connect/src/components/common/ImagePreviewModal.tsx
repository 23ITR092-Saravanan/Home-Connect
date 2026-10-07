import React, { useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string | null;
  alt: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ src, alt, onClose }) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => setZoom(1), [src]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-3 sm:p-6"
      onClick={onClose}
    >
      <div className="flex max-h-full w-full max-w-5xl flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
        <div className="flex w-full items-center justify-between">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-black/50 p-1">
            <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 0.25))} className="rounded-lg p-2 text-white disabled:opacity-40 hover:bg-white/10">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-12 text-center text-xs font-semibold text-white">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + 0.25))} className="rounded-lg p-2 text-white disabled:opacity-40 hover:bg-white/10">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Reset zoom" onClick={() => setZoom(1)} className="rounded-lg p-2 text-white hover:bg-white/10">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-auto rounded-xl">
          <img src={src} alt={alt} style={{ transform: `scale(${zoom})` }} className="max-h-[78vh] max-w-full origin-center object-contain transition-transform duration-150" />
        </div>
      </div>
    </div>
  );
};