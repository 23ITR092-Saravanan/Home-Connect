import React from 'react';
import { ShoppingBag, Store, UserPlus, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APP_IMAGES } from '../../assets/cartoonAssets';

export const HomePage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="space-y-12 pb-20">
      {/* Clean & Simple Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 border-b border-stone-200/80 bg-gradient-to-b from-stone-50 via-white to-stone-50/60">
        <div className="absolute inset-0 pattern-dots pointer-events-none opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Simple Title & Welcome */}
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              <span className="inline-block text-xs font-semibold tracking-wider text-amber-800 uppercase bg-amber-100/80 border border-amber-200 px-3 py-1 rounded-full">
                Local Home Marketplace
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
                Home Connect
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-medium">
                Buy and sell homemade goods, crafts, and regional specialties directly with your neighborhood.
              </p>
            </div>

            {/* Right Column: Creative Cartoon Illustration (Main Hero Image) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative rounded-3xl overflow-hidden shadow-lg border border-amber-100/80 bg-white max-w-lg w-full group card-hover-lift">
                <img
                  src={APP_IMAGES.cartoonMarketplaceHero}
                  alt="Home Connect Marketplace Illustration"
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-102"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Horizontal Rectangular Cards: Customer Portal & Merchant Hub */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Customer Portal Box */}
          <div className="bg-gradient-to-br from-white via-amber-50/40 to-orange-50/60 rounded-3xl border-2 border-amber-200/90 shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between group card-hover-lift">
            <div className="space-y-5">
              {/* Buyer Cartoon Image Matching Main Hero Scene */}
              <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden shadow-md border-2 border-white bg-amber-100/50">
                <img
                  src={APP_IMAGES.buyerCartoonScene}
                  alt="Customer Portal Cartoon Illustration"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 backdrop-blur-xs rounded-full text-xs font-bold text-amber-900 border border-amber-200/80 shadow-2xs">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Customer Portal</span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Buyer
                </h2>
              </div>
            </div>

            {/* Actions for Buyer */}
            <div className="mt-8 pt-6 border-t border-amber-200/70 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigateTo('buyer-register')}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer btn-cartoon-pop"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New Account</span>
              </button>
              <button
                onClick={() => navigateTo('buyer-login')}
                className="py-3 px-6 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-sm rounded-xl transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer btn-cartoon-pop"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>
          </div>

          {/* Card 2: Merchant Hub Box */}
          <div className="bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/60 rounded-3xl border-2 border-sky-200/90 shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between group card-hover-lift">
            <div className="space-y-5">
              {/* Seller Cartoon Image Matching Main Hero Scene */}
              <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden shadow-md border-2 border-white bg-sky-100/50">
                <img
                  src={APP_IMAGES.sellerCartoonScene}
                  alt="Merchant Hub Cartoon Illustration"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 backdrop-blur-xs rounded-full text-xs font-bold text-sky-900 border border-sky-200/80 shadow-2xs">
                  <Store className="w-3.5 h-3.5 text-sky-600" />
                  <span>Merchant Hub</span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Seller
                </h2>
              </div>
            </div>

            {/* Actions for Seller */}
            <div className="mt-8 pt-6 border-t border-sky-200/70 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigateTo('seller-register')}
                className="flex-1 py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer btn-cartoon-pop"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New Account</span>
              </button>
              <button
                onClick={() => navigateTo('seller-login')}
                className="py-3 px-6 bg-white hover:bg-sky-50 text-sky-900 border border-sky-200 font-semibold text-sm rounded-xl transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer btn-cartoon-pop"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
