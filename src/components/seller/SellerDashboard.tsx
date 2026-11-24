import React from 'react';
import {
  PackagePlus,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Sparkles,
  Store,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp, SellerTab } from '../../context/AppContext';
import { PublishProductForm } from './PublishProductForm';
import { MyProductsList } from './MyProductsList';
import { CustomerRequestsMarket } from './CustomerRequestsMarket';
import { SellerProfileView } from './SellerProfileView';
import { RequestOrderList } from '../orders/RequestOrderList';
import { APP_IMAGES } from '../../assets/cartoonAssets';

export const SellerDashboard: React.FC = () => {
  const { sellerActiveTab, setSellerActiveTab, requests, activeSeller, navigateTo } = useApp();

  // If no seller account is active, display a clean sign-in prompt
  if (!activeSeller) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-page-enter">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-200/50 p-8 sm:p-10">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-md border-2 border-sky-200/80 mx-auto mb-5 animate-float-slow">
            <img
              src={APP_IMAGES.sellerCartoon}
              alt="Seller Artisan Cartoon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 mb-2">
            <Store className="w-3.5 h-3.5 text-sky-600" />
            <span>Seller Portal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign In to Your Shop</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Please sign in with your unique Shop Code or register your home workshop to manage your products and orders.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => navigateTo('seller-login')}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 btn-cartoon-pop"
            >
              <span>Seller Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo('seller-register')}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer btn-cartoon-pop"
            >
              Register New Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Requests counts for badges (aligned with RequestOrderList independent completion rules)
  const myRequests = requests.filter(
    (r) =>
      r.sellerShopCode.toUpperCase() === activeSeller.shopCode.toUpperCase() ||
      r.sellerShopCode === 'OPEN-MARKET'
  );
  const pendingCount = myRequests.filter((r) => r.status === 'pending').length;
  const acceptedCount = myRequests.filter((r) => r.status === 'accepted' && !r.sellerCompleted).length;
  const rejectedCount = myRequests.filter((r) => r.status === 'rejected').length;
  const completedCount = myRequests.filter((r) => r.sellerCompleted === true || r.status === 'completed').length;

  const tabs: { id: SellerTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'my-products', label: 'My Products', icon: <Package className="w-4 h-4" /> },
    { id: 'publish', label: 'Publish New Product', icon: <PackagePlus className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending Requests', icon: <Clock className="w-4 h-4" />, badge: pendingCount },
    { id: 'accepted', label: 'Accepted Requests', icon: <CheckCircle2 className="w-4 h-4" />, badge: acceptedCount },
    { id: 'rejected', label: 'Rejected Requests', icon: <XCircle className="w-4 h-4" />, badge: rejectedCount },
    { id: 'completed', label: 'Completed Orders', icon: <PackageCheck className="w-4 h-4" />, badge: completedCount },
    { id: 'customer-requests', label: 'Customer Requests', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'profile', label: 'Seller Profile', icon: <Store className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-page-enter">
      {/* Dashboard Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-sky-400/60 shadow-lg shrink-0">
              <img
                src={APP_IMAGES.sellerCartoon}
                alt="Seller Artisan"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-2xs font-semibold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-400/20">
                <Store className="w-3 h-3" />
                <span>Seller Management Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {activeSeller.username}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Shop Code: <strong className="text-white font-mono bg-white/10 px-2 py-0.5 rounded-md">{activeSeller.shopCode}</strong> · {activeSeller.district} Regional Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSellerActiveTab('publish')}
              className="px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 cursor-pointer btn-cartoon-pop"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Publish Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Horizontal Tab Bar */}
      <div className="border-b border-stone-200 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = sellerActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSellerActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-sky-50 text-sky-950 border border-sky-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-2xs font-mono rounded-full font-bold ${
                      isActive ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
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
        {sellerActiveTab === 'publish' && <PublishProductForm />}

        {sellerActiveTab === 'my-products' && <MyProductsList />}

        {sellerActiveTab === 'pending' && (
          <RequestOrderList
            viewMode="seller"
            filterStatus="pending"
            title="Pending Customer Requests"
            description="Review incoming orders awaiting your approval or confirmation"
          />
        )}

        {sellerActiveTab === 'accepted' && (
          <RequestOrderList
            viewMode="seller"
            filterStatus="accepted"
            title="Accepted Requests & Work In Progress"
            description="Orders you are preparing for fulfillment and home delivery"
          />
        )}

        {sellerActiveTab === 'rejected' && (
          <RequestOrderList
            viewMode="seller"
            filterStatus="rejected"
            title="Rejected Requests Archive"
            description="Requests declined with feedback notes provided to buyers"
          />
        )}

        {sellerActiveTab === 'completed' && (
          <RequestOrderList
            viewMode="seller"
            filterStatus="completed"
            title="Completed Orders"
            description="Orders fulfilled and confirmed by your workshop"
          />
        )}

        {sellerActiveTab === 'customer-requests' && <CustomerRequestsMarket />}

        {sellerActiveTab === 'profile' && <SellerProfileView />}
      </div>
    </div>
  );
};
