import React, { useState } from 'react';
import { Sparkles, Image, CheckCircle2, RotateCcw, ZoomIn, Upload, Loader2, Calendar, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PRODUCT_CATEGORIES } from '../../data/mockData';
import { PaymentMode } from '../../types';
import { StorageService } from '../../services/storageService';
import { APP_IMAGES } from '../../assets/cartoonAssets';

export const CustomProductRequestForm: React.FC = () => {
  const { submitCustomRequest, openZoom, activeBuyer, addToast } = useApp();

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    expectedDeliveryDate: defaultDate.toISOString().split('T')[0],
    quantity: '1',
    paymentMode: 'Both' as PaymentMode,
    sampleImage: '',
    sampleStoragePath: '',
    specifications: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleSampleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const buyerName = activeBuyer?.username || 'buyer';
      const res = await StorageService.uploadImage('custom-requests', buyerName, file);
      if (res.success && res.signedUrl) {
        setFormData((prev) => ({
          ...prev,
          sampleImage: res.signedUrl!,
          sampleStoragePath: res.storagePath || '',
        }));
        addToast('Sample reference photo ready!', 'success');
      } else {
        addToast(res.error || 'Failed to upload sample photo', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Request title is required';
    if (!formData.category.trim()) errs.category = 'Please select a category';
    if (!formData.expectedDeliveryDate) errs.expectedDeliveryDate = 'Expected delivery date is required';
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 1) {
      errs.quantity = 'Please enter a quantity of 1 or more';
    }
    if (formData.sampleImage.trim().toLowerCase().startsWith('data:')) {
      errs.sampleImage = 'Base64 Data URLs are not supported; upload a photo or paste an HTTPS URL';
    }
    if (!formData.specifications.trim()) errs.specifications = 'Please describe your custom specifications';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const ok = submitCustomRequest({
      title: formData.title.trim(),
      category: formData.category,
      expectedDeliveryDate: formData.expectedDeliveryDate,
      quantity: Number(formData.quantity),
      paymentMode: formData.paymentMode,
      sampleImage: formData.sampleImage.trim() || undefined,
      sampleStoragePath: formData.sampleStoragePath.trim() || undefined,
      specifications: formData.specifications.trim(),
    });

    if (ok) {
      // Reset form after successful submission
      setFormData({
        title: '',
        category: '',
        expectedDeliveryDate: defaultDate.toISOString().split('T')[0],
        quantity: '1',
        paymentMode: 'Both',
        sampleImage: '',
        sampleStoragePath: '',
        specifications: '',
      });
      setErrors({});
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-200/50 p-7 sm:p-10 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 mb-8 border-b border-stone-100">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-amber-200/80 shrink-0 animate-float-slow">
          <img
            src={APP_IMAGES.customCraft}
            alt="Bespoke Custom Craft"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/60 mb-1.5">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Bespoke Commission</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Request Customized Product</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Can't find what you need? Describe your bespoke item for local artisans in your district
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Request Title / Item Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Custom Terracotta Water Carafe with Engraved Floral Pattern"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            className={`w-full px-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
              errors.title
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
            }`}
          />
          {errors.title && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.title}</p>}
        </div>

        {/* Category, Delivery Date, Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Category <span className="text-rose-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => {
                setFormData({ ...formData, category: e.target.value });
                if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
              }}
              className={`w-full px-3.5 py-3 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-3 transition-all ${
                errors.category
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
              }`}
            >
              <option value="">Select Category</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.category}</p>}
          </div>

          {/* Expected Delivery Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Expected Date <span className="text-rose-600">*</span>
            </label>
            <input
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => {
                setFormData({ ...formData, expectedDeliveryDate: e.target.value });
                if (errors.expectedDeliveryDate) setErrors((prev) => ({ ...prev, expectedDeliveryDate: '' }));
              }}
              className={`w-full px-3.5 py-3 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-3 transition-all ${
                errors.expectedDeliveryDate
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
              }`}
            />
            {errors.expectedDeliveryDate && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.expectedDeliveryDate}</p>
            )}
          </div>

          {/* Required Quantity */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Quantity <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => {
                setFormData({ ...formData, quantity: e.target.value });
                if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
              }}
              className={`w-full px-3.5 py-3 rounded-xl border text-sm text-slate-900 font-mono focus:outline-none focus:ring-3 transition-all ${
                errors.quantity
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
              }`}
            />
            {errors.quantity && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.quantity}</p>}
          </div>
        </div>

        {/* Payment Mode (Single Choice) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
            Payment Mode (Single Choice) <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['COD', 'Online Payment', 'Both'] as PaymentMode[]).map((mode) => {
              const isSelected = formData.paymentMode === mode;
              return (
                <label
                  key={mode}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-semibold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="customPayMode"
                    value={mode}
                    checked={isSelected}
                    onChange={() => setFormData({ ...formData, paymentMode: mode })}
                    className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                  />
                  <div className="text-sm">
                    <span className="font-semibold block">{mode}</span>
                    <span className="text-xs text-slate-500">
                      {mode === 'COD'
                        ? 'Cash upon delivery'
                        : mode === 'Online Payment'
                        ? 'UPI / Online payment'
                        : 'Open to both'}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Sample Image (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Sample Image / Reference Photo <span className="text-slate-400 font-normal normal-case">(Optional)</span>
            </label>
            <span className="text-xs text-slate-400">Helps artisans estimate craft difficulty</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                {formData.sampleImage ? (
                  <img
                    src={formData.sampleImage}
                    alt="Sample reference"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Image className="w-8 h-8 text-slate-300" />
                )}
              </div>
              {formData.sampleImage && (
                <button
                  type="button"
                  onClick={() => openZoom(formData.sampleImage, 'Custom Sample Inspection', formData.sampleStoragePath || undefined)}
                  className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity cursor-pointer"
                  title="Inspect photo zoom"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <input
                type="text"
                placeholder="Image URL or upload reference file"
                value={formData.sampleImage}
                onChange={(e) => {
                  setFormData({ ...formData, sampleImage: e.target.value, sampleStoragePath: '' });
                  if (errors.sampleImage) setErrors((prev) => ({ ...prev, sampleImage: '' }));
                }}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:ring-3 focus:ring-amber-500/15 transition-all"
              />
              {errors.sampleImage && <p className="text-xs text-rose-600 font-medium">{errors.sampleImage}</p>}
              <div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-lg border border-amber-200 transition-colors cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploading ? 'Uploading to Supabase...' : 'Upload Reference Photo'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleSampleUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Detailed Specifications & Custom Instructions <span className="text-rose-600">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Include dimensions (height, diameter, volume), finish preferences, specific materials or ingredients..."
            value={formData.specifications}
            onChange={(e) => {
              setFormData({ ...formData, specifications: e.target.value });
              if (errors.specifications) setErrors((prev) => ({ ...prev, specifications: '' }));
            }}
            className={`w-full px-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
              errors.specifications
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
            }`}
          />
          {errors.specifications && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.specifications}</p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-amber-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer btn-cartoon-pop"
          >
            <Sparkles className="w-4 h-4" />
            <span>Broadcast Custom Request to Regional Artisans</span>
          </button>
        </div>
      </form>
    </div>
  );
};
