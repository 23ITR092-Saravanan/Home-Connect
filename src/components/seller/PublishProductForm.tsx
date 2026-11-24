import React, { useState, useEffect } from 'react';
import { PackagePlus, Image, IndianRupee, CheckCircle2, RotateCcw, ZoomIn, Upload, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PRODUCT_CATEGORIES } from '../../data/mockData';
import { PaymentMode } from '../../types';
import { StorageService } from '../../services/storageService';
import { APP_IMAGES } from '../../assets/cartoonAssets';

interface PublishProductFormProps {
  onCancel?: () => void;
}

export const PublishProductForm: React.FC<PublishProductFormProps> = ({ onCancel }) => {
  const { saveProduct, editingProduct, setEditingProduct, setSellerActiveTab, openZoom, activeSeller, addToast } = useApp();

  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    price: '',
    minOrderQty: '',
    image: '',
    imageStoragePath: '',
    description: '',
    paymentMode: 'Both' as PaymentMode,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const sellerCode = activeSeller?.shopCode || 'SELLER';
      const res = await StorageService.uploadImage('products', sellerCode, file);
      if (res.success && res.signedUrl) {
        setFormData((prev) => ({
          ...prev,
          image: res.signedUrl!,
          imageStoragePath: res.storagePath || '',
        }));
        addToast('Product photo uploaded successfully!', 'success');
      } else {
        addToast(res.error || 'Failed to upload product photo', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        productName: editingProduct.productName,
        category: editingProduct.category,
        price: editingProduct.price.toString(),
        minOrderQty: editingProduct.minOrderQty.toString(),
        image: editingProduct.image,
        imageStoragePath: editingProduct.imageStoragePath || '',
        description: editingProduct.description || '',
        paymentMode: editingProduct.paymentMode,
      });
    } else {
      setFormData({
        productName: '',
        category: '',
        price: '',
        minOrderQty: '',
        image: '',
        imageStoragePath: '',
        description: '',
        paymentMode: 'Both',
      });
    }
    setErrors({});
  }, [editingProduct]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.productName.trim()) errs.productName = 'Product name is required';
    if (!formData.category.trim()) errs.category = 'Please select a category';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errs.price = 'Price must be a valid positive number';
    }
    if (!formData.minOrderQty || isNaN(Number(formData.minOrderQty)) || Number(formData.minOrderQty) < 1) {
      errs.minOrderQty = 'MOQ must be at least 1';
    }
    if (!formData.image.trim()) {
      errs.image = 'Product image is required (upload or provide URL)';
    } else if (formData.image.trim().toLowerCase().startsWith('data:')) {
      errs.image = 'Base64 Data URLs are not supported; upload a photo or paste an HTTPS URL';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const success = saveProduct({
      id: editingProduct ? editingProduct.id : undefined,
      productName: formData.productName.trim(),
      category: formData.category,
      price: Number(formData.price),
      minOrderQty: Number(formData.minOrderQty),
      image: formData.image.trim(),
      imageStoragePath: formData.imageStoragePath.trim() || undefined,
      description: formData.description.trim() || undefined,
      paymentMode: formData.paymentMode,
      sellerShopCode: activeSeller?.shopCode || 'SELLER',
      sellerName: activeSeller?.username || 'Seller',
      sellerDistrict: activeSeller?.district || 'General',
      sellerPincode: activeSeller?.pincode || '',
      sellerRating: activeSeller?.rating || 0,
    });

    if (success) {
      if (!editingProduct) {
        setFormData({
          productName: '',
          category: '',
          price: '',
          minOrderQty: '',
          image: '',
          imageStoragePath: '',
          description: '',
          paymentMode: 'Both',
        });
      }
      if (onCancel) onCancel();
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    if (onCancel) {
      onCancel();
    } else {
      setSellerActiveTab('my-products');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-200/50 p-7 sm:p-10 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 pb-6 mb-8 border-b border-stone-100">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-sky-200/80 shrink-0 animate-float-slow">
            <img
              src={APP_IMAGES.sellerCartoon}
              alt="Artisan Creator"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-sky-900 bg-sky-50 border border-sky-200/60 mb-1">
              <PackagePlus className="w-3 h-3 text-sky-600" />
              <span>Workshop Inventory</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {editingProduct ? 'Edit Product Listing' : 'Publish New Product'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingProduct
                ? 'Update pricing, MOQ, or photos for this item'
                : 'List your homemade creation to neighborhood buyers'}
            </p>
          </div>
        </div>

        {editingProduct && (
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Product Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Handcrafted Terracotta Curry Pot (2 Litre)"
            value={formData.productName}
            onChange={(e) => {
              setFormData({ ...formData, productName: e.target.value });
              if (errors.productName) setErrors((prev) => ({ ...prev, productName: '' }));
            }}
            className={`w-full px-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
              errors.productName
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
            }`}
          />
          {errors.productName && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.productName}</p>}
        </div>

        {/* Category & Pricing & MOQ Grid */}
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
                  : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
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

          {/* Individual Quantity Price */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Price / Unit (₹) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="1"
                placeholder="450"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                }}
                className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-slate-900 font-mono focus:outline-none focus:ring-3 transition-all ${
                  errors.price
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                }`}
              />
            </div>
            {errors.price && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.price}</p>}
          </div>

          {/* Minimum Order Quantity */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Min Order Qty (MOQ) <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={formData.minOrderQty}
              onChange={(e) => {
                setFormData({ ...formData, minOrderQty: e.target.value });
                if (errors.minOrderQty) setErrors((prev) => ({ ...prev, minOrderQty: '' }));
              }}
              className={`w-full px-3.5 py-3 rounded-xl border text-sm text-slate-900 font-mono focus:outline-none focus:ring-3 transition-all ${
                errors.minOrderQty
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
              }`}
            />
            {errors.minOrderQty && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.minOrderQty}</p>}
          </div>
        </div>

        {/* Product Image with Zoom preview & Supabase Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Product Image <span className="text-rose-600">*</span>
            </label>
            <span className="text-xs text-slate-400">Direct URL or file upload</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Image className="w-8 h-8 text-slate-300" />
                )}
              </div>
              {formData.image && (
                <button
                  type="button"
                  onClick={() => openZoom(formData.image, formData.productName || 'Product Image', formData.imageStoragePath || undefined)}
                  className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity cursor-pointer"
                  title="Zoom image"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <input
                type="text"
                placeholder="Paste image URL or upload file"
                value={formData.image}
                onChange={(e) => {
                  setFormData({ ...formData, image: e.target.value, imageStoragePath: '' });
                  if (errors.image) setErrors((prev) => ({ ...prev, image: '' }));
                }}
                className={`w-full px-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                  errors.image
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                }`}
              />
              <div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-xs rounded-lg border border-sky-200 transition-colors cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploading ? 'Uploading to Supabase...' : 'Upload Photo to Supabase'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
          {errors.image && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.image}</p>}
        </div>

        {/* Description (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Product Description <span className="text-slate-400 font-normal normal-case">(Optional)</span>
            </label>
            <span className="text-xs text-slate-400">Dimensions, materials, care instructions</span>
          </div>
          <textarea
            rows={3}
            placeholder="Describe the crafted product, materials used, dimensions, or preparation method..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-500/15 transition-all"
          />
        </div>

        {/* Payment Mode Single Choice */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
            Accepted Payment Mode <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['COD', 'Online Payment', 'Both'] as PaymentMode[]).map((mode) => (
              <label
                key={mode}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.paymentMode === mode
                    ? 'bg-sky-50/80 border-sky-400 text-sky-950 font-semibold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value={mode}
                  checked={formData.paymentMode === mode}
                  onChange={() => setFormData({ ...formData, paymentMode: mode })}
                  className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-sm">{mode}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="flex-1 py-3.5 px-5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer btn-cartoon-pop"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingProduct ? 'Save Changes' : 'Publish Product Listing'}</span>
          </button>
          {editingProduct && (
            <button
              type="button"
              onClick={handleCancel}
              className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
