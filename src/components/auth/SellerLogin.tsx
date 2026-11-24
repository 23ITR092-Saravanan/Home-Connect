import React, { useState } from 'react';
import { Store, ArrowLeft, LogIn, Building, Lock, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APP_IMAGES } from '../../assets/cartoonAssets';

export const SellerLogin: React.FC = () => {
  const { loginSeller, navigateTo } = useApp();
  const [shopCode, setShopCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopCode.trim()) {
      setError('Please enter your unique Shop Code');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await loginSeller(shopCode, password);
      if (!success) {
        setError('Invalid Shop Code or password. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6 pattern-dots">
      <div className="max-w-3xl w-full">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-800 mb-6 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-3xl border border-sky-200/80 shadow-xl shadow-sky-600/5 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Visual Cartoon Column */}
          <div className="md:col-span-5 bg-gradient-to-br from-sky-50 via-indigo-50 to-sky-100/60 p-6 sm:p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-sky-100">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-md border-2 border-white mb-4 animate-float-slow">
              <img
                src={APP_IMAGES.sellerCartoon}
                alt="Seller Artisan Cartoon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 rounded-full text-xs font-semibold text-sky-900 border border-sky-200/70 shadow-2xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Verified Artisan</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Maker Studio</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">
              Fulfill customer orders, manage listings, and showcase your handmade craft.
            </p>
          </div>

          {/* Form Column */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md mb-2">
                <Store className="w-3.5 h-3.5 text-sky-600" />
                Seller Portal
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Seller Login</h1>
              <p className="text-xs text-slate-500 mt-1">Access your seller dashboard with your Shop Code</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Shop Code <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. SHOP-101"
                    value={shopCode}
                    onChange={(e) => {
                      setShopCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-500/15 uppercase transition-all"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-500/15 transition-all"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-70 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer btn-cartoon-pop mt-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login as Seller</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                New merchant on Home Connect?{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('seller-register')}
                  className="font-semibold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer"
                >
                  Register Your Shop
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
