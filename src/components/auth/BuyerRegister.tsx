import React, { useState } from 'react';
import { ShoppingBag, ArrowLeft, CheckCircle2, User, Lock, Phone, MapPin, Home, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AVAILABLE_DISTRICTS } from '../../data/mockData';
import { APP_IMAGES } from '../../assets/cartoonAssets';
import { PHONE_REGEX } from '../../services/validationService';

export const BuyerRegister: React.FC = () => {
  const { registerBuyer, navigateTo } = useApp();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    contactNumber: '',
    district: '',
    deliveryAddress: '',
    pincode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.username.trim()) errs.username = 'Username is required';
    else if (formData.username.trim().length < 3) errs.username = 'Username must be at least 3 characters';
    if (!formData.password.trim()) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!formData.contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    else if (!PHONE_REGEX.test(formData.contactNumber.replace(/[\s-]/g, ''))) {
      errs.contactNumber = 'Enter a valid 10-digit mobile number';
    }
    if (!formData.district.trim()) errs.district = 'Please select your delivery district';
    if (!formData.deliveryAddress.trim()) errs.deliveryAddress = 'Delivery address is required';
    else if (formData.deliveryAddress.trim().length < 5) errs.deliveryAddress = 'Delivery address is too short';
    if (!formData.pincode.trim()) errs.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode.trim())) errs.pincode = 'Enter a valid 6-digit postal pincode';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await registerBuyer({
        username: formData.username.trim(),
        password: formData.password,
        contactNumber: formData.contactNumber.trim(),
        district: formData.district,
        deliveryAddress: formData.deliveryAddress.trim(),
        pincode: formData.pincode.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 pattern-dots">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-200/50 overflow-hidden p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 pb-6 border-b border-stone-100">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-amber-200/80 shrink-0 animate-float-slow">
              <img
                src={APP_IMAGES.buyerCartoon}
                alt="Buyer Cartoon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/60 mb-1.5">
                <ShoppingBag className="w-3 h-3 text-amber-600" />
                <span>Buyer Account</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buyer Registration</h1>
              <p className="text-xs text-slate-500 mt-1">Create an account to browse and order from local home makers</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Username <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Enter a unique username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                  }}
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                    errors.username
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
                  }`}
                />
              </div>
              {errors.username && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.username}</p>}
            </div>

            {/* Password */}
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
                      : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
                  }`}
                />
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.password}</p>}
            </div>

            {/* Contact Number */}
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
                  placeholder="10-digit mobile number"
                  value={formData.contactNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, contactNumber: e.target.value });
                    if (errors.contactNumber) setErrors((prev) => ({ ...prev, contactNumber: '' }));
                  }}
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                    errors.contactNumber
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
                  }`}
                />
              </div>
              {errors.contactNumber && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.contactNumber}</p>}
            </div>

            {/* District & Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                        : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
                    }`}
                  >
                    <option value="">Select your District</option>
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
                  maxLength={6}
                  placeholder="6-digit postal code"
                  value={formData.pincode}
                  onChange={(e) => {
                    setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') });
                    if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                  }}
                  className={`w-full px-3.5 py-3 rounded-xl border text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                    errors.pincode
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
                  }`}
                />
                {errors.pincode && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.pincode}</p>}
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Delivery Address <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 pointer-events-none text-slate-400">
                  <Home className="w-4 h-4" />
                </div>
                <textarea
                  rows={3}
                  placeholder="Street name, building/house number, and landmark"
                  value={formData.deliveryAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, deliveryAddress: e.target.value });
                    if (errors.deliveryAddress) setErrors((prev) => ({ ...prev, deliveryAddress: '' }));
                  }}
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 transition-all ${
                    errors.deliveryAddress
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/15'
                  }`}
                />
              </div>
              {errors.deliveryAddress && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.deliveryAddress}</p>
              )}
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-70 text-white font-semibold text-sm rounded-xl shadow-md shadow-amber-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer btn-cartoon-pop"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Buyer Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Buyer Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have a buyer account?{' '}
              <button
                type="button"
                onClick={() => navigateTo('buyer-login')}
                className="font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
              >
                Sign In Instead
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
