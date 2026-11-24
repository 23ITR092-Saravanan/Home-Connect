import React, { useState, useEffect } from 'react';
import { Store, ArrowLeft, CheckCircle2, User, Mail, Lock, Phone, MapPin, Building, Image, Upload, Loader2, ZoomIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AVAILABLE_DISTRICTS, PRODUCT_CATEGORIES } from '../../data/mockData';
import { StorageService } from '../../services/storageService';
import { APP_IMAGES } from '../../assets/cartoonAssets';
import { PHONE_REGEX } from '../../services/validationService';

export const SellerRegister: React.FC = () => {
  const { registerSeller, navigateTo, openZoom, addToast } = useApp();

  const [formData, setFormData] = useState({
    username: '',
    emailId: '',
    password: '',
    contactNumber: '',
    district: '',
    pincode: '',
    selectedCategories: [] as string[],
    otherCategoryText: '',
    shopCode: '',
    shopLogo: '',
    shopLogoStoragePath: '',
    address: '',
  });

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = StorageService.validateFile(file);
    if (!validation.isValid) {
      addToast(validation.error || 'Invalid logo file selected', 'error');
      return;
    }

    if (logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setPendingLogoFile(file);
    setLogoPreviewUrl(preview);
    setFormData((prev) => ({
      ...prev,
      shopLogo: '',
      shopLogoStoragePath: '',
    }));
    addToast('Logo selected — it will upload securely once your shop account is created.', 'info');
  };

  const toggleCategory = (cat: string) => {
    setFormData((prev) => {
      const exists = prev.selectedCategories.includes(cat);
      if (exists) {
        return {
          ...prev,
          selectedCategories: prev.selectedCategories.filter((c) => c !== cat),
        };
      } else {
        return {
          ...prev,
          selectedCategories: [...prev.selectedCategories, cat],
        };
      }
    });
    if (errors.categories) setErrors((prev) => ({ ...prev, categories: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.username.trim()) errs.username = 'Seller / contact name is required';
    else if (formData.username.trim().length < 2) errs.username = 'Name must be at least 2 characters';
    if (!formData.emailId.trim()) errs.emailId = 'Email ID is required';
    else if (!/\S+@\S+\.\S+/.test(formData.emailId)) errs.emailId = 'Enter a valid email address';
    if (!formData.password.trim()) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!formData.contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    else if (!PHONE_REGEX.test(formData.contactNumber.replace(/[\s-]/g, ''))) {
      errs.contactNumber = 'Enter a valid 10-digit contact number';
    }
    if (!formData.district.trim()) errs.district = 'Please select your District';
    if (!formData.pincode.trim()) errs.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode.trim())) errs.pincode = 'Enter a valid 6-digit postal pincode';
    if (formData.selectedCategories.length === 0) errs.categories = 'Please select at least one product category';
    if (formData.selectedCategories.includes('Others') && !formData.otherCategoryText.trim()) {
      errs.otherCategory = 'Please specify your other category';
    }
    if (!formData.shopCode.trim()) errs.shopCode = 'Unique Shop Code is required';
    else if (formData.shopCode.trim().length < 3) errs.shopCode = 'Shop Code must be at least 3 characters';
    if (formData.shopLogo.trim().toLowerCase().startsWith('data:')) {
      errs.shopLogo = 'Base64 Data URLs are not supported; upload a file or paste an HTTPS URL';
    }
    if (!formData.address.trim()) errs.address = 'Workshop / Shop address is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategories = formData.selectedCategories.map((c) =>
      c === 'Others' && formData.otherCategoryText.trim()
        ? `Others (${formData.otherCategoryText.trim()})`
        : c
    );

    setIsSubmitting(true);
    try {
      await registerSeller({
        username: formData.username.trim(),
        emailId: formData.emailId.trim(),
        password: formData.password,
        contactNumber: formData.contactNumber.trim(),
        district: formData.district,
        pincode: formData.pincode.trim(),
        categories: finalCategories,
        shopCode: formData.shopCode.trim().toUpperCase(),
        shopLogo: formData.shopLogo.trim() || undefined,
        shopLogoStoragePath: formData.shopLogoStoragePath.trim() || undefined,
        logoFile: pendingLogoFile || undefined,
        address: formData.address.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 pattern-dots">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-200/50 overflow-hidden p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 pb-6 border-b border-stone-100">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-sky-200/80 shrink-0 animate-float-slow">
              <img
                src={APP_IMAGES.sellerCartoon}
                alt="Seller Artisan Cartoon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-sky-900 bg-sky-50 border border-sky-200/60 mb-1.5">
                <Store className="w-3 h-3 text-sky-600" />
                <span>Artisan Registration</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register Your Workshop</h1>
              <p className="text-xs text-slate-500 mt-1">Get your unique Shop Code, list homemade crafts, and fulfill neighborhood orders</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Username & Email ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Seller / Shopkeeper Name <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Lakshmi Devi"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                      errors.username
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                    }`}
                  />
                </div>
                {errors.username && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Email ID <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="seller@example.com"
                    value={formData.emailId}
                    onChange={(e) => {
                      setFormData({ ...formData, emailId: e.target.value });
                      if (errors.emailId) setErrors((prev) => ({ ...prev, emailId: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                      errors.emailId
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                    }`}
                  />
                </div>
                {errors.emailId && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.emailId}</p>}
              </div>
            </div>

            {/* Row 2: Password & Contact Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                      errors.password
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                    }`}
                  />
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Contact Number <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    placeholder="10-digit phone number"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, contactNumber: e.target.value });
                      if (errors.contactNumber) setErrors((prev) => ({ ...prev, contactNumber: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                      errors.contactNumber
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                    }`}
                  />
                </div>
                {errors.contactNumber && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.contactNumber}</p>}
              </div>
            </div>

            {/* Row 3: District, Pincode & Shop Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  District <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.district}
                    onChange={(e) => {
                      setFormData({ ...formData, district: e.target.value });
                      if (errors.district) setErrors((prev) => ({ ...prev, district: '' }));
                    }}
                    className={`w-full pl-10 pr-8 py-3 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-3 transition-all ${
                      errors.district
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                    }`}
                  >
                    <option value="">Select District</option>
                    {AVAILABLE_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.district && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.district}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Pincode <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => {
                    setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') });
                    if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                  }}
                  className={`w-full px-3.5 py-3 rounded-xl border text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                    errors.pincode
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                  }`}
                />
                {errors.pincode && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.pincode}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Shop Code <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. SHOP-101"
                    value={formData.shopCode}
                    onChange={(e) => {
                      setFormData({ ...formData, shopCode: e.target.value.toUpperCase() });
                      if (errors.shopCode) setErrors((prev) => ({ ...prev, shopCode: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-slate-900 font-mono uppercase placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                      errors.shopCode
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                    }`}
                  />
                </div>
                {errors.shopCode && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.shopCode}</p>}
              </div>
            </div>

            {/* Category: Multiple Selections */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Product Categories <span className="text-rose-600">*</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  {formData.selectedCategories.length} selected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PRODUCT_CATEGORIES.map((category) => {
                  const isSelected = formData.selectedCategories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-2.5 text-xs font-medium rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{category}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
              {errors.categories && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.categories}</p>}

              {/* If "Others" is selected */}
              {formData.selectedCategories.includes('Others') && (
                <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Specify Other Category Details <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Describe your craft or products"
                    value={formData.otherCategoryText}
                    onChange={(e) => setFormData({ ...formData, otherCategoryText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  />
                  {errors.otherCategory && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.otherCategory}</p>}
                </div>
              )}
            </div>

            {/* Shop Logo (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Shop Logo <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                </label>
                <span className="text-xs text-slate-400">Direct URL or upload file</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    {logoPreviewUrl || formData.shopLogo ? (
                      <img
                        src={logoPreviewUrl || formData.shopLogo}
                        alt="Shop Logo Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Store className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  {(logoPreviewUrl || formData.shopLogo) && (
                    <button
                      type="button"
                      onClick={() => openZoom(logoPreviewUrl || formData.shopLogo, 'Shop Logo Inspection')}
                      className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity cursor-pointer"
                      title="Zoom logo"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Image className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Paste image URL or select file below"
                      value={pendingLogoFile ? pendingLogoFile.name : formData.shopLogo}
                      onChange={(e) => {
                        if (logoPreviewUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(logoPreviewUrl);
                          setLogoPreviewUrl('');
                        }
                        setPendingLogoFile(null);
                        setFormData({ ...formData, shopLogo: e.target.value, shopLogoStoragePath: '' });
                        if (errors.shopLogo) setErrors((prev) => ({ ...prev, shopLogo: '' }));
                      }}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  {errors.shopLogo && <p className="text-xs text-rose-600 font-medium">{errors.shopLogo}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold rounded-lg border border-sky-200 transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{pendingLogoFile ? 'Change Logo File' : 'Choose Logo File'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleLogoUpload}
                        disabled={isSubmitting}
                        className="hidden"
                      />
                    </label>
                    {pendingLogoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          if (logoPreviewUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(logoPreviewUrl);
                          }
                          setLogoPreviewUrl('');
                          setPendingLogoFile(null);
                        }}
                        className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Workshop / Store Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Door/Unit number, street, landmark, and town"
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                }}
                className={`w-full px-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                  errors.address
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-300 focus:border-sky-600 focus:ring-sky-500/15'
                }`}
              />
              {errors.address && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.address}</p>}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-70 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 btn-cartoon-pop"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Seller Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Seller Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have a registered shop?{' '}
              <button
                type="button"
                onClick={() => navigateTo('seller-login')}
                className="font-semibold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer"
              >
                Sign In with Shop Code
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
