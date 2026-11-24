import React, { useState } from 'react';
import { ShoppingBag, ArrowLeft, LogIn, User, Lock, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APP_IMAGES } from '../../assets/cartoonAssets';

export const BuyerLogin: React.FC = () => {
  const { loginBuyer, navigateTo } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your buyer username');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await loginBuyer(username, password);
      if (!success) {
        setError('Invalid username or password. Please verify your credentials.');
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
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-amber-800 mb-6 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xl shadow-amber-500/5 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Visual Cartoon Column */}
          <div className="md:col-span-5 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 p-6 sm:p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-amber-100">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-md border-2 border-white mb-4 animate-float-slow">
              <img
                src={APP_IMAGES.buyerCartoon}
                alt="Buyer Cartoon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 rounded-full text-xs font-semibold text-amber-900 border border-amber-200/70 shadow-2xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Conscious Shopper</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Fresh & Handmade</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">
              Order directly from authentic home craft makers in your district.
            </p>
          </div>

          {/* Form Column */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md mb-2">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                Buyer Portal
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
              <p className="text-xs text-slate-500 mt-1">Sign in with your registered username</p>
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
                  Username <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your registered username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:ring-3 focus:ring-amber-500/15 transition-all"
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:ring-3 focus:ring-amber-500/15 transition-all"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-70 text-white font-semibold text-sm rounded-xl shadow-md shadow-amber-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer btn-cartoon-pop mt-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login as Buyer</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Don't have a buyer account yet?{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('buyer-register')}
                  className="font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                >
                  Create New Account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
