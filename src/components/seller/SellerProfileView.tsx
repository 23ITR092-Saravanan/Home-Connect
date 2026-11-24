import React, { useState, useEffect } from 'react';
import { Store, Phone, Mail, MapPin, Star, CheckCircle2, Edit3, ShieldCheck, ZoomIn, Upload, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AVAILABLE_DISTRICTS } from '../../data/mockData';
import { ReviewList } from '../reviews/ReviewList';
import { StorageImage } from '../common/StorageImage';
import { StorageService } from '../../services/storageService';
import { EMAIL_REGEX, PHONE_REGEX, PINCODE_REGEX } from '../../services/validationService';

export const SellerProfileView: React.FC = () => {
  const { activeSeller, updateSellerProfile, openZoom, reviews, addToast } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    username: activeSeller?.username || '',
    emailId: activeSeller?.emailId || '',
    contactNumber: activeSeller?.contactNumber || '',
    district: activeSeller?.district || 'Coimbatore',
    pincode: activeSeller?.pincode || '',
    address: activeSeller?.address || '',
    shopLogo: activeSeller?.shopLogo || '',
    shopLogoStoragePath: activeSeller?.shopLogoStoragePath || '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (activeSeller && !isEditing) {
      setFormData({
        username: activeSeller.username,
        emailId: activeSeller.emailId,
        contactNumber: activeSeller.contactNumber,
        district: activeSeller.district,
        pincode: activeSeller.pincode,
        address: activeSeller.address,
        shopLogo: activeSeller.shopLogo || '',
        shopLogoStoragePath: activeSeller.shopLogoStoragePath || '',
      });
    }
  }, [activeSeller, isEditing]);

  // Seller's reviews
  const sellerReviews = reviews.filter(
    (r) => r.sellerShopCode.toUpperCase() === activeSeller?.shopCode.toUpperCase()
  );

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSeller) return;

    setIsUploadingLogo(true);
    try {
      const oldStoragePath = formData.shopLogoStoragePath;
      const res = await StorageService.uploadImage('seller-logos', activeSeller.uid || activeSeller.shopCode, file);
      if (res.success && res.signedUrl) {
        setFormData((prev) => ({
          ...prev,
          shopLogo: res.signedUrl!,
          shopLogoStoragePath: res.storagePath || '',
        }));
        if (oldStoragePath && oldStoragePath !== res.storagePath) {
          StorageService.deleteImage(oldStoragePath).catch(() => {});
        }
        addToast('Shop logo uploaded to Supabase Storage!', 'success');
      } else {
        addToast(res.error || 'Failed to upload shop logo', 'error');
      }
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.emailId.trim() || !formData.contactNumber.trim() || !formData.address.trim() || !formData.pincode.trim()) {
      setError('Please fill in all required profile fields');
      return;
    }
    if (!EMAIL_REGEX.test(formData.emailId.trim())) {
      setError('Enter a valid email address');
      return;
    }
    if (!PHONE_REGEX.test(formData.contactNumber.replace(/[\s-]/g, ''))) {
      setError('Enter a valid 10-digit contact number');
      return;
    }
    if (!PINCODE_REGEX.test(formData.pincode.trim())) {
      setError('Enter a valid 6-digit postal pincode');
      return;
    }
    if (formData.shopLogo.trim().toLowerCase().startsWith('data:')) {
      setError('Base64 Data URLs are not supported for shop logos; upload a photo or paste an HTTPS URL');
      return;
    }

    updateSellerProfile({
      ...formData,
      shopLogo: formData.shopLogo.trim() || undefined,
      shopLogoStoragePath: formData.shopLogoStoragePath.trim() || undefined,
    });
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-9">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Shop Logo with Zoom */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                {activeSeller?.shopLogo ? (
                  <StorageImage
                    src={activeSeller.shopLogo}
                    storagePath={activeSeller.shopLogoStoragePath}
                    alt={activeSeller.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-8 h-8 text-sky-600" />
                )}
              </div>
              {activeSeller?.shopLogo && (
                <button
                  type="button"
                  onClick={() =>
                    openZoom(
                      activeSeller.shopLogo!,
                      `${activeSeller.username} Shop Logo`,
                      activeSeller.shopLogoStoragePath
                    )
                  }
                  className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity cursor-pointer"
                  title="Inspect Shop Logo"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{activeSeller?.username}</h2>
                <span className="text-2xs font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-sky-600" />
                  Verified Merchant
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Shop Code: <strong className="text-slate-800">{activeSeller?.shopCode}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Shop Details'}</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
            {error}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Owner / Shop Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-sky-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Email ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  value={formData.emailId}
                  onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-sky-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Contact Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-sky-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Shop Logo URL or Upload
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.shopLogo}
                    onChange={(e) => setFormData({ ...formData, shopLogo: e.target.value, shopLogoStoragePath: '' })}
                    placeholder="Paste image URL or upload file below"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-sky-600"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold rounded-lg border border-sky-200 transition-colors cursor-pointer">
                    {isUploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingLogo ? 'Uploading...' : 'Upload Logo to Supabase Storage'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  District <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-sky-600"
                >
                  {AVAILABLE_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Pincode <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-sky-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Workshop / Store Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-sky-600"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Shop Profile</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                <span className="text-2xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Customer Rating
                </span>
                <div className="flex items-center gap-1 mt-1 text-slate-900 font-bold font-mono">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{activeSeller?.rating ?? 5.0} / 5.0</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                <span className="text-2xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Total Reviews
                </span>
                <div className="mt-1 text-slate-900 font-bold font-mono">
                  {sellerReviews.length} {sellerReviews.length === 1 ? 'review' : 'reviews'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                <span className="text-2xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Regional District
                </span>
                <div className="mt-1 text-slate-900 font-bold truncate">
                  {activeSeller?.district}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                <span className="text-2xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Fulfillment Mode
                </span>
                <div className="mt-1 text-slate-900 font-bold">
                  COD & Online
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                  Contact Details
                </span>
                <div className="space-y-1 text-slate-900 font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeSeller?.contactNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeSeller?.emailId}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                  Location & Postal Code
                </span>
                <div className="space-y-1 text-slate-900 font-medium">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p>{activeSeller?.address}</p>
                      <p className="text-slate-500 font-mono">{activeSeller?.district} - {activeSeller?.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registered Categories */}
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-2">
                Registered Product Categories
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {activeSeller?.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Reviews for this shop */}
      <ReviewList
        reviews={sellerReviews}
        title={`Customer Reviews for ${activeSeller?.shopCode}`}
        subtitle={`Ratings and feedback submitted by buyers who ordered from this seller`}
      />
    </div>
  );
};
