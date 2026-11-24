import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        let borderClass = 'border-emerald-200 bg-emerald-50/95 text-emerald-950';

        if (toast.type === 'error') {
          icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
          borderClass = 'border-rose-200 bg-rose-50/95 text-rose-950';
        } else if (toast.type === 'warning') {
          icon = <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />;
          borderClass = 'border-amber-200 bg-amber-50/95 text-amber-950';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-sky-600 shrink-0" />;
          borderClass = 'border-sky-200 bg-sky-50/95 text-sky-950';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-xs transition-all animate-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <p className="text-xs sm:text-sm font-medium leading-snug">{toast.text}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 transition-opacity"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
