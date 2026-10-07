import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Package,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  LogOut,
  AlertTriangle,
  User,
  MessageSquare,
  TrendingUp,
  Tag,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Star,
  Layers,
  CreditCard,
  Banknote,
  Send,
  Clock,
  CheckCheck,
  Lock,
  Unlock,
  Search,
  Image as ImageIcon,
  ArrowLeft,
} from 'lucide-react';
import {
  Order,
  OrderStatus,
  Product,
  ProductRequest,
  RequestStatus,
  Review,
  SellerProfile,
  PRESET_CATEGORIES,
} from '../../types/index.ts';
import {
  AuthService,
  OrderService,
  ProductRequestService,
  ProductService,
  ReviewService,
  getFirebaseErrorMessage,
} from '../../services/storage.ts';
import { useToast } from '../common/Toast.tsx';
import { AddEditProductModal } from './AddEditProductModal.tsx';
import { withTimeout } from '../../services/async.ts';
import { RequestStatusHistory } from '../common/RequestStatusHistory.tsx';
import { ImagePreviewModal } from '../common/ImagePreviewModal.tsx';

interface SellerDashboardProps {
  seller: SellerProfile;
  onLogout: () => void;
  onProfileUpdated: (updated: SellerProfile) => void;
}

type TabType =
  | 'profile'
  | 'add_product'
  | 'my_products'
  | 'requests'
  | 'orders'
  | 'completed_orders'
  | 'reviews';

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  seller,
  onLogout,
  onProfileUpdated,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const tabHistory = useRef<TabType[]>([]);

  const navigateToTab = (tab: TabType) => {
    if (tab !== activeTab) tabHistory.current.push(activeTab);
    setActiveTab(tab);
  };

  const handleBack = () => {
    if (isProductModalOpen) {
      setIsProductModalOpen(false);
      return;
    }
    setActiveTab(tabHistory.current.pop() || 'profile');
  };

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [communityRequests, setCommunityRequests] = useState<ProductRequest[]>([]);
  const [loadingCommunityRequests, setLoadingCommunityRequests] = useState(false);
  const [communityRequestSearchError, setCommunityRequestSearchError] = useState<string | null>(null);
  const [communityRequestsLoaded, setCommunityRequestsLoaded] = useState(false);
  const [requestPreviewImage, setRequestPreviewImage] = useState<string | null>(null);
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 });
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals & edits
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search New Product Requests (Allow search using: City, Category, Pincode. If any one of these is entered, show matching requests)
  const [searchReqCity, setSearchReqCity] = useState<string>('');
  const [searchReqCategory, setSearchReqCategory] = useState<string>('All Categories');
  const [searchReqPincode, setSearchReqPincode] = useState<string>('');
  const requestSearchFilters = useRef({ city: '', category: 'All Categories', pincode: '' });
  requestSearchFilters.current = {
    city: searchReqCity,
    category: searchReqCategory,
    pincode: searchReqPincode,
  };
  const [requestTabMode, setRequestTabMode] = useState<'community' | 'pending' | 'accepted' | 'declined'>('community');

  // Request sub-tab filter: Pending, Accepted, Declined
  const [requestStatusFilter, setRequestStatusFilter] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [respondingReqId, setRespondingReqId] = useState<string | null>(null);
  const [responseNoteInput, setResponseNoteInput] = useState<string>('');

  // Seller Order Cancellation Modal state
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState<string>('');

  // Profile Edit State
  const [editStoreName, setEditStoreName] = useState(seller.username);
  const [editContact, setEditContact] = useState(seller.contactNumber);
  const [editEmail, setEditEmail] = useState(seller.email);
  const [editCity, setEditCity] = useState(seller.city);
  const [editPincode, setEditPincode] = useState(seller.pincode);
  const [editAddress, setEditAddress] = useState(seller.address);
  const [editBio, setEditBio] = useState(seller.bio || '');
  const [editCategories, setEditCategories] = useState<string[]>(seller.categories || []);
  const [savingProfile, setSavingProfile] = useState(false);

  const refreshData = () => {
    const prods = ProductService.getProductsBySeller(seller.id);
    setProducts(prods);

    const actOrds = OrderService.getActiveOrdersBySeller(seller.id);
    setActiveOrders(actOrds);

    const compOrds = OrderService.getCompletedOrdersBySeller(seller.id);
    setCompletedOrders(compOrds);

    const revs = ReviewService.getReviewsBySeller(seller.id);
    setReviews(revs);

    const stats = ReviewService.getSellerRatingStats(seller.id);
    setRatingStats(stats);

    const reqs = ProductRequestService.getRequestsBySeller(seller.id);
    setRequests(reqs);

    const comm = ProductRequestService.searchRequestsForSellers({
      ...requestSearchFilters.current,
    });
    setCommunityRequests(comm);
  };

  useEffect(() => {
    refreshData();

    const handleStorageUpdate = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      refreshData();
      if (key === 'homecraft_requests_v1') {
        setCommunityRequestSearchError(null);
        setCommunityRequestsLoaded(true);
      }
    };

    window.addEventListener('homecraft_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('homecraft_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [seller.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(seller.sellerCode);
    setCopiedCode(true);
    showToast('success', 'Seller Code Copied!', `Unique code ${seller.sellerCode} copied to clipboard`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleToggleStock = (productId: string) => {
    ProductService.toggleStockStatus(productId, seller.id);
    refreshData();
    showToast('info', 'Stock Status Updated');
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await ProductService.deleteProduct(productId, seller.id);
      setDeleteConfirmId(null);
      refreshData();
      showToast('success', 'Product Removed');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove product';
      showToast('error', 'Error', message);
    }
  };

  const handleOrderStatusChange = (orderId: string, newStatus: OrderStatus) => {
    OrderService.updateOrderStatus(orderId, newStatus);
    refreshData();
    showToast('success', 'Order Updated', `Status changed to ${newStatus.toUpperCase()}`);
  };

  const handleConfirmCancelOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrderId) return;
    if (!cancellationReasonInput.trim()) {
      showToast('error', 'Reason Required', 'Please provide a cancellation reason for the buyer');
      return;
    }

    try {
      OrderService.cancelOrderWithReason(cancellingOrderId, cancellationReasonInput.trim(), 'seller');
      showToast('info', 'Order Cancelled', 'Order has been cancelled and reason sent to the buyer.');
      setCancellingOrderId(null);
      setCancellationReasonInput('');
      refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel order';
      showToast('error', 'Error', msg);
    }
  };

  const handleRequestStatusChange = async (requestId: string, newStatus: RequestStatus, note?: string) => {
    try {
      if (newStatus === 'accepted') {
        await ProductRequestService.acceptRequestBySeller(requestId, seller, note);
        showToast('success', 'Request Accepted!', 'Buyer details have now been unlocked and revealed.');
      } else {
        await ProductRequestService.updateRequestStatus(requestId, newStatus, note, seller);
        showToast('info', 'Request Rejected', 'Rejected status and history saved.');
      }
      setRespondingReqId(null);
      setResponseNoteInput('');
      refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update request';
      showToast('error', 'Error', msg);
    }
  };

  const runRequestSearch = async (filters: { city?: string; category?: string; pincode?: string }) => {
    setLoadingCommunityRequests(true);
    setCommunityRequestSearchError(null);
    setCommunityRequests(ProductRequestService.searchRequestsForSellers(filters));
    setRequestTabMode('community');
    try {
      await withTimeout(
        ProductRequestService.refreshFromFirebase(),
        2500,
        'Firebase request search is taking longer than 2.5 seconds. Retry shortly.'
      );
      const matchingRequests = ProductRequestService.searchRequestsForSellers(filters);
      setCommunityRequests(matchingRequests);
      setCommunityRequestsLoaded(true);
      showToast('info', 'Search Updated', `Found ${matchingRequests.length} matching custom request(s)`);
    } catch (error) {
      setCommunityRequestSearchError(getFirebaseErrorMessage(error));
      setCommunityRequestsLoaded(true);
    } finally {
      setLoadingCommunityRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests' && !communityRequestsLoaded) {
      void runRequestSearch({});
    }
  }, [activeTab, communityRequestsLoaded]);

  const handleExecuteReqSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchReqCity.trim() && searchReqCategory === 'All Categories' && !searchReqPincode.trim()) {
      showToast('error', 'Search Filter Required', 'Enter a city or pincode, or select a category.');
      return;
    }
    void runRequestSearch({
      city: searchReqCity,
      category: searchReqCategory,
      pincode: searchReqPincode,
    });
  };

  const handleClearReqSearch = () => {
    setSearchReqCity('');
    setSearchReqCategory('All Categories');
    setSearchReqPincode('');
    void runRequestSearch({});
  };

  const toggleCategory = (cat: string) => {
    setEditCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await AuthService.updateSellerProfile(seller.id, {
        username: editStoreName.trim(),
        contactNumber: editContact.trim(),
        email: editEmail.trim(),
        city: editCity.trim(),
        pincode: editPincode.trim(),
        address: editAddress.trim(),
        bio: editBio.trim(),
        categories: editCategories,
      });
      onProfileUpdated(updated);
      showToast('success', 'Profile Updated', 'Your seller details were updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      showToast('error', 'Error', msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const completedRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Left brand & badge */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl text-stone-900 tracking-tight">
                    HomeCraft <span className="text-amber-600">Connect</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    Seller Dashboard
                  </span>
                </div>
                <div className="text-xs text-stone-500 flex items-center gap-2">
                  <span>Store: <strong className="text-stone-800">{seller.username}</strong></span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    {seller.city} ({seller.pincode})
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Seller Code Pill & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                  Seller Code:
                </span>
                <span className="font-mono font-bold text-xs text-amber-950 bg-amber-200/60 px-2 py-0.5 rounded">
                  {seller.sellerCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-amber-800 hover:text-amber-950 p-1 hover:bg-amber-200/60 rounded transition"
                  title="Copy Seller Code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center text-stone-600 shrink-0">
                {seller.logo ? (
                  <img src={seller.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-4 h-4 text-amber-600" />
                )}
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-rose-700 hover:bg-rose-50 border border-stone-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs - Exactly the 7 requested sections */}
          <div className="flex gap-1.5 sm:gap-2 border-t border-stone-100 overflow-x-auto py-2.5 scrollbar-none">
            {/* 1. Profile */}
            <button
              onClick={() => navigateToTab('profile')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile
            </button>

            {/* 2. Add Product */}
            <button
              onClick={() => {
                setProductToEdit(null);
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80 transition whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-700" />
              Add Product
            </button>

            {/* 3. My Products */}
            <button
              onClick={() => navigateToTab('my_products')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'my_products'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              My Products ({products.length})
            </button>

            {/* 4. Product Requests */}
            <button
              onClick={() => navigateToTab('requests')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap relative ${
                activeTab === 'requests'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Product Requests ({requests.length})
              {requests.some((r) => r.status === 'pending') && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </button>

            {/* 5. Orders */}
            <button
              onClick={() => navigateToTab('orders')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap relative ${
                activeTab === 'orders'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Orders ({activeOrders.length})
              {activeOrders.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* 6. Completed Orders */}
            <button
              onClick={() => navigateToTab('completed_orders')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'completed_orders'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Completed Orders ({completedOrders.length})
            </button>

            {/* 7. Reviews */}
            <button
              onClick={() => navigateToTab('reviews')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Reviews ({reviews.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        {(activeTab !== 'profile' || tabHistory.current.length > 0) && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {/* ==================================================== */}
        {/* 1. SELLER PROFILE TAB (Publicly displays requested info) */}
        {/* ==================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Public Seller Showcase Card */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl border-2 border-amber-200 bg-amber-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {seller.logo ? (
                      <img src={seller.logo} alt={seller.username} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-10 h-10 text-amber-500" />
                    )}
                  </div>
                  <div>
                    {/* Publicly display: Username */}
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-stone-900">{seller.username}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Verified Seller
                      </span>
                    </div>

                    {/* Publicly display: Unique Seller Code */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-stone-500">Seller Code:</span>
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {seller.sellerCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="text-stone-400 hover:text-stone-700 p-0.5"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Publicly display: Rating / Reviews */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-stone-900 ml-1">
                          {ratingStats.count > 0 ? ratingStats.average : 'New Creator'}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400">&bull;</span>
                      <span className="text-xs font-medium text-stone-600">
                        {ratingStats.count > 0 ? `${ratingStats.count} customer review(s)` : 'No reviews yet'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2">
                  <button
                    onClick={() => {
                      setProductToEdit(null);
                      setIsProductModalOpen(true);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
              </div>

              {/* Public Display Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* Publicly display: Location */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
                  <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    Public Location
                  </div>
                  <p className="font-semibold text-stone-900 text-sm">
                    {seller.city}, {seller.pincode}
                  </p>
                  <p className="text-xs text-stone-600">{seller.address}</p>
                </div>

                {/* Publicly display: Contact & Email */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                  <div>
                    <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      Contact Number
                    </div>
                    <p className="font-semibold text-stone-900 text-sm">{seller.contactNumber}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      Email Address
                    </div>
                    <p className="font-semibold text-stone-900 text-sm">{seller.email}</p>
                  </div>
                </div>
              </div>

              {/* Publicly display: Product Categories */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Product Categories Offered ({seller.categories?.length || 0})
                </span>
                <div className="flex flex-wrap gap-2">
                  {seller.categories?.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {seller.bio && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 text-xs text-stone-700 leading-relaxed">
                  <strong className="block text-stone-900 mb-1">Artisan Bio:</strong>
                  {seller.bio}
                </div>
              )}
            </div>

            {/* Profile Editor Form */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-5">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
                Update Profile Information
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Username / Store Name</label>
                    <input
                      type="text"
                      value={editStoreName}
                      onChange={(e) => setEditStoreName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={editContact}
                      onChange={(e) => setEditContact(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Select Categories</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_CATEGORIES.map((cat) => {
                      const isSel = editCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition font-medium ${
                            isSel
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Store Bio / Description</label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Updates'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. MY PRODUCTS TAB */}
        {/* ==================================================== */}
        {activeTab === 'my_products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-900">My Listed Products</h2>
                <p className="text-xs text-stone-500">
                  Manage inventory, pricing, MOQ, and payment modes
                </p>
              </div>
              <button
                onClick={() => {
                  setProductToEdit(null);
                  setIsProductModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {/* Zero mock products check */}
            {products.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">No products listed yet</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  Click &ldquo;Add Product&rdquo; to publish your creations. No sample or mock products are loaded.
                </p>
                <button
                  onClick={() => {
                    setProductToEdit(null);
                    setIsProductModalOpen(true);
                  }}
                  className="mt-6 py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative h-44 bg-stone-100 overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs ${
                              product.inStock ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}
                          >
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
                            {product.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-5 space-y-2">
                        <h4 className="font-bold text-stone-900 text-base line-clamp-1">{product.title}</h4>
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">Individual Price</span>
                            <span className="text-base font-black text-amber-700">₹{product.price}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">Min Order Qty</span>
                            <span className="font-bold text-stone-800">{product.minOrderQuantity} unit(s)</span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[11px] text-stone-600 bg-stone-50 p-2 rounded-xl">
                          <span className="font-medium">Payment Mode:</span>
                          <span className="font-bold text-stone-800">{product.paymentMode}</span>
                        </div>

                        {product.additionalInfo && (
                          <p className="text-[11px] text-stone-500 italic line-clamp-1">
                            Note: {product.additionalInfo}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleStock(product.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition ${
                          product.inStock
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-200 text-stone-700 border-stone-300'
                        }`}
                      >
                        {product.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                      </button>

                      <div className="flex items-center gap-1">
                        {/* Allow sellers to edit their products */}
                        <button
                          onClick={() => {
                            setProductToEdit(product);
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-stone-200 rounded-lg transition"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. PRODUCT REQUESTS TAB (New Requests Search, Pending, Accepted, Declined) */}
        {/* ==================================================== */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Search New Product Requests Bar */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-amber-600" />
                    Search New Product Requests
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Discover custom requests from buyers. Search using City, Category, or Pincode. If any one is entered, matching requests will be shown.
                  </p>
                </div>
                {(searchReqCity || searchReqCategory !== 'All Categories' || searchReqPincode) && (
                  <button
                    type="button"
                    onClick={handleClearReqSearch}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 underline self-start sm:self-auto cursor-pointer"
                  >
                    Clear Search Filters
                  </button>
                )}
              </div>

              <form onSubmit={handleExecuteReqSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Search by City */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                    <input
                      type="text"
                      value={searchReqCity}
                      onChange={(e) => setSearchReqCity(e.target.value)}
                      placeholder="e.g. Coimbatore, Chennai..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs outline-none bg-stone-50/50 focus:bg-white focus:border-amber-600"
                    />
                  </div>
                </div>

                {/* Search by Category */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Category
                  </label>
                  <select
                    value={searchReqCategory}
                    onChange={(e) => setSearchReqCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold bg-stone-50/50 focus:bg-white focus:border-amber-600 outline-none"
                  >
                    <option value="All Categories">All Categories</option>
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search by Pincode */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={searchReqPincode}
                    onChange={(e) => setSearchReqPincode(e.target.value)}
                    placeholder="e.g. 641001..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs outline-none bg-stone-50/50 focus:bg-white focus:border-amber-600"
                  />
                </div>

                {/* Search Action */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loadingCommunityRequests}
                    className="w-full py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:cursor-wait disabled:opacity-70"
                  >
                    {loadingCommunityRequests ? 'Searching...' : <><Search className="w-3.5 h-3.5" />Search Requests</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Sub-tabs: Community New Requests, Direct Pending, Accepted, Declined */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {requestTabMode === 'community'
                    ? 'New Product Requests from Buyers'
                    : requestTabMode === 'pending'
                    ? 'Pending Direct Requests'
                    : requestTabMode === 'accepted'
                    ? 'Accepted Requests (Buyer Details Revealed)'
                    : 'Rejected Requests'}
                </h3>
                <p className="text-xs text-stone-500">
                  {requestTabMode === 'community'
                    ? 'Open custom requests submitted by neighborhood buyers matching your location/categories'
                    : 'Track orders and responses for custom inquiries'}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRequestTabMode('community')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    requestTabMode === 'community'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  New Requests ({communityRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestTabMode('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    requestTabMode === 'pending'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  My Pending ({requests.filter((r) => r.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestTabMode('accepted')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    requestTabMode === 'accepted'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Accepted ({requests.filter((r) => r.status === 'accepted').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestTabMode('declined')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    requestTabMode === 'declined'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Rejected ({requests.filter((r) => r.status === 'declined').length})
                </button>
              </div>
            </div>

            {/* List based on requestTabMode */}
            {(() => {
              const activeList =
                requestTabMode === 'community'
                  ? communityRequests
                  : requests.filter((r) => r.status === requestTabMode);

              if (requestTabMode === 'community' && loadingCommunityRequests && activeList.length === 0) {
                return (
                  <div role="status" className="rounded-2xl border border-amber-200 bg-white px-6 py-10 text-center text-sm text-stone-600">
                    <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-amber-200 border-t-amber-700" />
                    Checking the latest buyer requests...
                  </div>
                );
              }

              if (requestTabMode === 'community' && communityRequestSearchError && activeList.length === 0) {
                return (
                  <div role="alert" className="rounded-2xl border border-rose-200 bg-white px-6 py-8 text-center">
                    <h3 className="font-bold text-stone-900">Could not check buyer requests</h3>
                    <p className="mt-2 text-sm text-stone-600">{communityRequestSearchError}</p>
                    <button
                      type="button"
                      onClick={() => void runRequestSearch({
                        city: searchReqCity,
                        category: searchReqCategory,
                        pincode: searchReqPincode,
                      })}
                      className="mt-4 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
                    >
                      Retry Search
                    </button>
                  </div>
                );
              }

              if (activeList.length === 0) {
                return (
                  <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                    <Send className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-stone-900">
                      No {requestTabMode.replace('_', ' ')} found
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                      {requestTabMode === 'community'
                        ? 'No new product requests match your search criteria. Try clearing search filters to see all community requests.'
                        : `There are currently no custom requests in the ${requestTabMode} state.`}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {requestTabMode === 'community' && loadingCommunityRequests && (
                    <p role="status" className="text-center text-xs text-stone-500">Refreshing buyer requests...</p>
                  )}
                  {requestTabMode === 'community' && communityRequestSearchError && (
                    <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                      Showing saved requests; Firebase refresh failed. {communityRequestSearchError}
                    </p>
                  )}
                  {activeList.map((req) => {
                    const isAcceptedByMe =
                      req.status === 'accepted' &&
                      (req.acceptedBySellerId === seller.id || req.sellerId === seller.id);

                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-stone-900">{req.productTitle}</h4>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                  req.status === 'got_seller'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : req.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : req.status === 'accepted'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {req.status === 'got_seller' ? '✓ Got Seller (Fulfilled)' : req.status}
                              </span>
                            </div>
                            <span className="text-xs text-stone-400">Category: {req.category}</span>
                          </div>

                          <div className="text-xs text-stone-500">
                            Requested: {new Date(req.createdAt).toLocaleDateString()}
                            {req.dueDate && (
                              <span className="ml-3 font-semibold text-stone-800">
                                Due Date: {req.dueDate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Requirements Description */}
                        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-xs sm:text-sm text-stone-700 space-y-1">
                          <strong className="text-stone-900 text-xs uppercase tracking-wider block">Requirements:</strong>
                          <p className="whitespace-pre-line leading-relaxed">{req.description}</p>
                        </div>
                        <RequestStatusHistory history={req.statusHistory} />

                        {/* Sample Images if attached */}
                        {req.sampleImages && req.sampleImages.length > 0 && (
                          <div>
                            <span className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                              Attached Sample Reference Images ({req.sampleImages.length}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {req.sampleImages.map((img, idx) => (
                                <button key={idx} type="button" onClick={() => setRequestPreviewImage(img)} className="cursor-zoom-in">
                                  <img
                                    src={img}
                                    alt={`Sample ${idx + 1}`}
                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-stone-200"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* PRIVACY SHIELD: Buyer details must remain hidden until the seller accepts the request */}
                        {!isAcceptedByMe ? (
                          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-700" />
                                Buyer Privacy Shield: Personal Details Hidden
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                                Confidential
                              </span>
                            </div>
                            <p className="text-amber-800 text-[11px] leading-relaxed">
                              Buyer username, contact number, and exact delivery address remain hidden until you accept this request. Location is provided below for delivery feasibility.
                            </p>
                            <div className="pt-1.5 border-t border-amber-200 flex flex-wrap gap-4 text-xs font-semibold text-stone-700">
                              <span>Location: <strong className="text-stone-900">{req.buyerCity} ({req.buyerPincode})</strong></span>
                              <span>Target Quantity: <strong className="text-stone-900">{req.targetQuantity} unit(s)</strong></span>
                              <span>Payment Mode: <strong className="text-stone-900">{req.paymentMode || 'Both'}</strong></span>
                            </div>
                          </div>
                        ) : (
                          /* After accepting, reveal the buyer details to that seller */
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                                <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                                Buyer Details (Unlocked & Revealed)
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                                Accepted by You
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-800">
                              <div>
                                <span>Buyer Name: <strong className="text-stone-900">{req.buyerUsername}</strong></span>
                                {req.buyerEmail && (
                                  <span className="block text-stone-500 text-[11px] mt-0.5">{req.buyerEmail}</span>
                                )}
                              </div>
                              <div>
                                <span>Delivery Address: <strong className="text-stone-900">{req.buyerAddress}, {req.buyerCity} ({req.buyerPincode})</strong></span>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span>Contact: <strong>{req.buyerContact}</strong></span>
                                <a
                                  href={`tel:${req.buyerContact}`}
                                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" /> Call
                                </a>
                                <a
                                  href={`https://wa.me/${req.buyerContact.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3 h-3" /> WhatsApp
                                </a>
                              </div>
                              <span className="text-stone-500 text-[11px]">
                                Target Qty: <strong>{req.targetQuantity}</strong> &bull; Payment: <strong>{req.paymentMode || 'Both'}</strong>
                              </span>
                            </div>
                          </div>
                        )}

                        {req.sellerResponse && (
                          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800">
                            <strong>Maker Response / Quotation:</strong> {req.sellerResponse}
                          </div>
                        )}

                        {/* If Got Seller, show message */}
                        {req.status === 'got_seller' && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                            <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>The buyer has marked this request as fulfilled with a seller.</span>
                          </div>
                        )}

                        {/* Accept/Reject actions for Pending requests */}
                        {req.status === 'pending' && (
                          <div className="pt-2 border-t border-stone-100 space-y-2">
                            {respondingReqId !== req.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRespondingReqId(req.id);
                                    setResponseNoteInput('Accepted! We can handcraft this as per your specifications.');
                                  }}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Accept Request
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRespondingReqId(req.id);
                                    setResponseNoteInput('Unable to fulfill due to materials or schedule.');
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  Decline Request
                                </button>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                                <label className="block text-xs font-bold text-stone-800">
                                  Response / Quotation Note for Buyer:
                                </label>
                                <input
                                  type="text"
                                  value={responseNoteInput}
                                  onChange={(e) => setResponseNoteInput(e.target.value)}
                                  placeholder="Add quote, estimated delivery timeline, or instructions..."
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white outline-none focus:border-amber-600"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRequestStatusChange(req.id, 'accepted', responseNoteInput)}
                                    className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
                                  >
                                    Confirm Accept & Unlock Buyer
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRequestStatusChange(req.id, 'declined', responseNoteInput)}
                                    className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl"
                                  >
                                    Confirm Decline
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRespondingReqId(null)}
                                    className="px-3.5 py-1.5 border border-stone-200 text-stone-600 text-xs font-semibold rounded-xl"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. ORDERS TAB (In-Progress / Active Orders) */}
        {/* ==================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Active Customer Orders</h2>
                <p className="text-xs text-stone-500">Orders currently pending, accepted, or in preparation</p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {activeOrders.length} In-Progress
              </span>
            </div>

            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No active orders</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  You have fulfilled all orders or none have been placed yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm bg-stone-100 px-2 py-0.5 rounded">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full ${
                              order.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : order.status === 'accepted'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'preparing'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Placed: {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-stone-400 block">Total Amount</span>
                        <span className="text-xl font-black text-amber-700">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Buyer info */}
                      <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 space-y-1.5">
                        <h5 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                          Buyer & Delivery
                        </h5>
                        <div>Buyer: <strong>{order.buyerUsername}</strong></div>
                        <div className="flex items-center gap-2">
                          <span>Mobile: <strong>{order.buyerMobile}</strong></span>
                          <a
                            href={`tel:${order.buyerMobile}`}
                            className="px-2 py-0.5 bg-white border border-stone-200 rounded font-semibold text-stone-800"
                          >
                            Call
                          </a>
                          <a
                            href={`https://wa.me/${order.buyerMobile.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold"
                          >
                            WhatsApp
                          </a>
                        </div>
                        <div>Address: {order.deliveryAddress}, {order.deliveryCity} ({order.deliveryPincode})</div>
                        <div>Payment Mode: <strong className="text-stone-900">{order.paymentMode}</strong></div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        <h5 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                          Items Ordered ({order.items.length})
                        </h5>
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100"
                          >
                            <span className="font-medium text-stone-800">
                              {item.title} &times; {item.quantity}
                            </span>
                            <span className="font-bold text-stone-900">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Due Date & Payment info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <span>Payment Mode: <strong>{order.paymentMode}</strong></span>
                      {order.dueDate && (
                        <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Buyer Required Due Date: <strong>{order.dueDate}</strong>
                        </span>
                      )}
                    </div>

                    {/* Workflow status action buttons */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'accepted')}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                          >
                            Accept Order
                          </button>
                        )}

                        {order.status === 'accepted' && (
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'preparing')}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                          >
                            Start Preparing Goods
                          </button>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'dispatched')}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                          >
                            Mark Dispatched / Ready
                          </button>
                        )}

                        {order.status === 'dispatched' && (
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'delivered')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          >
                            Mark as Delivered (Complete Order)
                          </button>
                        )}
                      </div>

                      {/* Cancel Order with Required Cancellation Reason */}
                      <button
                        onClick={() => {
                          setCancellingOrderId(order.id);
                          setCancellationReasonInput('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold"
                      >
                        Cancel Order...
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* 5. COMPLETED ORDERS TAB */}
        {/* ==================================================== */}
        {activeTab === 'completed_orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Completed Orders History</h2>
                <p className="text-xs text-stone-500">All orders successfully delivered to buyers</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-stone-500 block">Total Delivered Revenue</span>
                <span className="text-xl font-extrabold text-emerald-700">₹{completedRevenue.toLocaleString()}</span>
              </div>
            </div>

            {completedOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <CheckCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No completed orders yet</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  When you deliver orders to buyers and mark them as delivered, they will be archived here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-emerald-100 shadow-xs p-5 sm:p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-stone-900">{order.orderNumber}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        </div>
                        <span className="text-xs text-stone-400">
                          Completed on: {new Date(order.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-lg font-extrabold text-emerald-700">₹{order.totalAmount}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
                      <div>
                        <strong>Buyer:</strong> {order.buyerUsername} &bull; {order.deliveryCity}
                      </div>
                      <div>
                        <strong>Payment Mode:</strong> {order.paymentMode}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-xs text-stone-700 flex justify-between">
                          <span>{item.title} &times; {item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* 6. REVIEWS TAB */}
        {/* ==================================================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Customer Ratings & Reviews</h2>
                <p className="text-xs text-stone-500">Feedback from verified neighborhood buyers</p>
              </div>

              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                <div className="text-3xl font-black text-amber-900">
                  {ratingStats.count > 0 ? ratingStats.average : '0.0'}
                </div>
                <div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(ratingStats.average)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-stone-500 font-medium">
                    {ratingStats.count} Total Review(s)
                  </span>
                </div>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <Star className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No customer reviews yet</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  As buyers receive their completed orders, they can submit star ratings and feedback for your creations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{rev.buyerUsername}</span>
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
                              }`}
                            />
                          ))}
                        </div>
                        {rev.rating && (
                          <span className="text-xs font-bold text-stone-700 ml-1">
                            {rev.rating} / 5
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Feedback Tags Multiple Selection display */}
                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rev.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {rev.comment && (
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      <AddEditProductModal
        seller={seller}
        productToEdit={productToEdit}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSaved={refreshData}
      />
      <ImagePreviewModal src={requestPreviewImage} alt="Buyer request reference image" onClose={() => setRequestPreviewImage(null)} />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Delete this product?</h3>
            <p className="text-xs text-stone-500 mt-1.5">
              This product will be permanently removed from your storefront and marketplace listings.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 px-3 border border-stone-200 rounded-xl text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seller Order Cancellation Reason Modal */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Cancel Order
              </h3>
              <button
                onClick={() => setCancellingOrderId(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                Back
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Please provide a cancellation reason. <strong>This reason is required and will be displayed directly to the buyer.</strong>
            </p>

            <form onSubmit={handleConfirmCancelOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Cancellation Reason <span className="text-rose-500">* (Required)</span>
                </label>
                <textarea
                  rows={3}
                  value={cancellationReasonInput}
                  onChange={(e) => setCancellationReasonInput(e.target.value)}
                  placeholder="e.g. Ingredients currently out of stock / Cannot complete by requested due date / Kitchen closed due to personal emergency..."
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCancellingOrderId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
