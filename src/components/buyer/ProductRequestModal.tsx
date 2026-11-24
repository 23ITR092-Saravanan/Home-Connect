import React, { useState } from 'react';
import { X, Calendar, ShoppingBag, ShieldCheck, IndianRupee, MapPin, Phone, User, ZoomIn, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, PaymentMode } from '../../types';
import { StorageImage } from '../common/StorageImage';

const ProductRequestModalContent: React.FC<{ requestingProduct: Product }> = ({ requestingProduct }) => {
  const {
    setRequestingProduct,
    activeBuyer,
    submitStandardRequest,
    openZoom,
  } = useApp();

  const [quantity, setQuantity] = useState(requestingProduct.minOrderQty.toString());
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 5);
  const [expectedDate, setExpectedDate] = useState(defaultDate.toISOString().split('T')[0]);

  const initialMode: PaymentMode =
    requestingProduct.paymentMode === 'Both' ? 'COD' : requestingProduct.paymentMode;
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialMode);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const numQty = parseInt(quantity, 10) || 0;
  const totalPrice = numQty * requestingProduct.price;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty < requestingProduct.minOrderQty) {
      setError(`Minimum order quantity for this item is ${requestingProduct.minOrderQty} units`);
      return;
    }
    if (!expectedDate) {
      setError('Please select an expected delivery date');
      return;
    }

    submitStandardRequest({
      product: requestingProduct,
      quantity: numQty,
      paymentMode,
      expectedDeliveryDate: expectedDate,
      customDescription: notes.trim() || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in"
      onClick={() => setRequestingProduct(null)}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Product Request Confirmation</h3>
              <p className="text-xs text-slate-500">Review selected item and delivery details</p>
            </div>
          </div>
          <button
            onClick={() => setRequestingProduct(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          {/* Section 1: Selected Product Details */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-start gap-4">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-slate-200">
                  <StorageImage
                    src={requestingProduct.image}
                    storagePath={requestingProduct.imageStoragePath}
                    alt={requestingProduct.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openZoom(requestingProduct.image, requestingProduct.productName, requestingProduct.imageStoragePath)
                  }
                  className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity cursor-pointer"
                  title="Inspect photo zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                  {requestingProduct.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                  {requestingProduct.productName}
                </h4>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">
                    ₹{requestingProduct.price} / unit
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>Min Order: {requestingProduct.minOrderQty} units</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>Shop: <strong>{requestingProduct.sellerShopCode}</strong></span>
                </div>

                <p className="mt-1 text-2xs text-slate-500">
                  Fulfilled by {requestingProduct.sellerName} ({requestingProduct.sellerDistrict})
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Buyer Delivery Details */}
          <div className="p-4 bg-stone-50/70 rounded-xl border border-stone-200">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Buyer Delivery Profile
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Username: <strong>{activeBuyer?.username || '—'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact: {activeBuyer?.contactNumber || '—'}</span>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {activeBuyer
                    ? `${activeBuyer.deliveryAddress} (${activeBuyer.district} - ${activeBuyer.pincode})`
                    : 'Delivery address unavailable'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Quantity & Expected Delivery Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Quantity Required <span className="text-rose-600">*</span>
                </label>
                <span className="text-2xs text-slate-500">
                  Min: {requestingProduct.minOrderQty}
                </span>
              </div>
              <input
                type="number"
                min={requestingProduct.minOrderQty}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Expected Delivery Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={expectedDate}
                onChange={(e) => {
                  setExpectedDate(e.target.value);
                  setError('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
                required
              />
            </div>
          </div>

          {/* Section 4: Payment Mode Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Payment Option <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(requestingProduct.paymentMode === 'Both'
                ? ['COD', 'Online Payment']
                : [requestingProduct.paymentMode]
              ).map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    paymentMode === mode
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-semibold ring-1 ring-amber-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payMode"
                    value={mode}
                    checked={paymentMode === mode}
                    onChange={() => setPaymentMode(mode as PaymentMode)}
                    className="w-3.5 h-3.5 text-amber-600 border-slate-300 focus:ring-amber-500"
                  />
                  <span>{mode === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (UPI/Card)'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Special Instructions (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Custom Delivery Instructions <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Ring bell twice, or packaging requirements for delicate crafts"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
            />
          </div>

          {/* Price Calculation Summary */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Estimated Total Amount:</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                ₹{isNaN(totalPrice) ? 0 : totalPrice}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRequestingProduct(null)}
                className="px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Product Request</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProductRequestModal: React.FC = () => {
  const { requestingProduct } = useApp();
  if (!requestingProduct) return null;
  return <ProductRequestModalContent key={requestingProduct.id} requestingProduct={requestingProduct} />;
};
