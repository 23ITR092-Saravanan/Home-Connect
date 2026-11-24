import React from 'react';
import { Home, ShoppingBag, Store, User, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const {
    currentView,
    currentUserRole,
    activeBuyer,
    activeSeller,
    navigateTo,
    logout,
  } = useApp();

  const isHome = currentView === 'home';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo & Wordmark */}
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-3 text-left group cursor-pointer shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-amber-600/20 group-hover:scale-105 transition-transform duration-200">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
              Home Connect
            </span>
            <span className="block text-2xs font-medium text-slate-400 tracking-wide uppercase">
              Local Makers & Artisans
            </span>
          </div>
        </button>

        {/* Center Navigation Links - Removed on Home Page as requested */}
        {!isHome && (
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => navigateTo('home')}
              className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-all cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => navigateTo('buyer-dashboard', 'search')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                currentView === 'buyer-dashboard'
                  ? 'text-amber-700 bg-amber-50/80 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Browse Products
            </button>
            <button
              onClick={() => navigateTo('buyer-dashboard', 'custom-request')}
              className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-all cursor-pointer"
            >
              Custom Orders
            </button>
            <button
              onClick={() => navigateTo('seller-dashboard', 'my-products')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                currentView === 'seller-dashboard'
                  ? 'text-sky-700 bg-sky-50/80 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Seller Hub
            </button>
            <button
              onClick={() => navigateTo('seller-dashboard', 'customer-requests')}
              className="px-3.5 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-all cursor-pointer"
            >
              Customer Requests
            </button>
          </nav>
        )}

        {/* Right Action & User Profile Section */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentUserRole === 'seller' && activeSeller ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('seller-dashboard', 'my-products')}
                className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 bg-sky-50/90 border border-sky-200/80 rounded-xl text-sky-900 hover:bg-sky-100/80 transition-colors cursor-pointer text-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold leading-none">{activeSeller.username}</div>
                  <div className="text-2xs font-mono text-sky-600">{activeSeller.shopCode}</div>
                </div>
              </button>
              <button
                onClick={() => navigateTo('seller-dashboard', 'publish')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Publish</span>
              </button>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : currentUserRole === 'buyer' && activeBuyer ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('buyer-dashboard', 'search')}
                className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-amber-900 hover:bg-amber-100/80 transition-colors cursor-pointer text-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold leading-none">{activeBuyer.username}</div>
                  <div className="text-2xs text-amber-700">{activeBuyer.district}</div>
                </div>
              </button>
              <button
                onClick={() => navigateTo('buyer-dashboard', 'search')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop</span>
              </button>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : isHome ? (
            /* Clean Minimal Top on Home Page: All 6 requested items removed */
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-900 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Neighborhood Marketplace Active
              </span>
            </div>
          ) : (
            /* On sub-pages when guest, allow returning home */
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('home')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
