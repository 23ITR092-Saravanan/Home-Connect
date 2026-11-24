import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  BuyerProfile,
  SellerProfile,
  Product,
  ProductRequest,
  Review,
  UserRole,
  RequestStatus,
  ToastMessage,
  PaymentMode,
} from '../types';
import { marketplaceService, ProductSearchParams } from '../services/marketplaceService';
import { StorageService } from '../services/storageService';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export type ViewType =
  | 'home'
  | 'buyer-register'
  | 'buyer-login'
  | 'seller-register'
  | 'seller-login'
  | 'seller-dashboard'
  | 'buyer-dashboard';

export type SellerTab =
  | 'publish'
  | 'my-products'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'customer-requests'
  | 'profile';

export type BuyerTab =
  | 'search'
  | 'custom-request'
  | 'pending'
  | 'accepted'
  | 'completed'
  | 'profile';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface AppContextType {
  currentView: ViewType;
  currentUserRole: UserRole;
  activeBuyer: BuyerProfile | null;
  activeSeller: SellerProfile | null;
  sellerActiveTab: SellerTab;
  buyerActiveTab: BuyerTab;
  products: Product[];
  requests: ProductRequest[];
  reviews: Review[];
  zoomImage: { url: string; title?: string; storagePath?: string } | null;
  confirmDialog: ConfirmDialogState | null;
  toasts: ToastMessage[];
  editingProduct: Product | null;
  editingRequest: ProductRequest | null;
  editingReview: Review | null;
  requestingProduct: Product | null;
  reviewingRequest: ProductRequest | null;

  // Navigation & Modals
  navigateTo: (view: ViewType, tab?: string) => void;
  setSellerActiveTab: (tab: SellerTab) => void;
  setBuyerActiveTab: (tab: BuyerTab) => void;
  openZoom: (url: string, title?: string, storagePath?: string) => void;
  closeZoom: () => void;
  showConfirm: (dialog: Omit<ConfirmDialogState, 'isOpen'>) => void;
  closeConfirm: () => void;
  addToast: (text: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;

  // Auth
  loginBuyer: (username: string, password?: string) => Promise<boolean> | boolean;
  registerBuyer: (profile: Omit<BuyerProfile, 'id'>) => Promise<boolean> | boolean;
  loginSeller: (shopCode: string, password?: string) => Promise<boolean> | boolean;
  registerSeller: (
    profile: Omit<SellerProfile, 'id' | 'rating' | 'reviewCount'> & {
      otherCategoryText?: string;
      logoFile?: File;
    }
  ) => Promise<boolean> | boolean;
  updateBuyerProfile: (profile: Partial<BuyerProfile>) => void;
  updateSellerProfile: (profile: Partial<SellerProfile>) => void;
  logout: () => void | Promise<void>;

  // Products
  setEditingProduct: (product: Product | null) => void;
  saveProduct: (productData: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => boolean;
  deleteProduct: (id: string) => boolean;

  // Requests & Orders
  setRequestingProduct: (product: Product | null) => void;
  setEditingRequest: (req: ProductRequest | null) => void;
  submitStandardRequest: (data: {
    product: Product;
    quantity: number;
    paymentMode: PaymentMode;
    expectedDeliveryDate: string;
    customDescription?: string;
  }) => boolean;
  submitCustomRequest: (data: {
    category: string;
    expectedDeliveryDate: string;
    quantity: number;
    paymentMode: PaymentMode;
    title: string;
    specifications: string;
    sampleImage?: string;
    sampleStoragePath?: string;
  }) => boolean;
  updateRequestStatus: (requestId: string, status: RequestStatus, reason?: string) => void;
  markOrderCompletedBySeller: (requestId: string) => boolean;
  markOrderCompletedByBuyer: (requestId: string) => boolean;
  updateRequest: (requestId: string, updates: Partial<ProductRequest>) => boolean;
  deleteRequest: (requestId: string) => boolean;

  // Reviews
  setReviewingRequest: (req: ProductRequest | null) => void;
  setEditingReview: (review: Review | null) => void;
  submitReview: (data: {
    requestId: string;
    rating: number;
    writtenReview: string;
  }) => boolean;
  updateReview: (reviewId: string, data: { rating?: number; writtenReview?: string }) => boolean;
  deleteReview: (reviewId: string) => boolean;

  // Search helper
  searchProducts: (params: ProductSearchParams) => Product[];

  // Data helpers
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Sessions
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('guest');
  const [activeBuyer, setActiveBuyer] = useState<BuyerProfile | null>(null);
  const [activeSeller, setActiveSeller] = useState<SellerProfile | null>(null);

  const activeBuyerRef = useRef<BuyerProfile | null>(null);
  const activeSellerRef = useRef<SellerProfile | null>(null);
  activeBuyerRef.current = activeBuyer;
  activeSellerRef.current = activeSeller;

  const [sellerActiveTab, setSellerActiveTab] = useState<SellerTab>('my-products');
  const [buyerActiveTab, setBuyerActiveTab] = useState<BuyerTab>('search');

  // Core Data
  const [products, setProducts] = useState<Product[]>(() => marketplaceService.getAllProducts());
  const [requests, setRequests] = useState<ProductRequest[]>(() => marketplaceService.getAllRequests());
  const [reviews, setReviews] = useState<Review[]>(() => marketplaceService.getAllReviews());

  // Modals & ephemeral state
  const [zoomImage, setZoomImage] = useState<{ url: string; title?: string; storagePath?: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingRequest, setEditingRequest] = useState<ProductRequest | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [requestingProduct, setRequestingProduct] = useState<Product | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<ProductRequest | null>(null);

  const syncStateFromService = () => {
    setProducts(marketplaceService.getAllProducts());
    setRequests(marketplaceService.getAllRequests());
    setReviews(marketplaceService.getAllReviews());
    if (activeSellerRef.current) {
      const refreshedSeller = marketplaceService.getSeller(activeSellerRef.current.shopCode);
      if (refreshedSeller) setActiveSeller(refreshedSeller);
    }
    if (activeBuyerRef.current) {
      const refreshedBuyer = marketplaceService.getBuyer(activeBuyerRef.current.username);
      if (refreshedBuyer) setActiveBuyer(refreshedBuyer);
    }
  };

  // Mount real-time Firestore synchronization and session restoration
  useEffect(() => {
    marketplaceService.initFirestoreSync();

    const unsubscribeService = marketplaceService.subscribe(() => {
      syncStateFromService();
    });

    let unsubscribeAuth = () => {};
    if (isFirebaseConfigured) {
      unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          if (
            activeBuyerRef.current?.uid === firebaseUser.uid ||
            activeSellerRef.current?.uid === firebaseUser.uid
          ) {
            return;
          }
          const resolved = await marketplaceService.getProfileForUser(firebaseUser);
          if (resolved) {
            if (resolved.role === 'buyer') {
              setActiveBuyer(resolved.profile as BuyerProfile);
              setCurrentUserRole('buyer');
            } else if (resolved.role === 'seller') {
              setActiveSeller(resolved.profile as SellerProfile);
              setCurrentUserRole('seller');
            }
          }
        } else {
          marketplaceService.syncRequestsForSession('guest');
        }
      });
    }

    return () => {
      unsubscribeService();
      unsubscribeAuth();
      marketplaceService.dispose();
    };
  }, []);

  const addToast = (text: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openZoom = (url: string, title?: string, storagePath?: string) => {
    setZoomImage({ url, title, storagePath });
  };

  const closeZoom = () => {
    setZoomImage(null);
  };

  const showConfirm = (dialog: Omit<ConfirmDialogState, 'isOpen'>) => {
    setConfirmDialog({ ...dialog, isOpen: true });
  };

  const closeConfirm = () => {
    setConfirmDialog(null);
  };

  const navigateTo = (view: ViewType, tab?: string) => {
    setCurrentView(view);
    if (view === 'seller-dashboard' && tab) {
      setSellerActiveTab(tab as SellerTab);
    } else if (view === 'buyer-dashboard' && tab) {
      setBuyerActiveTab(tab as BuyerTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Auth Operations with Firebase & Firestore mapping
  const loginBuyer = async (username: string, password?: string): Promise<boolean> => {
    const result = await marketplaceService.loginBuyerAsync(username, password);
    if (!result.success || !result.buyer) {
      addToast(result.error || 'Failed to login buyer', 'error');
      return false;
    }

    setActiveBuyer(result.buyer);
    setCurrentUserRole('buyer');
    setCurrentView('buyer-dashboard');
    addToast(`Welcome back, ${result.buyer.username}!`, 'success');
    return true;
  };

  const registerBuyer = async (profileData: Omit<BuyerProfile, 'id'>): Promise<boolean> => {
    const result = await marketplaceService.registerBuyerAsync(profileData);
    if (!result.success || !result.buyer) {
      addToast(result.error || 'Failed to register buyer', 'error');
      return false;
    }

    setActiveBuyer(result.buyer);
    setCurrentUserRole('buyer');
    setCurrentView('buyer-dashboard');
    addToast('Buyer account registered and secured successfully!', 'success');
    syncStateFromService();
    return true;
  };

  const loginSeller = async (shopCode: string, password?: string): Promise<boolean> => {
    const result = await marketplaceService.loginSellerAsync(shopCode, password);
    if (!result.success || !result.seller) {
      addToast(result.error || 'Failed to login seller', 'error');
      return false;
    }

    setActiveSeller(result.seller);
    setCurrentUserRole('seller');
    setCurrentView('seller-dashboard');
    addToast(`Logged in to shop ${result.seller.shopCode}`, 'success');
    return true;
  };

  const registerSeller = async (
    profileData: Omit<SellerProfile, 'id' | 'rating' | 'reviewCount'> & {
      otherCategoryText?: string;
      logoFile?: File;
    }
  ): Promise<boolean> => {
    const { logoFile, ...sellerData } = profileData;
    const result = await marketplaceService.registerSellerAsync(sellerData);
    if (!result.success || !result.seller) {
      addToast(result.error || 'Failed to register seller', 'error');
      return false;
    }

    let finalSeller = result.seller;
    if (logoFile) {
      const uploadRes = await StorageService.uploadImage(
        'seller-logos',
        finalSeller.uid || finalSeller.shopCode,
        logoFile
      );
      if (uploadRes.success && uploadRes.signedUrl) {
        const updated = marketplaceService.updateSellerProfile(finalSeller.shopCode, {
          shopLogo: uploadRes.signedUrl,
          shopLogoStoragePath: uploadRes.storagePath,
        });
        if (updated.success && updated.seller) {
          finalSeller = updated.seller;
        }
      } else {
        addToast(
          uploadRes.error || 'Shop created, but logo upload failed. You can retry from Seller Profile.',
          'warning'
        );
      }
    }

    setActiveSeller(finalSeller);
    setCurrentUserRole('seller');
    setCurrentView('seller-dashboard');
    addToast(`Shop registered successfully with code ${finalSeller.shopCode}!`, 'success');
    syncStateFromService();
    return true;
  };

  const updateBuyerProfile = (updates: Partial<BuyerProfile>) => {
    if (!activeBuyer) {
      addToast('Please log in as a buyer to update your profile', 'error');
      return;
    }
    const res = marketplaceService.updateBuyerProfile(activeBuyer.username, updates);
    if (!res.success || !res.buyer) {
      addToast(res.error || 'Failed to update profile', 'error');
      return;
    }
    setActiveBuyer(res.buyer);
    addToast('Profile updated and saved!', 'success');
  };

  const updateSellerProfile = (updates: Partial<SellerProfile>) => {
    if (!activeSeller) {
      addToast('Please log in as a seller to update your shop profile', 'error');
      return;
    }
    const res = marketplaceService.updateSellerProfile(activeSeller.shopCode, updates);
    if (!res.success || !res.seller) {
      addToast(res.error || 'Failed to update shop profile', 'error');
      return;
    }
    setActiveSeller(res.seller);
    addToast('Shop profile updated and saved!', 'success');
  };

  const logout = async () => {
    await marketplaceService.logoutAsync();
    setCurrentUserRole('guest');
    setActiveBuyer(null);
    setActiveSeller(null);
    setEditingProduct(null);
    setEditingRequest(null);
    setEditingReview(null);
    setRequestingProduct(null);
    setReviewingRequest(null);
    setCurrentView('home');
    addToast('Logged out safely.', 'info');
  };

  // 2. Product Management
  const saveProduct = (productData: Omit<Product, 'id' | 'createdAt'> & { id?: string }): boolean => {
    const sellerCode = activeSeller?.shopCode;
    if (!sellerCode) {
      addToast('Please sign in as a seller to manage products', 'error');
      return false;
    }

    if (productData.id) {
      // Editing existing product
      const existingProd = products.find((p) => p.id === productData.id);
      const res = marketplaceService.updateProduct(sellerCode, productData.id, productData);
      if (!res.success) {
        addToast(res.error || 'Failed to update product', 'error');
        return false;
      }
      if (
        existingProd?.imageStoragePath &&
        existingProd.imageStoragePath !== productData.imageStoragePath
      ) {
        StorageService.deleteImage(existingProd.imageStoragePath).catch(() => {});
      }
      addToast(`Product "${productData.productName}" updated!`, 'success');
      setEditingProduct(null);
    } else {
      // Creating new product
      const res = marketplaceService.createProduct(sellerCode, {
        productName: productData.productName,
        category: productData.category,
        price: productData.price,
        minOrderQty: productData.minOrderQty,
        image: productData.image,
        imageStoragePath: productData.imageStoragePath,
        description: productData.description,
        paymentMode: productData.paymentMode,
      });

      if (!res.success) {
        addToast(res.error || 'Failed to publish product', 'error');
        return false;
      }
      addToast(`Product "${productData.productName}" published successfully!`, 'success');
    }

    syncStateFromService();
    setSellerActiveTab('my-products');
    return true;
  };

  const deleteProduct = (id: string): boolean => {
    const sellerCode = activeSeller?.shopCode;
    if (!sellerCode) {
      addToast('Please sign in as a seller to delete products', 'error');
      return false;
    }
    const prod = products.find((p) => p.id === id);

    showConfirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${prod?.productName || 'this item'}"? This action cannot be undone.`,
      confirmText: 'Delete Product',
      isDestructive: true,
      onConfirm: () => {
        const res = marketplaceService.deleteProduct(sellerCode, id);
        if (!res.success) {
          addToast(res.error || 'Failed to delete product', 'error');
        } else {
          if (prod?.imageStoragePath) {
            StorageService.deleteImage(prod.imageStoragePath).catch(() => {});
          }
          addToast('Product deleted from inventory', 'info');
          syncStateFromService();
        }
      },
    });
    return true;
  };

  // 3. Search helper
  const searchProducts = (params: ProductSearchParams) => {
    return marketplaceService.searchProducts(params);
  };

  // 4. Request Operations
  const submitStandardRequest = ({
    product,
    quantity,
    paymentMode,
    expectedDeliveryDate,
    customDescription,
  }: {
    product: Product;
    quantity: number;
    paymentMode: PaymentMode;
    expectedDeliveryDate: string;
    customDescription?: string;
  }): boolean => {
    const buyerUsername = activeBuyer?.username;
    if (!buyerUsername) {
      addToast('Please sign in as a buyer to submit a product request', 'error');
      return false;
    }
    const res = marketplaceService.createProductRequest(buyerUsername, product.id, {
      quantity,
      paymentMode,
      expectedDeliveryDate,
      customDescription,
    });

    if (!res.success) {
      addToast(res.error || 'Failed to submit request', 'error');
      return false;
    }

    syncStateFromService();
    setRequestingProduct(null);
    setBuyerActiveTab('pending');
    addToast('Product request sent to seller!', 'success');
    return true;
  };

  const submitCustomRequest = ({
    category,
    expectedDeliveryDate,
    quantity,
    paymentMode,
    title,
    specifications,
    sampleImage,
    sampleStoragePath,
  }: {
    category: string;
    expectedDeliveryDate: string;
    quantity: number;
    paymentMode: PaymentMode;
    title: string;
    specifications: string;
    sampleImage?: string;
    sampleStoragePath?: string;
  }): boolean => {
    const buyerUsername = activeBuyer?.username;
    if (!buyerUsername) {
      addToast('Please sign in as a buyer to submit a custom request', 'error');
      return false;
    }
    const res = marketplaceService.createCustomRequest(buyerUsername, {
      category,
      expectedDeliveryDate,
      quantity,
      paymentMode,
      title,
      specifications,
      sampleImage,
      sampleStoragePath,
    });

    if (!res.success) {
      addToast(res.error || 'Failed to broadcast custom request', 'error');
      return false;
    }

    syncStateFromService();
    setBuyerActiveTab('pending');
    addToast('Customized product request broadcasted to sellers!', 'success');
    return true;
  };

  const updateRequestStatus = (requestId: string, status: RequestStatus, reason?: string) => {
    const sellerCode = activeSeller?.shopCode;
    if (!sellerCode) {
      addToast('Please sign in as a seller to update requests', 'error');
      return;
    }

    if (status === 'accepted') {
      const res = marketplaceService.acceptRequest(sellerCode, requestId);
      if (!res.success) {
        addToast(res.error || 'Failed to accept request', 'error');
        return;
      }
      addToast('Request accepted and in preparation!', 'success');
    } else if (status === 'rejected') {
      const res = marketplaceService.rejectRequest(sellerCode, requestId, reason || 'Unable to fulfill');
      if (!res.success) {
        addToast(res.error || 'Failed to reject request', 'error');
        return;
      }
      addToast('Request rejected with feedback note.', 'info');
    }

    syncStateFromService();
  };

  // Independent Order Completion
  const markOrderCompletedBySeller = (requestId: string): boolean => {
    const sellerCode = activeSeller?.shopCode;
    if (!sellerCode) {
      addToast('Please sign in as a seller to complete orders', 'error');
      return false;
    }
    const res = marketplaceService.markOrderCompletedBySeller(sellerCode, requestId);
    if (!res.success) {
      addToast(res.error || 'Failed to complete order', 'error');
      return false;
    }

    syncStateFromService();
    addToast('Order marked as completed by seller!', 'success');
    return true;
  };

  const markOrderCompletedByBuyer = (requestId: string): boolean => {
    const buyerUsername = activeBuyer?.username;
    if (!buyerUsername) {
      addToast('Please sign in as a buyer to confirm delivery', 'error');
      return false;
    }
    const res = marketplaceService.markOrderCompletedByBuyer(buyerUsername, requestId);
    if (!res.success) {
      addToast(res.error || 'Failed to complete order', 'error');
      return false;
    }

    syncStateFromService();
    addToast('Order confirmed as received and completed! You can now leave a review.', 'success');
    return true;
  };

  const updateRequest = (requestId: string, updates: Partial<ProductRequest>): boolean => {
    const buyerUsername = activeBuyer?.username;
    if (!buyerUsername) {
      addToast('Please sign in as a buyer to edit requests', 'error');
      return false;
    }
    const res = marketplaceService.updateProductRequest(buyerUsername, requestId, updates);

    if (!res.success) {
      addToast(res.error || 'Failed to update request', 'error');
      return false;
    }

    syncStateFromService();
    setEditingRequest(null);
    addToast('Request details updated successfully!', 'success');
    return true;
  };

  const deleteRequest = (requestId: string): boolean => {
    const buyerUsername = activeBuyer?.username;
    if (!buyerUsername) {
      addToast('Please sign in as a buyer to cancel requests', 'error');
      return false;
    }

    showConfirm({
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel and delete this order request?',
      confirmText: 'Cancel Order Request',
      isDestructive: true,
      onConfirm: () => {
        const res = marketplaceService.deleteProductRequest(buyerUsername, requestId);
        if (!res.success) {
          addToast(res.error || 'Failed to cancel request', 'error');
        } else {
          syncStateFromService();
          addToast('Request cancelled successfully', 'info');
        }
      },
    });
    return true;
  };

  // 5. Review Operations
  const submitReview = ({
    requestId,
    rating,
    writtenReview,
  }: {
    requestId: string;
    rating: number;
    writtenReview: string;
  }): boolean => {
    const buyerUsername = activeBuyer?.username;
    if (!buyerUsername) {
      addToast('Please sign in as a buyer to submit reviews', 'error');
      return false;
    }
    const res = marketplaceService.addReview(buyerUsername, requestId, {
      rating,
      writtenReview,
    });

    if (!res.success) {
      addToast(res.error || 'Failed to submit review', 'error');
      return false;
    }

    syncStateFromService();
    setReviewingRequest(null);
    addToast('Thank you! Your verified review has been published.', 'success');
    return true;
  };

  const updateReview = (reviewId: string, data: { rating?: number; writtenReview?: string }): boolean => {
    const buyerUsername = activeBuyer?.username;
    if (!buyerUsername) {
      addToast('Please sign in as a buyer to update reviews', 'error');
      return false;
    }
    const res = marketplaceService.editReview(buyerUsername, reviewId, data);

    if (!res.success) {
      addToast(res.error || 'Failed to update review', 'error');
      return false;
    }

    syncStateFromService();
    setEditingReview(null);
    addToast('Review updated successfully!', 'success');
    return true;
  };

  const deleteReview = (reviewId: string): boolean => {
    const buyerUsername = activeBuyer?.username;
    if (!buyerUsername) {
      addToast('Please sign in as a buyer to delete reviews', 'error');
      return false;
    }

    showConfirm({
      title: 'Delete Review',
      message: 'Are you sure you want to delete your review? This action cannot be undone.',
      confirmText: 'Delete Review',
      isDestructive: true,
      onConfirm: () => {
        const res = marketplaceService.deleteReview(buyerUsername, reviewId);
        if (!res.success) {
          addToast(res.error || 'Failed to delete review', 'error');
        } else {
          syncStateFromService();
          addToast('Review deleted', 'info');
        }
      },
    });
    return true;
  };

  const resetToDefaultData = () => {
    marketplaceService.seedInitialData();
    syncStateFromService();
    setActiveBuyer(marketplaceService.getBuyer('ananya_kumar') || null);
    setActiveSeller(marketplaceService.getSeller('SHOP-101') || null);
    addToast('Reset to demo sample data and rules', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        currentUserRole,
        activeBuyer,
        activeSeller,
        sellerActiveTab,
        buyerActiveTab,
        products,
        requests,
        reviews,
        zoomImage,
        confirmDialog,
        toasts,
        editingProduct,
        editingRequest,
        editingReview,
        requestingProduct,
        reviewingRequest,
        navigateTo,
        setSellerActiveTab,
        setBuyerActiveTab,
        openZoom,
        closeZoom,
        showConfirm,
        closeConfirm,
        addToast,
        dismissToast,
        loginBuyer,
        registerBuyer,
        loginSeller,
        registerSeller,
        updateBuyerProfile,
        updateSellerProfile,
        logout,
        setEditingProduct,
        saveProduct,
        deleteProduct,
        setRequestingProduct,
        setEditingRequest,
        setEditingReview,
        submitStandardRequest,
        submitCustomRequest,
        updateRequestStatus,
        markOrderCompletedBySeller,
        markOrderCompletedByBuyer,
        updateRequest,
        deleteRequest,
        setReviewingRequest,
        submitReview,
        updateReview,
        deleteReview,
        searchProducts,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
