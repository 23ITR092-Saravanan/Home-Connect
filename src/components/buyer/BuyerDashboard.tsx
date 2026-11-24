import React from 'react';
import {
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  PackageCheck,
  User,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { useApp, BuyerTab } from '../../context/AppContext';
import { ProductSearchCatalog } from './ProductSearchCatalog';
import { CustomProductRequestForm } from './CustomProductRequestForm';
import { BuyerProfileView } from './BuyerProfileView';
import { RequestOrderList } from '../orders/RequestOrderList';
import { APP_IMAGES } from '../../assets/cartoonAssets';

export const BuyerDashboard: React.FC = () => {
  const { buyerActiveTab, setBuyerActiveTab, requests, activeBuyer, navigateTo } = useApp();

  // If no buyer account is active, display a clean sign-in prompt
  if (!activeBuyer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-page-enter">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-200/50 p-8 sm:p-10">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-md border-2 border-amber-200/80 mx-auto mb-5 animate-float-slow">
            <img
              src={APP_IMAGES.buyerCartoon}
              alt="Buyer Cartoon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
            <span>Buyer Portal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign In to Continue</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Please sign in to your buyer account or register to browse local products, submit custom orders, and track deliveries.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => navigateTo('buyer-login')}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 btn-cartoon-pop"
            >
              <span>Buyer Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo('buyer-register')}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer btn-cartoon-pop"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Requests counts for buyer (aligned with RequestOrderList independent completion rules)
  const myRequests = requests.filter(
    (r) => r.buyerUsername.toLowerCase() === activeBuyer.username.toLowerCase()
  );
  const pendingCount = myRequests.filter((r) => r.status === 'pending').length;
  const acceptedCount = myRequests.filter((r) => r.status === 'accepted' && !r.buyerCompleted).length;
  const completedCount = myRequests.filter((r) => r.buyerCompleted === true || r.status === 'completed').length;

  const tabs: { id: BuyerTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'search', label: 'Search for New Products', icon: <Search className="w-4 h-4" /> },
    { id: 'custom-request', label: 'Request Customized Product', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'pending', label: 'My Pending Requests', icon: <Clock className="w-4 h-4" />, badge: pendingCount },
    { id: 'accepted', label: 'My Accepted Requests', icon: <CheckCircle2 className="w-4 h-4" />, badge: acceptedCount },
    { id: 'completed', label: 'My Completed Orders', icon: <PackageCheck className="w-4 h-4" />, badge: completedCount },
    { id: 'profile', label: 'Buyer Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-page-enter">
      {/* Dashboard Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-stone-900 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-300/60 shadow-lg shrink-0">
              <img
                src={APP_IMAGES.buyerCartoon}
                alt="Buyer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-2xs font-semibold text-amber-300 uppercase tracking-wider bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                <ShoppingBag className="w-3 h-3" />
                <span>Buyer Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hello, {activeBuyer.username}!
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/90">
                Delivering to: <strong className="text-white bg-white/10 px-2 py-0.5 rounded-md">{activeBuyer.district} ({activeBuyer.pincode})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setBuyerActiveTab('custom-request')}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer btn-cartoon-pop"
            >
              <Sparkles className="w-4 h-4" />
              <span>Request Custom Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Horizontal Tab Bar */}
      <div className="border-b border-stone-200 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = buyerActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setBuyerActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-50 text-amber-950 border border-amber-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-2xs font-mono rounded-full font-bold ${
                      isActive ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab View Routing */}
      <div className="min-h-[450px]">
        {buyerActiveTab === 'search' && <ProductSearchCatalog />}

        {buyerActiveTab === 'custom-request' && <CustomProductRequestForm />}

        {buyerActiveTab === 'pending' && (
          <RequestOrderList
            viewMode="buyer"
            filterStatus="pending"
            title="My Pending Requests"
            description="Items requested from local sellers awaiting review or quotation"
          />
        )}

        {buyerActiveTab === 'accepted' && (
          <RequestOrderList
            viewMode="buyer"
            filterStatus="accepted"
            title="My Accepted Requests"
            description="Requests accepted by artisans and currently being prepared for delivery"
          />
        )}

        {buyerActiveTab === 'completed' && (
          <RequestOrderList
            viewMode="buyer"
            filterStatus="completed"
            title="My Completed Orders"
            description="Delivered orders. Share your feedback by adding a rating and review!"
          />
        )}

        {buyerActiveTab === 'profile' && <BuyerProfileView />}
      </div>
    </div>
  );
};
