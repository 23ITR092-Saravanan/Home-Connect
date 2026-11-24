import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Home, CheckCircle2, Edit3, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AVAILABLE_DISTRICTS } from '../../data/mockData';
import { PHONE_REGEX } from '../../services/validationService';

export const BuyerProfileView: React.FC = () => {
  const { activeBuyer, updateBuyerProfile } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: activeBuyer?.username || '',
    contactNumber: activeBuyer?.contactNumber || '',
    district: activeBuyer?.district || 'Coimbatore',
    deliveryAddress: activeBuyer?.deliveryAddress || '',
    pincode: activeBuyer?.pincode || '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (activeBuyer && !isEditing) {
      setFormData({
        username: activeBuyer.username,
        contactNumber: activeBuyer.contactNumber,
        district: activeBuyer.district,
        deliveryAddress: activeBuyer.deliveryAddress,
        pincode: activeBuyer.pincode,
      });
    }
  }, [activeBuyer, isEditing]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactNumber.trim() || !formData.deliveryAddress.trim() || !formData.pincode.trim()) {
      setError('Please fill in all required profile fields');
      return;
    }
    if (!PHONE_REGEX.test(formData.contactNumber.replace(/[\s-]/g, ''))) {
      setError('Enter a valid 10-digit contact mobile number');
      return;
    }
    if (formData.deliveryAddress.trim().length < 5) {
      setError('Delivery address must be at least 5 characters');
      return;
    }
    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      setError('Enter a valid 6-digit postal pincode');
      return;
    }

    updateBuyerProfile({
      contactNumber: formData.contactNumber.trim(),
      district: formData.district,
      deliveryAddress: formData.deliveryAddress.trim(),
      pincode: formData.pincode.trim(),
    });
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-9 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Buyer Profile</h2>
            <p className="text-xs text-slate-500">Manage your delivery address and contact information</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              disabled
              className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-xl cursor-not-allowed"
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                District <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
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
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Delivery Address <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center">
                {activeBuyer?.username.slice(0, 2).toUpperCase() || 'BY'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeBuyer?.username}</h3>
                <span className="text-xs text-slate-500">Verified Marketplace Buyer</span>
              </div>
            </div>
            <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Active Account
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 uppercase tracking-wider font-semibold block mb-1">Contact Phone</span>
              <div className="flex items-center gap-2 text-slate-900 font-medium">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{activeBuyer?.contactNumber}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 uppercase tracking-wider font-semibold block mb-1">District & Pincode</span>
              <div className="flex items-center gap-2 text-slate-900 font-medium">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{activeBuyer?.district} - {activeBuyer?.pincode}</span>
              </div>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-xl border border-slate-100 bg-white">
              <span className="text-slate-400 uppercase tracking-wider font-semibold block mb-1">Delivery Address</span>
              <div className="flex items-start gap-2 text-slate-900 font-medium">
                <Home className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{activeBuyer?.deliveryAddress}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
