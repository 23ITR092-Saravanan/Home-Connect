import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Package,
  IndianRupee,
  CreditCard,
  Banknote,
  Layers,
  FileText,
  CheckCircle,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import { PaymentMode, Product, SellerProfile, PRESET_CATEGORIES } from '../../types/index.ts';
import { ProductService } from '../../services/storage.ts';
import { optimizeImage } from '../../services/images.ts';
import { useToast } from '../common/Toast.tsx';

interface AddEditProductModalProps {
  seller: SellerProfile;
  productToEdit?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  seller,
  productToEdit,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();

  // Form State - strictly requested fields
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [minOrderQuantity, setMinOrderQuantity] = useState<number | string>(1);
  const [imageUrl, setImageUrl] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Both');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [category, setCategory] = useState<string>(PRESET_CATEGORIES[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setProductName(productToEdit.title);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price);
      setMinOrderQuantity(productToEdit.minOrderQuantity || 1);
      setImageUrl(productToEdit.imageUrl || '');
      setPaymentMode(productToEdit.paymentMode || 'Both');
      setAdditionalInfo(productToEdit.additionalInfo || '');
      setCategory(productToEdit.category || PRESET_CATEGORIES[0]);
    } else {
      setProductName('');
      setDescription('');
      setPrice('');
      setMinOrderQuantity(1);
      setImageUrl('');
      setPaymentMode('Both');
      setAdditionalInfo('');
      setCategory(seller.categories?.[0] || PRESET_CATEGORIES[0]);
    }
  }, [productToEdit, seller, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Please select an image file under 2.5MB');
      return;
    }

    try {
      setImageUrl(await optimizeImage(file));
    } catch (error) {
      showToast('error', 'Image Processing Failed', error instanceof Error ? error.message : 'Please try another image.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = productName.trim();
    const cleanDesc = description.trim();
    const numPrice = Number(price);
    const numMoq = Math.max(1, Number(minOrderQuantity));

    if (!cleanName) {
      showToast('error', 'Required Field', 'Product Name is required');
      return;
    }
    if (!cleanDesc) {
      showToast('error', 'Required Field', 'Description is required');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      showToast('error', 'Invalid Price', 'Individual Quantity Price must be greater than 0');
      return;
    }
    if (isNaN(numMoq) || numMoq < 1) {
      showToast('error', 'Invalid Quantity', 'Minimum Order Quantity must be at least 1');
      return;
    }
    if (!imageUrl.trim()) {
      showToast('error', 'Required Field', 'Product Image is required');
      return;
    }

    setLoading(true);
    try {
      if (productToEdit) {
        ProductService.updateProduct(productToEdit.id, seller.id, {
          title: cleanName,
          description: cleanDesc,
          price: numPrice,
          minOrderQuantity: numMoq,
          imageUrl: imageUrl.trim(),
          paymentMode,
          additionalInfo: additionalInfo.trim(),
          category,
        });
        showToast('success', 'Product Updated', `"${cleanName}" was updated successfully.`);
      } else {
        ProductService.createProduct(seller, {
          title: cleanName,
          description: cleanDesc,
          price: numPrice,
          minOrderQuantity: numMoq,
          imageUrl: imageUrl.trim(),
          paymentMode,
          additionalInfo: additionalInfo.trim(),
          category,
          inStock: true,
        });
        showToast('success', 'Product Added', `"${cleanName}" has been listed in your products.`);
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      showToast('error', 'Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                {productToEdit ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-stone-500">
                Seller: {seller.username} ({seller.sellerCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Product Name — required */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Handmade Scented Soy Candle / Spiced Mango Pickle"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-medium"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Product Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
                required
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Description — required */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the handmade item, ingredients, dimensions, or materials used..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
              required
            />
          </div>

          {/* 3. Individual Quantity Price & 4. Minimum Order Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Individual Quantity Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold"
                  required
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Price per single unit</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Minimum Order Quantity <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={minOrderQuantity}
                  onChange={(e) => setMinOrderQuantity(e.target.value)}
                  placeholder="e.g. 1, 2, or 5"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold"
                  required
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Minimum units buyer must purchase</p>
            </div>
          </div>

          {/* 5. Product Image — required */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Product Image <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center overflow-hidden shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-stone-300" />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition shadow-xs">
                  <Upload className="w-4 h-4 text-amber-600" />
                  Upload from Device
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                <div className="text-[11px] text-stone-500">
                  Or enter direct image URL:
                </div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/product.jpg"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-stone-50/50 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 6. Payment Mode — required */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              Payment Mode <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(['Cash After Delivery', 'Online Payment', 'Both'] as PaymentMode[]).map((mode) => {
                const isSelected = paymentMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`p-3 rounded-xl border text-xs font-semibold transition flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 text-amber-900 shadow-xs'
                        : 'border-stone-200 bg-stone-50/60 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {mode === 'Cash After Delivery' && <Banknote className="w-4 h-4 text-emerald-600" />}
                    {mode === 'Online Payment' && <CreditCard className="w-4 h-4 text-blue-600" />}
                    {mode === 'Both' && <Layers className="w-4 h-4 text-amber-600" />}
                    <span className="text-center">{mode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Additional Information — optional */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Additional Information <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="e.g. Storage instructions, expiry period, packaging notes, customization availability..."
              className="w-full px-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-stone-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-sm shadow-md shadow-amber-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{productToEdit ? 'Save Changes' : 'Add Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
