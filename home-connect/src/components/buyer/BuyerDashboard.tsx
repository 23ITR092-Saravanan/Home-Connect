import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Store,
  Search,
  MapPin,
  IndianRupee,
  LogOut,
  User,
  Package,
  Layers,
  Calendar,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Star,
  Phone,
  MessageSquare,
  Sparkles,
  Tag,
  Hash,
  Building,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Check,
  CheckCheck,
  X,
  ArrowLeft,
  CreditCard,
  Banknote,
} from 'lucide-react';
import {
  BuyerProfile,
  CartItem,
  Order,
  PaymentMode,
  Product,
  ProductRequest,
  Review,
  SellerProfile,
  PRESET_CATEGORIES,
  REVIEW_TAGS,
} from '../../types/index.ts';
import {
  AuthService,
  CartService,
  OrderService,
  ProductRequestService,
  ProductService,
  ReviewService,
  getFirebaseErrorMessage,
} from '../../services/storage.ts';
import { useToast } from '../common/Toast.tsx';
import { ProductDetailsModal } from './ProductDetailsModal.tsx';
import { CartDrawer } from './CartDrawer.tsx';
import { BuyerProfileView } from './BuyerProfileView.tsx';
import { ReviewModal } from '../common/ReviewModal.tsx';
import { RequestStatusHistory } from '../common/RequestStatusHistory.tsx';
import { ImagePreviewModal } from '../common/ImagePreviewModal.tsx';
import { optimizeImage } from '../../services/images.ts';
import { matchesProductSearch } from '../../services/productSearch.ts';
import { withTimeout } from '../../services/async.ts';

interface BuyerDashboardProps {
  buyer: BuyerProfile;
  onLogout: () => void;
  onProfileUpdated: (updated: BuyerProfile) => void;
}

type BuyerTab =
  | 'search'
  | 'pending_requests'
  | 'accepted_requests'
  | 'declined_requests'
  | 'orders'
  | 'completed_orders'
  | 'new_request'
  | 'profile';

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  buyer,
  onLogout,
  onProfileUpdated,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<BuyerTab>('search');
  const tabHistory = useRef<BuyerTab[]>([]);

  const navigateToTab = (tab: BuyerTab) => {
    if (tab !== activeTab) tabHistory.current.push(activeTab);
    setActiveTab(tab);
  };

  const handleBack = () => {
    setActiveTab(tabHistory.current.pop() || 'search');
  };

  // Master Data
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [sellersList, setSellersList] = useState<SellerProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<ProductRequest[]>([]);

  // Search requires at least one category, city, or pincode filter.
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [optionalCity, setOptionalCity] = useState<string>('');
  const [optionalPincode, setOptionalPincode] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productSearchError, setProductSearchError] = useState<string | null>(null);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // New Product Request Form State (Required: Category, Due Date, Quantity, Payment Mode, Description; Optional: Sample Images)
  const [newReqSellerId, setNewReqSellerId] = useState<string>(''); // empty means open to all sellers
  const [newReqTitle, setNewReqTitle] = useState<string>('');
  const [newReqCategory, setNewReqCategory] = useState<string>(PRESET_CATEGORIES[0]);
  const [newReqDueDate, setNewReqDueDate] = useState<string>('');
  const [newReqQuantity, setNewReqQuantity] = useState<number>(1);
  const [newReqPaymentMode, setNewReqPaymentMode] = useState<PaymentMode>('Both');
  const [newReqDescription, setNewReqDescription] = useState<string>('');
  const [newReqSampleImages, setNewReqSampleImages] = useState<string[]>([]);
  const [submittingNewReq, setSubmittingNewReq] = useState<boolean>(false);

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [existingReviewForModal, setExistingReviewForModal] = useState<Review | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  // Fullscreen Preview Image Modal
  const [previewSampleImage, setPreviewSampleImage] = useState<string | null>(null);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  const refreshData = (updatedKey?: string) => {
    const prods = ProductService.getProducts();
    setAllProducts(prods);
    if (updatedKey === 'homecraft_products_v1') setProductSearchError(null);

    const sellers = AuthService.getSellers();
    setSellersList(sellers);

    const bOrders = OrderService.getOrdersByBuyer(buyer.id);
    setOrders(bOrders);

    const bReqs = ProductRequestService.getRequestsByBuyer(buyer.id);
    setBuyerRequests(bReqs);

    const revs = ReviewService.getReviews();
    setAllReviews(revs);

    setCart(CartService.getCart());

  };

  useEffect(() => {
    refreshData();

    // Set default due date to 4 days in future
    const d = new Date();
    d.setDate(d.getDate() + 4);
    setNewReqDueDate(d.toISOString().split('T')[0]);

    const handleStorageUpdate = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      refreshData(key);
    };

    window.addEventListener('homecraft_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('homecraft_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [buyer.id]);

  // Execute Search Function
  const executeSearch = (
    productsToFilter: Product[],
    categories: string[],
    city: string,
    pincode: string,
    sellersToSearch: SellerProfile[] = sellersList
  ) => {
    const matched = productsToFilter.filter((product) =>
      matchesProductSearch(
        product,
        sellersToSearch.find((seller) => seller.id === product.sellerId),
        { categories, city, pincode }
      )
    );

    setSearchResults(matched);
    setHasSearched(true);
  };

  useEffect(() => {
    if (hasSearched) {
      executeSearch(allProducts, selectedCategories, optionalCity, optionalPincode, sellersList);
    }
  }, [allProducts, sellersList, selectedCategories, optionalCity, optionalPincode, hasSearched]);

  const runProductSearch = async () => {
    if (selectedCategories.length === 0 && !optionalCity.trim() && !optionalPincode.trim()) {
      showToast('error', 'Search Filter Required', 'Select a category or enter a city or pincode.');
      return;
    }

    setSearchingProducts(true);
    setProductSearchError(null);
    executeSearch(allProducts, selectedCategories, optionalCity, optionalPincode, sellersList);
    try {
      const latestProducts = await withTimeout(
        ProductService.refreshFromFirebase(),
        2500,
        'Firebase product search is taking longer than 2.5 seconds. Retry shortly.'
      );
      setAllProducts(latestProducts);
      executeSearch(latestProducts, selectedCategories, optionalCity, optionalPincode, sellersList);
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      setProductSearchError(message);
      const cachedProducts = ProductService.getProducts();
      setAllProducts(cachedProducts);
      executeSearch(cachedProducts, selectedCategories, optionalCity, optionalPincode, sellersList);
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runProductSearch();
  };

  // Sample Image Uploader Handler
  const handleSampleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Invalid File', 'Please upload valid image files (JPG, PNG, WEBP)');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Each sample image should be under 3MB');
        return;
      }

      void optimizeImage(file)
        .then((image) => setNewReqSampleImages((prev) => [...prev, image]))
        .catch((error: unknown) => {
          showToast('error', 'Image Processing Failed', error instanceof Error ? error.message : 'Please try another image.');
        });
    });
  };

  const handleRemoveSampleImage = (indexToRemove: number) => {
    setNewReqSampleImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit New Product Request
  const handleSubmitNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReqCategory) {
      showToast('error', 'Category Required', 'Please select a Product Category');
      return;
    }
    if (!newReqDueDate) {
      showToast('error', 'Due Date Required', 'Please specify the Expected Due Date');
      return;
    }
    if (!newReqQuantity || newReqQuantity < 1) {
      showToast('error', 'Quantity Required', 'Order Quantity must be at least 1');
      return;
    }
    if (!newReqPaymentMode) {
      showToast('error', 'Payment Mode Required', 'Please select a Payment Mode');
      return;
    }
    if (!newReqDescription.trim()) {
      showToast('error', 'Description Required', 'Please provide detailed specifications');
      return;
    }

    setSubmittingNewReq(true);
    try {
      const sellerFound = newReqSellerId ? AuthService.getSellerById(newReqSellerId) : null;
      const targetSeller = sellerFound || undefined;
      await ProductRequestService.createRequest({
        seller: targetSeller,
        buyer,
        productTitle: newReqTitle.trim() || `Custom ${newReqCategory} Request`,
        category: newReqCategory,
        dueDate: newReqDueDate,
        targetQuantity: Math.max(1, Number(newReqQuantity)),
        paymentMode: newReqPaymentMode,
        description: newReqDescription.trim(),
        sampleImages: newReqSampleImages,
      });

      showToast(
        'success',
        'Product Request Published!',
        `Your request for ${newReqCategory} (${newReqQuantity} units) has been submitted! Local sellers can now view and accept it.`
      );

      // Reset form and navigate to Pending Requests
      setNewReqTitle('');
      setNewReqDescription('');
      setNewReqQuantity(1);
      setNewReqSampleImages([]);
      setNewReqPaymentMode('Both');
      navigateToTab('pending_requests');
      refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request';
      showToast('error', 'Error', msg);
    } finally {
      setSubmittingNewReq(false);
    }
  };

  // Mark "Got Seller"
  const handleMarkGotSeller = async (requestId: string) => {
    try {
      await ProductRequestService.markGotSeller(requestId, buyer.id);
      showToast(
        'success',
        'Marked Got Seller!',
        'This request has been marked as fulfilled with a seller.'
      );
      refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update request';
      showToast('error', 'Error', msg);
    }
  };

  // Filter requests by status
  const pendingRequests = buyerRequests.filter((r) => r.status === 'pending' || r.status === 'got_seller');
  const acceptedRequests = buyerRequests.filter((r) => r.status === 'accepted');
  const declinedRequests = buyerRequests.filter((r) => r.status === 'declined');

  // Filter orders by completion
  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl text-stone-900 tracking-tight">
                    HomeCraft <span className="text-emerald-600">Connect</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Buyer Portal
                  </span>
                </div>
                <div className="text-xs text-stone-500 flex items-center gap-2">
                  <span>Buyer: <strong className="text-stone-800">{buyer.username}</strong></span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {buyer.city} ({buyer.pincode})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200/80 font-semibold text-xs sm:text-sm transition shadow-xs"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                <span className="hidden sm:inline">Basket</span>
                {totalCartCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-rose-700 hover:bg-rose-50 border border-stone-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 sm:gap-2 border-t border-stone-100 overflow-x-auto py-2.5 scrollbar-none text-xs font-bold">
            {/* 1. Search Products */}
            <button
              onClick={() => navigateToTab('search')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition whitespace-nowrap ${
                activeTab === 'search'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Search Products
            </button>

            {/* 2. Pending Requests */}
            <button
              onClick={() => navigateToTab('pending_requests')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition whitespace-nowrap ${
                activeTab === 'pending_requests'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Pending Requests ({pendingRequests.length})
            </button>

            {/* 3. Accepted Requests */}
            <button
              onClick={() => navigateToTab('accepted_requests')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition whitespace-nowrap ${
                activeTab === 'accepted_requests'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              Accepted Requests ({acceptedRequests.length})
            </button>

            {/* 4. Declined Requests */}
            <button
              onClick={() => navigateToTab('declined_requests')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition whitespace-nowrap ${
                activeTab === 'declined_requests'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              Rejected Requests ({declinedRequests.length})
            </button>

            {/* 5. Orders */}
            <button
              onClick={() => navigateToTab('orders')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Orders ({activeOrders.length})
            </button>

            {/* 6. Completed Orders */}
            <button
              onClick={() => navigateToTab('completed_orders')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition whitespace-nowrap ${
                activeTab === 'completed_orders'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Completed Orders ({completedOrders.length})
            </button>

            {/* 7. Request a New Product */}
            <button
              onClick={() => navigateToTab('new_request')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition whitespace-nowrap bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80 shadow-xs ${
                activeTab === 'new_request' ? 'ring-2 ring-amber-500' : ''
              }`}
            >
              <Send className="w-3.5 h-3.5 text-amber-700" />
              Request a New Product
            </button>

            {/* 8. Profile */}
            <button
              onClick={() => navigateToTab('profile')}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        {(activeTab !== 'search' || tabHistory.current.length > 0) && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {/* ========================================================= */}
        {/* TAB 1: SEARCH PRODUCTS                                    */}
        {/* Any category or location filter can be used independently */}
        {/* Add Search button. Show matching products only after clicked */}
        {/* ========================================================= */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-sm space-y-5">
              <div>
                <h2 className="text-xl font-black text-stone-900">Search Homecrafted Products</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Select one or more categories, or enter a city or pincode. Location filters narrow category matches.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Categories - Optional, multi-select */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Categories <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <details className="group">
                        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-white">
                          <Tag className="w-4 h-4 shrink-0 text-stone-400" />
                          <span>{selectedCategories.length ? `${selectedCategories.length} selected` : 'Choose categories'}</span>
                          <span className="ml-auto text-stone-400">▾</span>
                        </summary>
                        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                          {PRESET_CATEGORIES.map((category) => (
                            <label key={category} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-stone-700 hover:bg-stone-50">
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={(event) => setSelectedCategories((current) =>
                                  event.target.checked
                                    ? [...current, category]
                                    : current.filter((item) => item !== category)
                                )}
                                className="accent-emerald-600"
                              />
                              {category}
                            </label>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* City - Optional */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      City <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        value={optionalCity}
                        onChange={(e) => setOptionalCity(e.target.value)}
                        placeholder="e.g. Bangalore, Mumbai"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition"
                      />
                    </div>
                  </div>

                  {/* Pincode - Optional */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Pincode <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        value={optionalPincode}
                        onChange={(e) => setOptionalPincode(e.target.value)}
                        placeholder="e.g. 560001"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={searchingProducts}
                    className="py-3 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-70"
                  >
                    {searchingProducts ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{searchingProducts ? 'Checking products...' : 'Search Products'}</span>
                  </button>

                  {hasSearched && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategories([]);
                        setOptionalCity('');
                        setOptionalPincode('');
                        setHasSearched(false);
                        setSearchResults([]);
                      }}
                      className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </form>
            </div>

            <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Looking for something custom?</h3>
                <p className="mt-1 text-xs text-stone-600">Send your requirements to local makers.</p>
              </div>
              <button
                type="button"
                onClick={() => navigateToTab('new_request')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700"
              >
                <Send className="h-4 w-4" />
                Request a Custom Product
              </button>
            </section>

            {/* Search Results Area - Show ONLY after Search button is clicked */}
            {!hasSearched ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Find What You Love</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  Select a category or enter a city or pincode, then search to see matching products.
                </p>
              </div>
            ) : searchingProducts ? (
              <div role="status" className="rounded-2xl border border-emerald-200 bg-white px-6 py-10 text-center text-sm text-stone-600">
                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
                Checking the latest products...
                {searchResults.length > 0 && <p className="mt-1 text-xs">Refreshing {searchResults.length} saved match(es).</p>}
              </div>
            ) : productSearchError && searchResults.length === 0 ? (
              <div role="alert" className="rounded-2xl border border-rose-200 bg-white px-6 py-8 text-center">
                <h3 className="font-bold text-stone-900">Could not check the product catalog</h3>
                <p className="mt-2 text-sm text-stone-600">{productSearchError}</p>
                <button
                  type="button"
                  onClick={() => void runProductSearch()}
                  className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Retry Search
                </button>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No products found</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  No products matched {selectedCategories.length ? 'Categories' : 'your filters'}:{' '}
                  {selectedCategories.length > 0 && <strong>{selectedCategories.join(', ')}</strong>}
                  {optionalCity && ` in ${optionalCity}`}
                  {optionalPincode && ` (${optionalPincode})`}.
                    Try changing your filters or submitting a <strong>New Product Request</strong>.
                </p>
                <button
                  onClick={() => navigateToTab('new_request')}
                  className="mt-5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Custom Product Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {productSearchError && (
                  <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                    Showing saved matches; the online catalog could not be refreshed. {productSearchError}
                  </p>
                )}
                <div className="flex items-center justify-between px-1 text-xs text-stone-500">
                  <span>
                    Found <strong>{searchResults.length}</strong> matching product(s)
                    {selectedCategories.length > 0 && <> in categories <strong>{selectedCategories.join(', ')}</strong></>}
                    {optionalCity && <> for city <strong>{optionalCity}</strong></>}
                    {optionalPincode && <> in pincode <strong>{optionalPincode}</strong></>}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image Preview with click to open details */}
                        <div
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsDetailsOpen(true);
                          }}
                          className="relative h-48 bg-stone-100 overflow-hidden cursor-pointer"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs ${
                                product.inStock ? 'bg-emerald-600 text-white' : 'bg-stone-500 text-white'
                              }`}
                            >
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className="text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full">
                              {product.category}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span className="flex items-center gap-1 font-medium text-amber-800">
                              <Store className="w-3 h-3 text-amber-600" />
                              {product.sellerName}
                            </span>
                            <span className="flex items-center gap-0.5 text-stone-400">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              {product.sellerCity}
                            </span>
                          </div>

                          <h4
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDetailsOpen(true);
                            }}
                            className="font-bold text-stone-900 text-base line-clamp-1 cursor-pointer hover:text-emerald-700 transition"
                          >
                            {product.title}
                          </h4>

                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                            <div>
                              <span className="text-base font-black text-emerald-800">
                                ₹{product.price}
                              </span>
                              <span className="text-[11px] text-stone-500 ml-1">/ unit</span>
                            </div>

                            <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-stone-400" />
                              MOQ: {product.minOrderQuantity || 1}
                            </span>
                          </div>

                          <div className="text-[10px] text-stone-500 bg-stone-50 p-1.5 rounded-lg flex items-center justify-between">
                            <span>Payment: <strong>{product.paymentMode}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Bar */}
                      <div className="p-3 bg-stone-50/80 border-t border-stone-100 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsDetailsOpen(true);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Details & Order</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PENDING REQUESTS                                   */}
        {/* ========================================================= */}
        {activeTab === 'pending_requests' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Pending Requests</h2>
                <p className="text-xs text-stone-500">Custom product requests awaiting seller response</p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {pendingRequests.length} Pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No pending requests</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2">
                  You don&apos;t have any pending requests. Need something custom made?
                </p>
                <button
                  onClick={() => navigateToTab('new_request')}
                  className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Request a New Product
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-stone-900">{req.productTitle}</h4>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              req.status === 'got_seller'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {req.status === 'got_seller' ? '✓ Got Seller' : 'Pending Response'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Category: <strong>{req.category}</strong> &bull; Location: {req.buyerCity} ({req.buyerPincode})
                          {req.sellerName && (
                            <span className="ml-2 text-stone-700">
                              &bull; Sent to: <strong>{req.sellerName}</strong> ({req.sellerCode})
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-stone-400">
                        Submitted: {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-xs sm:text-sm text-stone-700 space-y-1">
                      <strong className="text-stone-900 text-xs uppercase tracking-wider block">Description:</strong>
                      <p className="whitespace-pre-line leading-relaxed">{req.description}</p>
                    </div>
                    <RequestStatusHistory history={req.statusHistory} />

                    {/* Sample Images preview */}
                    {req.sampleImages && req.sampleImages.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                          Attached Sample Images ({req.sampleImages.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {req.sampleImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Sample ${idx + 1}`}
                              onClick={() => setPreviewSampleImage(img)}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-stone-200 cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-amber-500 transition"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs text-stone-600">
                      <div className="flex flex-wrap items-center gap-4">
                        <span>Quantity: <strong className="text-stone-900">{req.targetQuantity} unit(s)</strong></span>
                        <span>Due Date: <strong className="text-stone-900">{req.dueDate}</strong></span>
                        <span>Payment: <strong className="text-stone-900">{req.paymentMode}</strong></span>
                      </div>

                      {/* Allow buyers to mark "Got Seller" */}
                      {req.status !== 'got_seller' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkGotSeller(req.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Mark &ldquo;Got Seller&rdquo;
                        </button>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs inline-flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                          Fulfilled with Maker
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ACCEPTED REQUESTS                                  */}
        {/* ========================================================= */}
        {activeTab === 'accepted_requests' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Accepted Requests</h2>
                <p className="text-xs text-stone-500">Custom requests accepted by home creators</p>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {acceptedRequests.length} Accepted
              </span>
            </div>

            {acceptedRequests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No accepted requests yet</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2">
                  When sellers accept your custom product requests, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {acceptedRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-stone-900">{req.productTitle}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Accepted by Seller
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Maker: <strong>{req.sellerName || req.sellerCode}</strong> ({req.sellerCode})
                        </p>
                      </div>
                      <span className="text-xs text-stone-400">
                        Target Qty: {req.targetQuantity} &bull; Due: {req.dueDate || 'Flexible'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 bg-stone-50 p-3 rounded-xl">
                      <strong>Requirements:</strong> {req.description}
                    </p>
                    <RequestStatusHistory history={req.statusHistory} />

                    {req.sellerResponse && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950">
                        <strong>Seller Response:</strong> {req.sellerResponse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: DECLINED REQUESTS                                  */}
        {/* ========================================================= */}
        {activeTab === 'declined_requests' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Rejected Requests</h2>
                <p className="text-xs text-stone-500">Custom requests that the maker was unable to fulfill</p>
              </div>
              <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                {declinedRequests.length} Rejected
              </span>
            </div>

            {declinedRequests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <XCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No rejected requests</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2">
                  None of your custom requests have been declined.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {declinedRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-stone-900">{req.productTitle}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            Declined
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Maker: <strong>{req.sellerName || req.sellerCode}</strong> ({req.sellerCode})
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl">
                      <strong>Requirements:</strong> {req.description}
                    </p>
                    <RequestStatusHistory history={req.statusHistory} />

                    {req.sellerResponse && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950">
                        <strong>Reason / Note:</strong> {req.sellerResponse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ORDERS (Active In-Progress Orders)                  */}
        {/* Shows Due Date and Seller Cancellation Reason if cancelled */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Active Orders</h2>
                <p className="text-xs text-stone-500">Live order fulfillment and status tracking</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {activeOrders.length} In-Progress
              </span>
            </div>

            {/* If there are any cancelled orders by seller, show them clearly with the reason */}
            {cancelledOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Cancelled Orders ({cancelledOrders.length})
                </h3>
                {cancelledOrders.map((ord) => (
                  <div key={ord.id} className="bg-white rounded-2xl border border-rose-300 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{ord.orderNumber}</span>
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Cancelled
                        </span>
                      </div>
                      <span className="text-xs text-stone-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Show Seller's Cancellation Reason to Buyer */}
                    {ord.cancellationReason && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Reason for Cancellation provided by Seller:</strong>
                          <p className="mt-0.5 font-medium">&ldquo;{ord.cancellationReason}&rdquo;</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No active orders</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2">
                  You have no pending or in-progress orders. Search products to place an order!
                </p>
                <button
                  onClick={() => navigateToTab('search')}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Search Products
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
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
                        <p className="text-xs text-stone-500 mt-1">
                          Maker: <strong>{order.sellerName}</strong> ({order.sellerCode})
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-base font-black text-emerald-700">₹{order.totalAmount}</span>
                        {/* Due Date */}
                        {order.dueDate && (
                          <span className="text-xs text-stone-600 font-semibold block flex items-center gap-1 sm:justify-end">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            Due Date: {order.dueDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-stone-50">
                          <div className="flex items-center gap-2.5">
                            <img src={item.imageUrl} alt={item.title} className="w-8 h-8 rounded-lg object-cover" />
                            <span className="font-semibold text-stone-900">{item.title} &times; {item.quantity}</span>
                          </div>
                          <span className="font-bold text-stone-900">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                      <span>Payment: <strong>{order.paymentMode}</strong></span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${order.sellerContact}`}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-semibold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" /> Call Maker
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: COMPLETED ORDERS                                   */}
        {/* ========================================================= */}
        {activeTab === 'completed_orders' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Completed Orders</h2>
                <p className="text-xs text-stone-500">Delivered orders and ratings</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {completedOrders.length} Delivered
              </span>
            </div>

            {completedOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-900">No completed orders yet</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2">
                  Orders marked as delivered by creators will be listed here, where you can leave a review!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Maker: <strong>{order.sellerName}</strong> ({order.sellerCode})
                        </p>
                      </div>
                      <span className="text-base font-black text-emerald-700">₹{order.totalAmount}</span>
                    </div>

                    <div className="space-y-1 text-xs text-stone-700">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.title} &times; {item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Review option */}
                    <div className="pt-2 border-t border-stone-100">
                      {(() => {
                        const existingReview = allReviews.find(
                          (r) =>
                            (r.orderId === order.id || r.sellerId === order.sellerId) &&
                            r.buyerId === buyer.id
                        );

                        if (existingReview) {
                          return (
                            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-stone-900">
                                    Your Review for {order.sellerName}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                                    Published by {existingReview.buyerUsername}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewOrder(order);
                                    setExistingReviewForModal(existingReview);
                                    setIsReviewModalOpen(true);
                                  }}
                                  className="px-3 py-1 bg-white hover:bg-stone-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                  Edit Review
                                </button>
                              </div>

                              <div className="flex items-center gap-1 text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-4 h-4 ${
                                      s <= (existingReview.rating || 5)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-stone-300'
                                    }`}
                                  />
                                ))}
                                {existingReview.rating && (
                                  <span className="text-xs font-bold text-stone-800 ml-1.5">
                                    {existingReview.rating} / 5 Stars
                                  </span>
                                )}
                              </div>

                              {existingReview.tags && existingReview.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {existingReview.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-stone-800 border border-stone-200 shadow-2xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {existingReview.comment && (
                                <p className="text-xs text-stone-700 italic bg-white p-2.5 rounded-xl border border-amber-100">
                                  &ldquo;{existingReview.comment}&rdquo;
                                </p>
                              )}
                            </div>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewOrder(order);
                              setExistingReviewForModal(null);
                              setIsReviewModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs inline-flex items-center gap-2 transition shadow-xs"
                          >
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            Rate & Review this Maker (Select Feedback Tags)
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: NEW PRODUCT REQUEST FORM                           */}
        {/* ========================================================= */}
        {activeTab === 'new_request' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div>
                <h2 className="text-xl font-black text-stone-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-600" />
                  Request a New Product
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Looking for something unique, tailored, or customized? Post your request and verified home makers can discover and fulfill it.
                </p>
              </div>

              <form onSubmit={handleSubmitNewRequest} className="space-y-4">
                {/* 1. Product Category - Required */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Product Category <span className="text-rose-500">* (Required)</span>
                  </label>
                  <select
                    value={newReqCategory}
                    onChange={(e) => setNewReqCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm font-semibold text-stone-800 outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                    required
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Request Title / Short Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Product Title / Short Summary <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newReqTitle}
                    onChange={(e) => setNewReqTitle(e.target.value)}
                    placeholder="e.g. Handmade Silk Thread Bangles, Custom 1kg Mango Pickle..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                {/* 2. Expected Due Date & 3. Order Quantity - Required */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Order Quantity <span className="text-rose-500">* (Required)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newReqQuantity}
                      onChange={(e) => setNewReqQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm font-semibold outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Expected Due Date <span className="text-rose-500">* (Required)</span>
                    </label>
                    <input
                      type="date"
                      value={newReqDueDate}
                      onChange={(e) => setNewReqDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm font-semibold outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                      required
                    />
                  </div>
                </div>

                {/* 4. Payment Mode - Required */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Payment Mode <span className="text-rose-500">* (Required)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['Cash After Delivery', 'Online Payment', 'Both'] as PaymentMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setNewReqPaymentMode(mode)}
                        className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 select-none cursor-pointer ${
                          newReqPaymentMode === mode
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {mode === 'Cash After Delivery' && <Banknote className="w-3.5 h-3.5" />}
                        {mode === 'Online Payment' && <CreditCard className="w-3.5 h-3.5" />}
                        {mode === 'Both' && <Layers className="w-3.5 h-3.5" />}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Description - Required */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Description & Specifications <span className="text-rose-500">* (Required)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={newReqDescription}
                    onChange={(e) => setNewReqDescription(e.target.value)}
                    placeholder="Provide specific details about desired materials, dimensions, colors, personalization, dietary preferences, or packaging instructions..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                    required
                  />
                </div>

                {/* Sample Images - Optional */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                      Sample Images <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {newReqSampleImages.length} attached
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5 items-center">
                    {newReqSampleImages.map((img, idx) => (
                      <div key={idx} className="relative group w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-stone-200 shadow-2xs">
                        <img src={img} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveSampleImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition opacity-90 group-hover:opacity-100 shadow-xs"
                          title="Remove image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <label className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/50 text-stone-500 hover:text-amber-700 flex flex-col items-center justify-center cursor-pointer transition select-none">
                      <Upload className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-bold">Add Photo</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleSampleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Upload reference photos, sketches, or previous designs to help the creator understand your requirements.
                  </p>
                </div>

                {/* Optional Seller Targeting */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Target Specific Creator <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <select
                      value={newReqSellerId}
                      onChange={(e) => setNewReqSellerId(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm font-semibold text-stone-800 outline-none focus:bg-white focus:border-amber-600"
                    >
                      <option value="">
                        Open Request &mdash; Broadcast to all local makers in this category & city
                      </option>
                      {sellersList.map((s) => (
                        <option key={s.id} value={s.id}>
                          Direct to: {s.username} ({s.sellerCode}) &bull; {s.city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingNewReq}
                    className="w-full py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingNewReq ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publish Product Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: PROFILE                                            */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <BuyerProfileView buyer={buyer} onProfileUpdated={onProfileUpdated} />
        )}
      </main>

      {/* Product Details Modal with Image Zoom, Share, and Place Order */}
      <ProductDetailsModal
        product={selectedProduct}
        buyer={buyer}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProduct(null);
        }}
        onOrderSuccess={() => {
          refreshData();
          navigateToTab('pending_requests');
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        buyer={buyer}
        cart={cart}
        onCartUpdated={setCart}
        onOrderPlaced={() => {
          refreshData();
          navigateToTab('orders');
        }}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewOrder(null);
          setExistingReviewForModal(null);
        }}
        order={reviewOrder}
        buyer={buyer}
        existingReview={existingReviewForModal}
        onSaved={refreshData}
      />

      {/* Fullscreen Sample Image Preview Modal */}
      <ImagePreviewModal src={previewSampleImage} alt="Custom request image" onClose={() => setPreviewSampleImage(null)} />
    </div>
  );
};
