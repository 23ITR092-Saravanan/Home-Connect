import React, { useState } from 'react';
import { X, Calendar, Edit3, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductRequest } from '../../types';

const EditRequestModalContent: React.FC<{ editingRequest: ProductRequest }> = ({ editingRequest }) => {
  const { setEditingRequest, updateRequest } = useApp();

  const [quantity, setQuantity] = useState(editingRequest.quantity.toString());
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(editingRequest.expectedDeliveryDate);
  const [customDescription, setCustomDescription] = useState(editingRequest.customDescription || '');
  const [deliveryAddress, setDeliveryAddress] = useState(editingRequest.deliveryAddress);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      setError('Please enter a valid quantity of 1 or more');
      return;
    }
    if (!expectedDeliveryDate) {
      setError('Please select an expected delivery date');
      return;
    }
    if (expectedDeliveryDate < today) {
      setError('Expected delivery date cannot be in the past');
      return;
    }

    const unitPrice = editingRequest.unitPrice || 0;
    const totalPrice = unitPrice * qty;

    updateRequest(editingRequest.id, {
      quantity: qty,
      totalPrice: unitPrice ? totalPrice : undefined,
      expectedDeliveryDate,
      customDescription: customDescription.trim() || undefined,
      deliveryAddress: deliveryAddress.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={() => setEditingRequest(null)}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Pending Request</h3>
              <p className="text-xs text-slate-500">{editingRequest.productName}</p>
            </div>
          </div>
          <button
            onClick={() => setEditingRequest(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Quantity <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Expected Date <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={today}
                  value={expectedDeliveryDate}
                  onChange={(e) => {
                    setExpectedDeliveryDate(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Delivery Address <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => {
                setDeliveryAddress(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notes / Custom Instructions <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="e.g. Please wrap in cardboard padding"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingRequest(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Update Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditRequestModal: React.FC = () => {
  const { editingRequest } = useApp();
  if (!editingRequest) return null;
  return <EditRequestModalContent key={editingRequest.id} editingRequest={editingRequest} />;
};
