import React from 'react';
import {
  Store,
  ShoppingBag,
  Sparkles,
  MapPin,
  ArrowRight,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface StartScreenProps {
  onSelectRole: (role: 'seller' | 'buyer', mode: 'login' | 'register') => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-amber-50/30 to-stone-100 text-stone-800 flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      {/* Top Header / Brand */}
      <header className="border-b border-stone-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-stone-900 flex items-center gap-1.5">
                HomeCraft <span className="text-amber-600">Connect</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-stone-500">
                Local Home-Based Marketplace
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-stone-600 bg-stone-100 px-3.5 py-1.5 rounded-full border border-stone-200">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            Hyperlocal Commerce Platform
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-5 shadow-xs border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Neighborhood Artisans & Conscious Buyers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-950 tracking-tight leading-[1.15]">
            Handcrafted with Love,{' '}
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Discovered Locally.
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
            HomeCraft Connect bridges home-based bakers, crafters, and local producers directly with buyers in their community. Choose how you want to get started:
          </p>
        </div>

        {/* Two Options: Product Seller & Product Buyer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto w-full">
          {/* Card 1: Product Seller */}
          <div className="group relative bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xl shadow-amber-950/5 hover:shadow-2xl hover:shadow-amber-600/10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-amber-500/10 to-orange-500/0 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform duration-300">
                  <Store className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                  For Creators
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-2">
                Product Seller
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-8">
                List your creations and manage orders from nearby buyers.
              </p>
            </div>

            {/* Action Buttons: Create Account & Login */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <button
                onClick={() => onSelectRole('seller', 'register')}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:from-amber-800 active:to-orange-800 text-white font-semibold shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2 text-sm group-hover:shadow-amber-600/30"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Seller Account</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onSelectRole('seller', 'login')}
                className="w-full py-3 px-5 rounded-2xl bg-amber-50/80 hover:bg-amber-100/90 text-amber-900 font-semibold border border-amber-200/80 transition flex items-center justify-center gap-2 text-sm"
              >
                <LogIn className="w-4 h-4 text-amber-700" />
                <span>Seller Login</span>
                <span className="text-xs text-amber-700/80 font-normal">(with Seller Code)</span>
              </button>
            </div>
          </div>

          {/* Card 2: Product Buyer */}
          <div className="group relative bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-xl shadow-emerald-950/5 hover:shadow-2xl hover:shadow-emerald-600/10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-emerald-500/10 to-teal-500/0 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-300">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  For Shoppers
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-2">
                Product Buyer
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-8">
                Discover and order handcrafted goods from local sellers.
              </p>
            </div>

            {/* Action Buttons: Create Account & Login */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <button
                onClick={() => onSelectRole('buyer', 'register')}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 text-white font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm group-hover:shadow-emerald-600/30"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Buyer Account</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onSelectRole('buyer', 'login')}
                className="w-full py-3 px-5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-900 font-semibold border border-emerald-200/80 transition flex items-center justify-center gap-2 text-sm"
              >
                <LogIn className="w-4 h-4 text-emerald-700" />
                <span>Buyer Login</span>
                <span className="text-xs text-emerald-700/80 font-normal">(with Username)</span>
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/60 bg-white/50 py-6 text-center text-xs text-stone-500">
        <p>HomeCraft Connect &copy; {new Date().getFullYear()} &bull; Connecting local home-based sellers and artisans with neighborhood buyers.</p>
      </footer>
    </div>
  );
};
