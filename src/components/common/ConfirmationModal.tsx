import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ConfirmationModal: React.FC = () => {
  const { confirmDialog, closeConfirm } = useApp();

  if (!confirmDialog || !confirmDialog.isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={closeConfirm}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-full shrink-0 ${
                confirmDialog.isDestructive
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {confirmDialog.isDestructive ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  {confirmDialog.title}
                </h3>
                <button
                  onClick={closeConfirm}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeConfirm}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {confirmDialog.cancelText || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                confirmDialog.onConfirm();
                closeConfirm();
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ${
                confirmDialog.isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200'
              }`}
            >
              {confirmDialog.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
