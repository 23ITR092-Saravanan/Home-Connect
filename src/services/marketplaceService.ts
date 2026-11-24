import {
  BuyerProfile,
  SellerProfile,
  Product,
  ProductRequest,
  Review,
  PaymentMode,
  RequestStatus,
} from '../types';
import {
  INITIAL_BUYER,
  INITIAL_SELLER,
  INITIAL_PRODUCTS,
  INITIAL_REQUESTS,
  INITIAL_REVIEWS,
} from '../data/mockData';
import { ValidationService } from './validationService';
import {
  auth,
  db,
  isFirebaseConfigured,
  handleFirestoreError,
} from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

export interface ProductSearchParams {
  categories?: string[];
  district?: string;
  pincode?: string;
  search?: string;
}

export interface CustomRequestSearchParams {
  categories?: string[];
  district?: string;
  pincode?: string;
  search?: string;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export class MarketplaceService {
  private buyers: Map<string, BuyerProfile> = new Map();
  private sellers: Map<string, SellerProfile> = new Map();
  private products: Map<string, Product> = new Map();
  private requests: Map<string, ProductRequest> = new Map();
  private reviews: Map<string, Review> = new Map();

  private directRequestsMap: Map<string, ProductRequest> = new Map();
  private openMarketRequestsMap: Map<string, ProductRequest> = new Map();
  private currentRequestsSessionKey: string | null = null;

  private changeListeners: Set<() => void> = new Set();
  private firestoreUnsubscribers: Unsubscribe[] = [];
  private requestsUnsubscribers: Unsubscribe[] = [];
  private isInitialized = false;
  private isUnitTestMode: boolean;

  constructor(isTestEnvironment: boolean = typeof window === 'undefined') {
    this.isUnitTestMode = isTestEnvironment;
    if (isTestEnvironment) {
      this.seedInitialData();
    }
  }

  private get canSyncFirestore(): boolean {
    return !this.isUnitTestMode && isFirebaseConfigured && Boolean(auth.currentUser);
  }

  public subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.changeListeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in change listener:', err);
      }
    }
  }

  public seedInitialData(): void {
    this.buyers.clear();
    this.sellers.clear();
    this.products.clear();
    this.requests.clear();
    this.reviews.clear();

    // Default buyer
    this.buyers.set(INITIAL_BUYER.username.toLowerCase(), { ...INITIAL_BUYER });

    // Default sellers
    this.sellers.set(INITIAL_SELLER.shopCode.toUpperCase(), { ...INITIAL_SELLER });
    this.sellers.set('SHOP-204', {
      id: 'seller-204',
      username: 'purevalley_madurai',
      emailId: 'honey@purevalley.com',
      password: 'password123',
      contactNumber: '+91 94451 88990',
      district: 'Madurai',
      pincode: '625001',
      categories: ['Organic Foods & Spices'],
      shopCode: 'SHOP-204',
      address: '15 Anna Nagar, Madurai',
      rating: 4.9,
      reviewCount: 24,
    });
    this.sellers.set('SHOP-308', {
      id: 'seller-308',
      username: 'heritage_wood',
      emailId: 'woodcraft@heritage.com',
      password: 'password123',
      contactNumber: '+91 98401 55660',
      district: 'Chennai',
      pincode: '600001',
      categories: ['Woodcraft & Bamboo'],
      shopCode: 'SHOP-308',
      address: '77 Broadway, George Town, Chennai',
      rating: 4.7,
      reviewCount: 16,
    });

    // Products
    INITIAL_PRODUCTS.forEach((p) => this.products.set(p.id, { ...p }));

    // Requests
    INITIAL_REQUESTS.forEach((r) => this.requests.set(r.id, { ...r }));

    // Reviews
    INITIAL_REVIEWS.forEach((rev) => this.reviews.set(rev.id, { ...rev }));
  }

  // ==========================================
  // FIRESTORE LIVE SYNC & REALTIME LISTENERS
  // ==========================================

  public async initFirestoreSync(): Promise<void> {
    if (this.isInitialized || !isFirebaseConfigured) return;
    this.isInitialized = true;

    try {
      // 1. Sync sellers collection
      const unsubSellers = onSnapshot(
        collection(db, 'sellers'),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as SellerProfile;
            if (change.type === 'removed') {
              this.sellers.delete(data.shopCode.toUpperCase());
            } else {
              this.sellers.set(data.shopCode.toUpperCase(), {
                ...data,
                id: change.doc.id,
              });
            }
          });
          this.notifyListeners();
        },
        (error) => {
          handleFirestoreError(error, 'Listening to sellers');
        }
      );
      this.firestoreUnsubscribers.push(unsubSellers);

      // 2. Sync products collection
      const unsubProducts = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Product;
            if (change.type === 'removed') {
              this.products.delete(change.doc.id);
            } else {
              this.products.set(change.doc.id, {
                ...data,
                id: change.doc.id,
              });
            }
          });
          this.notifyListeners();
        },
        (error) => {
          handleFirestoreError(error, 'Listening to products');
        }
      );
      this.firestoreUnsubscribers.push(unsubProducts);

      // 3. Sync reviews collection
      const unsubReviews = onSnapshot(
        collection(db, 'reviews'),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Review;
            if (change.type === 'removed') {
              this.reviews.delete(change.doc.id);
            } else {
              this.reviews.set(change.doc.id, {
                ...data,
                id: change.doc.id,
              });
            }
          });
          this.notifyListeners();
        },
        (error) => {
          handleFirestoreError(error, 'Listening to reviews');
        }
      );
      this.firestoreUnsubscribers.push(unsubReviews);
    } catch (err) {
      console.warn('Could not initialize real-time Firestore listeners:', err);
    }
  }

  private setOptimisticRequest(request: ProductRequest): void {
    this.requests.set(request.id, request);
    if (!this.isUnitTestMode && isFirebaseConfigured) {
      if (this.currentRequestsSessionKey?.startsWith('seller:') && request.sellerShopCode === 'OPEN-MARKET') {
        this.directRequestsMap.delete(request.id);
        this.openMarketRequestsMap.set(request.id, request);
      } else {
        this.openMarketRequestsMap.delete(request.id);
        this.directRequestsMap.set(request.id, request);
      }
    }
  }

  private deleteOptimisticRequest(requestId: string): void {
    this.requests.delete(requestId);
    this.directRequestsMap.delete(requestId);
    this.openMarketRequestsMap.delete(requestId);
  }

  private rebuildRequestsAndNotify(): void {
    this.requests.clear();
    for (const [id, req] of this.openMarketRequestsMap) {
      this.requests.set(id, req);
    }
    for (const [id, req] of this.directRequestsMap) {
      this.requests.set(id, req);
    }
    this.notifyListeners();
  }

  public syncRequestsForSession(role: 'buyer' | 'seller' | 'guest', uid?: string): void {
    if (this.isUnitTestMode || !isFirebaseConfigured) return;

    const nextKey = role === 'guest' || !uid || !auth.currentUser ? 'guest' : `${role}:${uid}`;
    if (this.currentRequestsSessionKey === nextKey) return;

    for (const unsub of this.requestsUnsubscribers) {
      try {
        unsub();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.requestsUnsubscribers = [];
    this.directRequestsMap.clear();
    this.openMarketRequestsMap.clear();
    this.requests.clear();
    this.currentRequestsSessionKey = nextKey;

    if (nextKey === 'guest' || !uid) {
      this.notifyListeners();
      return;
    }

    if (role === 'buyer') {
      const buyerQuery = query(collection(db, 'requests'), where('buyerUid', '==', uid));
      const unsubBuyerReqs = onSnapshot(
        buyerQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as ProductRequest;
            if (change.type === 'removed') {
              this.directRequestsMap.delete(change.doc.id);
            } else {
              this.directRequestsMap.set(change.doc.id, {
                ...data,
                id: change.doc.id,
              });
            }
          });
          this.rebuildRequestsAndNotify();
        },
        (error) => {
          handleFirestoreError(error, 'Listening to buyer requests');
        }
      );
      this.requestsUnsubscribers.push(unsubBuyerReqs);
      return;
    }

    if (role === 'seller') {
      const sellerDirectQuery = query(collection(db, 'requests'), where('sellerUid', '==', uid));
      const unsubSellerDirect = onSnapshot(
        sellerDirectQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as ProductRequest;
            if (change.type === 'removed') {
              this.directRequestsMap.delete(change.doc.id);
            } else {
              this.directRequestsMap.set(change.doc.id, {
                ...data,
                id: change.doc.id,
              });
            }
          });
          this.rebuildRequestsAndNotify();
        },
        (error) => {
          handleFirestoreError(error, 'Listening to seller requests');
        }
      );

      const openMarketQuery = query(collection(db, 'requests'), where('sellerShopCode', '==', 'OPEN-MARKET'));
      const unsubOpenMarket = onSnapshot(
        openMarketQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as ProductRequest;
            if (change.type === 'removed') {
              this.openMarketRequestsMap.delete(change.doc.id);
            } else {
              this.openMarketRequestsMap.set(change.doc.id, {
                ...data,
                id: change.doc.id,
              });
            }
          });
          this.rebuildRequestsAndNotify();
        },
        (error) => {
          handleFirestoreError(error, 'Listening to open-market requests');
        }
      );

      this.requestsUnsubscribers.push(unsubSellerDirect, unsubOpenMarket);
    }
  }

  public dispose(): void {
    for (const unsub of this.firestoreUnsubscribers) {
      try {
        unsub();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.firestoreUnsubscribers = [];
    for (const unsub of this.requestsUnsubscribers) {
      try {
        unsub();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.requestsUnsubscribers = [];
    this.directRequestsMap.clear();
    this.openMarketRequestsMap.clear();
    this.currentRequestsSessionKey = null;
    this.isInitialized = false;
  }

  // ==========================================
  // 1. REGISTRATION & LOGIN LOGIC
  // ==========================================

  public registerBuyer(data: Omit<BuyerProfile, 'id'>): { success: boolean; buyer?: BuyerProfile; error?: string } {
    const validation = ValidationService.validateBuyerRegistration(data);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    const key = data.username.trim().toLowerCase();
    if (this.buyers.has(key)) {
      return { success: false, error: `Username "${data.username.trim()}" is already taken.` };
    }

    const newBuyer: BuyerProfile = {
      id: `buyer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'buyer',
      username: data.username.trim(),
      password: data.password,
      contactNumber: data.contactNumber.trim(),
      district: data.district,
      deliveryAddress: data.deliveryAddress.trim(),
      pincode: data.pincode.trim(),
      createdAt: new Date().toISOString(),
    };

    this.buyers.set(key, newBuyer);
    this.notifyListeners();
    return { success: true, buyer: newBuyer };
  }

  public async registerBuyerAsync(
    data: Omit<BuyerProfile, 'id'>
  ): Promise<{ success: boolean; buyer?: BuyerProfile; error?: string }> {
    const validation = ValidationService.validateBuyerRegistration(data);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    if (!isFirebaseConfigured || this.isUnitTestMode) {
      return this.registerBuyer(data);
    }

    const cleanUsername = data.username.trim();
    const usernameKey = cleanUsername.toLowerCase();

    if (this.buyers.has(usernameKey)) {
      return { success: false, error: `Username "${cleanUsername}" is already taken.` };
    }

    // Check in Firestore username registry
    try {
      const usernameDocRef = doc(db, 'usernames', usernameKey);
      const existingUserDoc = await getDoc(usernameDocRef);
      if (existingUserDoc.exists()) {
        return { success: false, error: `Username "${cleanUsername}" is already taken.` };
      }
    } catch (checkErr) {
      console.warn('Username uniqueness pre-check error:', checkErr);
    }

    // Secure namespace mapping for Firebase Authentication
    const internalEmail = `buyer_${usernameKey}@homeconnect.internal`;
    const password = data.password || 'TemporaryPass123!';

    let createdUser: User | null = null;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, internalEmail, password);
      createdUser = userCred.user;
      const uid = createdUser.uid;

      const newBuyer: BuyerProfile = {
        id: uid,
        uid: uid,
        role: 'buyer',
        username: cleanUsername,
        contactNumber: data.contactNumber.trim(),
        district: data.district,
        deliveryAddress: data.deliveryAddress.trim(),
        pincode: data.pincode.trim(),
        createdAt: new Date().toISOString(),
      };

      // Persist to Firestore cleanly (no undefined fields)
      await setDoc(doc(db, 'buyers', uid), stripUndefined(newBuyer as unknown as Record<string, unknown>));
      await setDoc(doc(db, 'usernames', usernameKey), {
        username: cleanUsername,
        uid: uid,
        role: 'buyer',
        createdAt: new Date().toISOString(),
      });

      this.buyers.set(usernameKey, newBuyer);
      this.syncRequestsForSession('buyer', uid);
      this.notifyListeners();
      return { success: true, buyer: newBuyer };
    } catch (authError: unknown) {
      // Roll back orphaned Firebase Auth user if Firestore persistence failed
      if (createdUser) {
        await createdUser.delete().catch(() => {});
      }

      const firebaseError = authError as { code?: string; message?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        return { success: false, error: `Username "${cleanUsername}" is already registered.` };
      }
      if (firebaseError.code === 'auth/weak-password') {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }
      return {
        success: false,
        error: handleFirestoreError(authError, 'Buyer Registration'),
      };
    }
  }

  public loginBuyer(username: string, password?: string): { success: boolean; buyer?: BuyerProfile; error?: string } {
    if (!username || !username.trim()) {
      return { success: false, error: 'Username is required' };
    }
    if (!password || !password.trim()) {
      return { success: false, error: 'Password is required' };
    }

    const buyer = this.buyers.get(username.trim().toLowerCase());
    if (!buyer) {
      return { success: false, error: 'Buyer account not found with this username' };
    }

    if (buyer.password && buyer.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    return { success: true, buyer };
  }

  public async loginBuyerAsync(
    username: string,
    password?: string
  ): Promise<{ success: boolean; buyer?: BuyerProfile; error?: string }> {
    if (!username || !username.trim()) {
      return { success: false, error: 'Username is required' };
    }
    if (!password || !password.trim()) {
      return { success: false, error: 'Password is required' };
    }

    const usernameKey = username.trim().toLowerCase();
    const internalEmail = `buyer_${usernameKey}@homeconnect.internal`;

    try {
      const userCred = await signInWithEmailAndPassword(auth, internalEmail, password);
      const uid = userCred.user.uid;

      // Fetch persistent buyer profile from Firestore
      const buyerDoc = await getDoc(doc(db, 'buyers', uid));
      if (buyerDoc.exists()) {
        const buyer = buyerDoc.data() as BuyerProfile;
        this.buyers.set(usernameKey, buyer);
        this.syncRequestsForSession('buyer', uid);
        this.notifyListeners();
        return { success: true, buyer };
      }

      // Check if username mapping exists
      const fallbackBuyer: BuyerProfile = {
        id: uid,
        uid: uid,
        role: 'buyer',
        username: username.trim(),
        contactNumber: '+91 98765 43210',
        district: 'Coimbatore',
        deliveryAddress: 'Home Connect Buyer Address',
        pincode: '641002',
      };
      this.buyers.set(usernameKey, fallbackBuyer);
      this.syncRequestsForSession('buyer', uid);
      return { success: true, buyer: fallbackBuyer };
    } catch (authError: unknown) {
      // If user exists in local fixtures (e.g. demo buyer "ananya_kumar"), support instant demo login
      const localResult = this.loginBuyer(username, password);
      if (localResult.success) {
        return localResult;
      }

      const firebaseError = authError as { code?: string; message?: string };
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
        return { success: false, error: 'Buyer account not found or password incorrect.' };
      }
      return { success: false, error: firebaseError.message || 'Login failed. Please check credentials.' };
    }
  }

  public registerSeller(
    data: Omit<SellerProfile, 'id' | 'rating' | 'reviewCount'> & { otherCategoryText?: string }
  ): { success: boolean; seller?: SellerProfile; error?: string } {
    const validation = ValidationService.validateSellerRegistration(data);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    const shopCodeKey = data.shopCode.trim().toUpperCase();
    if (this.sellers.has(shopCodeKey)) {
      return { success: false, error: `Shop Code "${shopCodeKey}" is already registered.` };
    }

    // Check duplicate email
    const emailKey = data.emailId.trim().toLowerCase();
    for (const existingSeller of this.sellers.values()) {
      if (existingSeller.emailId.toLowerCase() === emailKey) {
        return { success: false, error: `Email "${data.emailId}" is already registered to another shop.` };
      }
    }

    const processedCategories = data.categories.map((c) =>
      c === 'Others' && data.otherCategoryText?.trim()
        ? `Others (${data.otherCategoryText.trim()})`
        : c
    );

    const newSeller: SellerProfile = {
      id: `seller-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'seller',
      username: data.username.trim(),
      emailId: data.emailId.trim(),
      password: data.password,
      contactNumber: data.contactNumber.trim(),
      district: data.district,
      pincode: data.pincode.trim(),
      categories: processedCategories,
      shopCode: shopCodeKey,
      shopLogo: data.shopLogo?.trim() || undefined,
      shopLogoStoragePath: data.shopLogoStoragePath?.trim() || undefined,
      address: data.address.trim(),
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.sellers.set(shopCodeKey, newSeller);
    this.notifyListeners();
    return { success: true, seller: newSeller };
  }

  public async registerSellerAsync(
    data: Omit<SellerProfile, 'id' | 'rating' | 'reviewCount'> & { otherCategoryText?: string }
  ): Promise<{ success: boolean; seller?: SellerProfile; error?: string }> {
    const validation = ValidationService.validateSellerRegistration(data);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    if (!isFirebaseConfigured || this.isUnitTestMode) {
      return this.registerSeller(data);
    }

    const shopCodeKey = data.shopCode.trim().toUpperCase();
    const emailKey = data.emailId.trim().toLowerCase();

    if (this.sellers.has(shopCodeKey)) {
      return { success: false, error: `Shop Code "${shopCodeKey}" is already registered.` };
    }

    for (const existingSeller of this.sellers.values()) {
      if (existingSeller.emailId.toLowerCase() === emailKey) {
        return { success: false, error: `Email "${data.emailId}" is already registered to another shop.` };
      }
    }

    // Check in Firestore shopCode and sellers email registry
    try {
      const shopCodeDocRef = doc(db, 'shopCodes', shopCodeKey);
      const existingShopDoc = await getDoc(shopCodeDocRef);
      if (existingShopDoc.exists()) {
        return { success: false, error: `Shop Code "${shopCodeKey}" is already registered.` };
      }

      const emailSnap = await getDocs(
        query(collection(db, 'sellers'), where('emailId', '==', data.emailId.trim()))
      );
      if (!emailSnap.empty) {
        return { success: false, error: `Email "${data.emailId}" is already registered to another shop.` };
      }
    } catch (checkErr) {
      console.warn('Seller uniqueness pre-check error:', checkErr);
    }

    const internalEmail = `seller_${shopCodeKey.toLowerCase()}@homeconnect.internal`;
    const password = data.password || 'TemporaryPass123!';

    let createdUser: User | null = null;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, internalEmail, password);
      createdUser = userCred.user;
      const uid = createdUser.uid;

      const processedCategories = data.categories.map((c) =>
        c === 'Others' && data.otherCategoryText?.trim()
          ? `Others (${data.otherCategoryText.trim()})`
          : c
      );

      const newSeller: SellerProfile = {
        id: uid,
        uid: uid,
        role: 'seller',
        username: data.username.trim(),
        emailId: data.emailId.trim(),
        contactNumber: data.contactNumber.trim(),
        district: data.district,
        pincode: data.pincode.trim(),
        categories: processedCategories,
        shopCode: shopCodeKey,
        shopLogo: data.shopLogo?.trim() || undefined,
        shopLogoStoragePath: data.shopLogoStoragePath?.trim() || undefined,
        address: data.address.trim(),
        rating: 5.0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };

      // Persist seller profile and shop code mapping to Firestore (stripping undefined optional fields)
      await setDoc(doc(db, 'sellers', uid), stripUndefined(newSeller as unknown as Record<string, unknown>));
      await setDoc(doc(db, 'shopCodes', shopCodeKey), {
        shopCode: shopCodeKey,
        uid: uid,
        role: 'seller',
        createdAt: new Date().toISOString(),
      });

      this.sellers.set(shopCodeKey, newSeller);
      this.syncRequestsForSession('seller', uid);
      this.notifyListeners();
      return { success: true, seller: newSeller };
    } catch (authError: unknown) {
      if (createdUser) {
        await createdUser.delete().catch(() => {});
      }

      const firebaseError = authError as { code?: string; message?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        return { success: false, error: `Shop Code "${shopCodeKey}" is already registered.` };
      }
      if (firebaseError.code === 'auth/weak-password') {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      return {
        success: false,
        error: handleFirestoreError(authError, 'Seller Registration'),
      };
    }
  }

  public loginSeller(shopCode: string, password?: string): { success: boolean; seller?: SellerProfile; error?: string } {
    if (!shopCode || !shopCode.trim()) {
      return { success: false, error: 'Shop Code is required' };
    }
    if (!password || !password.trim()) {
      return { success: false, error: 'Password is required' };
    }

    const seller = this.sellers.get(shopCode.trim().toUpperCase());
    if (!seller) {
      return { success: false, error: 'Seller shop not found with this Shop Code' };
    }

    if (seller.password && seller.password !== password) {
      return { success: false, error: 'Incorrect password for this shop code' };
    }

    return { success: true, seller };
  }

  public async loginSellerAsync(
    shopCode: string,
    password?: string
  ): Promise<{ success: boolean; seller?: SellerProfile; error?: string }> {
    if (!shopCode || !shopCode.trim()) {
      return { success: false, error: 'Shop Code is required' };
    }
    if (!password || !password.trim()) {
      return { success: false, error: 'Password is required' };
    }

    const shopCodeKey = shopCode.trim().toUpperCase();
    const internalEmail = `seller_${shopCodeKey.toLowerCase()}@homeconnect.internal`;

    try {
      const userCred = await signInWithEmailAndPassword(auth, internalEmail, password);
      const uid = userCred.user.uid;

      // Fetch persistent seller profile from Firestore
      const sellerDoc = await getDoc(doc(db, 'sellers', uid));
      if (sellerDoc.exists()) {
        const seller = sellerDoc.data() as SellerProfile;
        this.sellers.set(shopCodeKey, seller);
        this.syncRequestsForSession('seller', uid);
        this.notifyListeners();
        return { success: true, seller };
      }

      const existingLocal = this.sellers.get(shopCodeKey);
      if (existingLocal) {
        this.syncRequestsForSession('seller', uid);
        return { success: true, seller: existingLocal };
      }

      return { success: false, error: 'Shop profile not found.' };
    } catch (authError: unknown) {
      const localResult = this.loginSeller(shopCode, password);
      if (localResult.success) {
        return localResult;
      }

      const firebaseError = authError as { code?: string; message?: string };
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
        return { success: false, error: 'Shop Code not found or password incorrect.' };
      }
      return { success: false, error: firebaseError.message || 'Login failed.' };
    }
  }

  public async logoutAsync(): Promise<void> {
    this.syncRequestsForSession('guest');
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
  }

  public async getProfileForUser(user: User): Promise<{ role: 'buyer' | 'seller'; profile: BuyerProfile | SellerProfile } | null> {
    // Check in-memory caches first to avoid redundant Firestore reads after login/registration
    for (const seller of this.sellers.values()) {
      if (seller.uid === user.uid || seller.id === user.uid) {
        this.syncRequestsForSession('seller', user.uid);
        return { role: 'seller', profile: seller };
      }
    }
    for (const buyer of this.buyers.values()) {
      if (buyer.uid === user.uid || buyer.id === user.uid) {
        this.syncRequestsForSession('buyer', user.uid);
        return { role: 'buyer', profile: buyer };
      }
    }

    try {
      const sellerDoc = await getDoc(doc(db, 'sellers', user.uid));
      if (sellerDoc.exists()) {
        const seller = sellerDoc.data() as SellerProfile;
        this.sellers.set(seller.shopCode.toUpperCase(), seller);
        this.syncRequestsForSession('seller', user.uid);
        return { role: 'seller', profile: seller };
      }

      const buyerDoc = await getDoc(doc(db, 'buyers', user.uid));
      if (buyerDoc.exists()) {
        const buyer = buyerDoc.data() as BuyerProfile;
        this.buyers.set(buyer.username.toLowerCase(), buyer);
        this.syncRequestsForSession('buyer', user.uid);
        return { role: 'buyer', profile: buyer };
      }
    } catch (err) {
      console.warn('Error resolving profile for auth user:', err);
    }
    return null;
  }

  public getSeller(shopCode: string): SellerProfile | undefined {
    return this.sellers.get(shopCode.toUpperCase());
  }

  public getBuyer(username: string): BuyerProfile | undefined {
    return this.buyers.get(username.toLowerCase());
  }

  public updateBuyerProfile(
    username: string,
    updates: Partial<BuyerProfile>
  ): { success: boolean; buyer?: BuyerProfile; error?: string } {
    const key = username.trim().toLowerCase();
    const existing = this.buyers.get(key);
    if (!existing) {
      return { success: false, error: 'Buyer profile not found' };
    }

    const updated: BuyerProfile = {
      ...existing,
      contactNumber: updates.contactNumber?.trim() || existing.contactNumber,
      district: updates.district?.trim() || existing.district,
      deliveryAddress: updates.deliveryAddress?.trim() || existing.deliveryAddress,
      pincode: updates.pincode?.trim() || existing.pincode,
    };

    this.buyers.set(key, updated);
    this.notifyListeners();

    const docId = updated.uid || updated.id;
    if (this.canSyncFirestore && docId) {
      setDoc(
        doc(db, 'buyers', docId),
        stripUndefined(updated as unknown as Record<string, unknown>),
        { merge: true }
      ).catch((err) => {
        console.warn('Could not persist buyer profile update to Firestore:', err);
      });
    }

    return { success: true, buyer: updated };
  }

  public updateSellerProfile(
    shopCode: string,
    updates: Partial<SellerProfile>
  ): { success: boolean; seller?: SellerProfile; error?: string } {
    const key = shopCode.trim().toUpperCase();
    const existing = this.sellers.get(key);
    if (!existing) {
      return { success: false, error: 'Seller profile not found' };
    }

    const updated: SellerProfile = {
      ...existing,
      username: updates.username?.trim() || existing.username,
      emailId: updates.emailId?.trim() || existing.emailId,
      contactNumber: updates.contactNumber?.trim() || existing.contactNumber,
      district: updates.district?.trim() || existing.district,
      pincode: updates.pincode?.trim() || existing.pincode,
      address: updates.address?.trim() || existing.address,
      shopLogo: updates.shopLogo !== undefined ? (updates.shopLogo.trim() || undefined) : existing.shopLogo,
      shopLogoStoragePath:
        updates.shopLogoStoragePath !== undefined
          ? (updates.shopLogoStoragePath.trim() || undefined)
          : existing.shopLogoStoragePath,
    };

    this.sellers.set(key, updated);
    this.notifyListeners();

    const docId = updated.uid || updated.id;
    if (this.canSyncFirestore && docId) {
      const payload = stripUndefined(updated as unknown as Record<string, unknown>);
      if (!updated.shopLogo) {
        payload.shopLogo = deleteField();
        payload.shopLogoStoragePath = deleteField();
      }
      setDoc(doc(db, 'sellers', docId), payload, { merge: true }).catch((err) => {
        console.warn('Could not persist seller profile update to Firestore:', err);
      });
    }

    return { success: true, seller: updated };
  }

  // ==========================================
  // 2. PRODUCT MANAGEMENT LOGIC
  // ==========================================

  public createProduct(
    sellerShopCode: string,
    data: {
      productName: string;
      category: string;
      price: number;
      minOrderQty: number;
      image: string;
      imageStoragePath?: string;
      description?: string;
      paymentMode: PaymentMode;
    }
  ): { success: boolean; product?: Product; error?: string } {
    const seller = this.sellers.get(sellerShopCode.toUpperCase());
    if (!seller) {
      return { success: false, error: 'Seller shop code does not exist' };
    }

    const validation = ValidationService.validateProduct(data);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sellerUid: seller.uid || auth.currentUser?.uid || seller.id,
      sellerShopCode: seller.shopCode,
      sellerName: seller.username,
      sellerDistrict: seller.district,
      sellerPincode: seller.pincode,
      sellerRating: seller.rating,
      productName: data.productName.trim(),
      category: data.category.trim(),
      price: Number(data.price),
      minOrderQty: Number(data.minOrderQty),
      image: data.image.trim(),
      imageStoragePath: data.imageStoragePath?.trim() || undefined,
      description: data.description?.trim() || undefined,
      paymentMode: data.paymentMode,
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.products.set(newProduct.id, newProduct);
    this.notifyListeners();

    // Async background sync to Firestore
    this.syncProductToFirestore(newProduct);

    return { success: true, product: newProduct };
  }

  private async syncProductToFirestore(product: Product): Promise<void> {
    if (!this.canSyncFirestore) return;
    try {
      await setDoc(doc(db, 'products', product.id), stripUndefined(product as unknown as Record<string, unknown>));
    } catch (err) {
      console.warn('Could not persist product to Firestore:', err);
    }
  }

  public updateProduct(
    sellerShopCode: string,
    productId: string,
    updates: Partial<Product>
  ): { success: boolean; product?: Product; error?: string } {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.sellerShopCode.toUpperCase() !== sellerShopCode.toUpperCase()) {
      return { success: false, error: 'Unauthorized: You can only edit your own products.' };
    }

    const merged = { ...product, ...updates };
    const validation = ValidationService.validateProduct(merged);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    const updatedProduct: Product = {
      ...merged,
      price: Number(merged.price),
      minOrderQty: Number(merged.minOrderQty),
      updatedAt: new Date().toISOString(),
    };

    this.products.set(productId, updatedProduct);
    this.notifyListeners();

    // Async background update to Firestore
    this.syncProductUpdateToFirestore(productId, updatedProduct);

    return { success: true, product: updatedProduct };
  }

  private async syncProductUpdateToFirestore(productId: string, product: Product): Promise<void> {
    if (!this.canSyncFirestore) return;
    try {
      const payload = stripUndefined(product as unknown as Record<string, unknown>);
      if (!product.description) {
        payload.description = deleteField();
      }
      await setDoc(doc(db, 'products', productId), payload, { merge: true });
    } catch (err) {
      console.warn('Could not update product in Firestore:', err);
    }
  }

  public deleteProduct(
    sellerShopCode: string,
    productId: string
  ): { success: boolean; error?: string } {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.sellerShopCode.toUpperCase() !== sellerShopCode.toUpperCase()) {
      return { success: false, error: 'Unauthorized: You can only delete your own products.' };
    }

    this.products.delete(productId);
    this.notifyListeners();

    // Async background deletion from Firestore
    this.syncProductDeleteFromFirestore(productId);

    return { success: true };
  }

  private async syncProductDeleteFromFirestore(productId: string): Promise<void> {
    if (!this.canSyncFirestore) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err) {
      console.warn('Could not delete product from Firestore:', err);
    }
  }

  public getProductsBySeller(sellerShopCode: string): Product[] {
    const shopKey = sellerShopCode.toUpperCase();
    return Array.from(this.products.values()).filter(
      (p) => p.sellerShopCode.toUpperCase() === shopKey
    );
  }

  public getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  // ==========================================
  // 3. PRODUCT SEARCH LOGIC
  // ==========================================

  public searchProducts(params: ProductSearchParams): Product[] {
    const all = Array.from(this.products.values());

    const hasCategory = params.categories && params.categories.length > 0 && !params.categories.includes('All');
    const hasDistrict = Boolean(params.district && params.district.trim() && params.district !== 'All');
    const hasPincode = Boolean(params.pincode && params.pincode.trim());
    const hasSearch = Boolean(params.search && params.search.trim());

    if (!hasCategory && !hasDistrict && !hasPincode && !hasSearch) {
      return all;
    }

    return all.filter((product) => {
      const seller = this.sellers.get(product.sellerShopCode.toUpperCase());
      const sellerDistrict = seller?.district || product.sellerDistrict;
      const sellerPincode = seller?.pincode || product.sellerPincode || '';

      // 1. Category Filter: OR logic
      if (hasCategory) {
        const categories = params.categories!;
        const matchCategory = categories.some(
          (cat) => cat.toLowerCase() === product.category.toLowerCase()
        );
        if (!matchCategory) return false;
      }

      // 2. District Filter: AND logic
      if (hasDistrict) {
        if (sellerDistrict.toLowerCase() !== params.district!.trim().toLowerCase()) {
          return false;
        }
      }

      // 3. Pincode Filter: AND logic
      if (hasPincode) {
        const cleanPincode = params.pincode!.trim();
        if (sellerPincode !== cleanPincode) {
          return false;
        }
      }

      // 4. Keyword search
      if (hasSearch) {
        const term = params.search!.trim().toLowerCase();
        const matchName = product.productName.toLowerCase().includes(term);
        const matchDesc = product.description?.toLowerCase().includes(term);
        const matchSeller = product.sellerName.toLowerCase().includes(term);
        if (!matchName && !matchDesc && !matchSeller) {
          return false;
        }
      }

      return true;
    });
  }

  // ==========================================
  // 4. PRODUCT REQUEST LOGIC (BUYER & SELLER)
  // ==========================================

  public createProductRequest(
    buyerUsername: string,
    productId: string,
    data: {
      quantity: number;
      expectedDeliveryDate: string;
      paymentMode: PaymentMode;
      customDescription?: string;
    }
  ): { success: boolean; request?: ProductRequest; error?: string } {
    const buyer = this.buyers.get(buyerUsername.toLowerCase());
    if (!buyer) {
      return { success: false, error: 'Buyer account not found' };
    }

    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const validation = ValidationService.validateProductRequest({
      quantity: data.quantity,
      minOrderQty: product.minOrderQty,
      expectedDeliveryDate: data.expectedDeliveryDate,
      paymentMode: data.paymentMode,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    const seller = this.sellers.get(product.sellerShopCode.toUpperCase());

    const newRequest: ProductRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'standard',
      productId: product.id,
      productName: product.productName,
      category: product.category,
      sellerUid: product.sellerUid || seller?.uid || seller?.id,
      sellerShopCode: product.sellerShopCode,
      sellerName: product.sellerName,
      sellerDistrict: seller?.district || product.sellerDistrict,
      sellerPincode: seller?.pincode || product.sellerPincode,
      buyerUid: buyer.uid || auth.currentUser?.uid || buyer.id,
      buyerUsername: buyer.username,
      buyerContact: buyer.contactNumber,
      buyerDistrict: buyer.district,
      deliveryAddress: buyer.deliveryAddress,
      pincode: buyer.pincode,
      quantity: Number(data.quantity),
      unitPrice: product.price,
      totalPrice: product.price * Number(data.quantity),
      paymentMode: data.paymentMode,
      expectedDeliveryDate: data.expectedDeliveryDate,
      customDescription: data.customDescription?.trim() || undefined,
      status: 'pending',
      buyerCompleted: false,
      sellerCompleted: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    this.setOptimisticRequest(newRequest);
    this.notifyListeners();

    // Async sync to Firestore
    this.syncRequestToFirestore(newRequest);

    return { success: true, request: newRequest };
  }

  private async syncRequestToFirestore(request: ProductRequest): Promise<void> {
    if (!this.canSyncFirestore) return;
    try {
      await setDoc(doc(db, 'requests', request.id), stripUndefined(request as unknown as Record<string, unknown>));
    } catch (err) {
      console.warn('Could not persist request to Firestore:', err);
    }
  }

  public updateProductRequest(
    buyerUsername: string,
    requestId: string,
    updates: {
      quantity?: number;
      expectedDeliveryDate?: string;
      customDescription?: string;
      deliveryAddress?: string;
    }
  ): { success: boolean; request?: ProductRequest; error?: string } {
    const request = this.requests.get(requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.buyerUsername.toLowerCase() !== buyerUsername.toLowerCase()) {
      return { success: false, error: 'Unauthorized: You can only edit your own requests' };
    }

    if (request.status !== 'pending') {
      return {
        success: false,
        error: `Cannot edit request because it has already been ${request.status}. Only pending requests can be edited.`,
      };
    }

    let unitPrice = request.unitPrice;
    let quantity = updates.quantity !== undefined ? updates.quantity : request.quantity;

    if (updates.quantity !== undefined) {
      if (updates.quantity < 1) {
        return { success: false, error: 'Quantity must be at least 1' };
      }
      if (request.productId) {
        const prod = this.products.get(request.productId);
        if (prod && updates.quantity < prod.minOrderQty) {
          return { success: false, error: `Quantity cannot be less than MOQ of ${prod.minOrderQty}` };
        }
      }
    }

    if (updates.expectedDeliveryDate) {
      const today = new Date().toISOString().split('T')[0];
      if (updates.expectedDeliveryDate < today) {
        return { success: false, error: 'Expected delivery date cannot be in the past' };
      }
    }

    const updatedRequest: ProductRequest = {
      ...request,
      quantity,
      totalPrice: unitPrice ? unitPrice * quantity : request.totalPrice,
      expectedDeliveryDate: updates.expectedDeliveryDate || request.expectedDeliveryDate,
      customDescription: updates.customDescription !== undefined ? updates.customDescription : request.customDescription,
      deliveryAddress: updates.deliveryAddress || request.deliveryAddress,
      updatedAt: new Date().toISOString(),
    };

    this.setOptimisticRequest(updatedRequest);
    this.notifyListeners();

    // Async update to Firestore
    this.syncRequestUpdateToFirestore(requestId, updatedRequest);

    return { success: true, request: updatedRequest };
  }

  private async syncRequestUpdateToFirestore(requestId: string, request: ProductRequest): Promise<void> {
    if (!this.canSyncFirestore) return;
    try {
      const payload = stripUndefined(request as unknown as Record<string, unknown>);
      if (request.customDescription === undefined) {
        payload.customDescription = deleteField();
      }
      await setDoc(doc(db, 'requests', requestId), payload, { merge: true });
    } catch (err) {
      console.warn('Could not update request in Firestore:', err);
    }
  }

  public deleteProductRequest(
    buyerUsername: string,
    requestId: string
  ): { success: boolean; error?: string } {
    const request = this.requests.get(requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.buyerUsername.toLowerCase() !== buyerUsername.toLowerCase()) {
      return { success: false, error: 'Unauthorized: You can only delete your own requests' };
    }

    if (request.status !== 'pending') {
      return {
        success: false,
        error: `Cannot delete request because it has already been ${request.status}. Only pending requests can be cancelled.`,
      };
    }

    this.deleteOptimisticRequest(requestId);
    this.notifyListeners();

    // Async delete from Firestore
    this.syncRequestDeleteFromFirestore(requestId);

    return { success: true };
  }

  private async syncRequestDeleteFromFirestore(requestId: string): Promise<void> {
    if (!this.canSyncFirestore) return;
    try {
      await deleteDoc(doc(db, 'requests', requestId));
    } catch (err) {
      console.warn('Could not delete request from Firestore:', err);
    }
  }

  public acceptRequest(sellerShopCode: string, requestId: string): { success: boolean; request?: ProductRequest; error?: string } {
    const request = this.requests.get(requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    const isTargetSeller = request.sellerShopCode.toUpperCase() === sellerShopCode.toUpperCase();
    const isOpenMarket = request.sellerShopCode === 'OPEN-MARKET';

    if (!isTargetSeller && !isOpenMarket) {
      return { success: false, error: 'Unauthorized: Request belongs to another seller.' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: `Request is already in "${request.status}" state.` };
    }

    const seller = this.sellers.get(sellerShopCode.toUpperCase());

    const updated: ProductRequest = {
      ...request,
      sellerUid: seller?.uid || auth.currentUser?.uid || seller?.id,
      sellerShopCode: seller ? seller.shopCode : sellerShopCode.toUpperCase(),
      sellerName: seller ? seller.username : request.sellerName,
      sellerDistrict: seller ? seller.district : request.sellerDistrict,
      sellerPincode: seller ? seller.pincode : request.sellerPincode,
      status: 'accepted',
      buyerCompleted: false,
      sellerCompleted: false,
      updatedAt: new Date().toISOString(),
    };

    this.setOptimisticRequest(updated);
    this.notifyListeners();

    this.syncRequestUpdateToFirestore(requestId, updated);
    return { success: true, request: updated };
  }

  public rejectRequest(
    sellerShopCode: string,
    requestId: string,
    reason: string
  ): { success: boolean; request?: ProductRequest; error?: string } {
    const request = this.requests.get(requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    const isTargetSeller = request.sellerShopCode.toUpperCase() === sellerShopCode.toUpperCase();
    const isOpenMarket = request.sellerShopCode === 'OPEN-MARKET';

    if (!isTargetSeller && !isOpenMarket) {
      return { success: false, error: 'Unauthorized: Request belongs to another seller.' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: `Cannot reject request in "${request.status}" state.` };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: 'Please provide a reason for rejecting the request.' };
    }

    const updated: ProductRequest = {
      ...request,
      status: 'rejected',
      rejectionReason: reason.trim(),
      updatedAt: new Date().toISOString(),
    };

    this.setOptimisticRequest(updated);
    this.notifyListeners();

    this.syncRequestUpdateToFirestore(requestId, updated);
    return { success: true, request: updated };
  }

  // ==========================================
  // 5. CUSTOMIZED PRODUCT REQUEST LOGIC
  // ==========================================

  public createCustomRequest(
    buyerUsername: string,
    data: {
      category: string;
      expectedDeliveryDate: string;
      quantity: number;
      paymentMode: PaymentMode;
      title: string;
      specifications: string;
      sampleImage?: string;
      sampleStoragePath?: string;
    }
  ): { success: boolean; request?: ProductRequest; error?: string } {
    const buyer = this.buyers.get(buyerUsername.toLowerCase());
    if (!buyer) {
      return { success: false, error: 'Buyer account not found' };
    }

    const validation = ValidationService.validateCustomRequest(data);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    const newRequest: ProductRequest = {
      id: `req-cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'custom',
      productName: data.title.trim(),
      category: data.category.trim(),
      sellerShopCode: 'OPEN-MARKET',
      sellerName: 'Local Community Sellers',
      buyerUid: buyer.uid || auth.currentUser?.uid || buyer.id,
      buyerUsername: buyer.username,
      buyerContact: buyer.contactNumber,
      buyerDistrict: buyer.district,
      deliveryAddress: buyer.deliveryAddress,
      pincode: buyer.pincode,
      quantity: Number(data.quantity),
      paymentMode: data.paymentMode,
      expectedDeliveryDate: data.expectedDeliveryDate,
      customDescription: data.specifications.trim(),
      sampleImage: data.sampleImage?.trim() || undefined,
      sampleStoragePath: data.sampleStoragePath?.trim() || undefined,
      status: 'pending',
      buyerCompleted: false,
      sellerCompleted: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    this.setOptimisticRequest(newRequest);
    this.notifyListeners();

    this.syncRequestToFirestore(newRequest);
    return { success: true, request: newRequest };
  }

  public searchCustomRequests(params: CustomRequestSearchParams): ProductRequest[] {
    const customRequests = Array.from(this.requests.values()).filter((r) => r.type === 'custom');

    const hasCategory = params.categories && params.categories.length > 0 && !params.categories.includes('All');
    const hasDistrict = Boolean(params.district && params.district.trim() && params.district !== 'All');
    const hasPincode = Boolean(params.pincode && params.pincode.trim());
    const hasSearch = Boolean(params.search && params.search.trim());

    if (!hasCategory && !hasDistrict && !hasPincode && !hasSearch) {
      return customRequests;
    }

    return customRequests.filter((req) => {
      // 1. Category (OR logic)
      if (hasCategory) {
        const matchCat = params.categories!.some(
          (c) => c.toLowerCase() === req.category.toLowerCase()
        );
        if (!matchCat) return false;
      }

      // 2. District filter (AND logic)
      if (hasDistrict) {
        if (req.buyerDistrict.toLowerCase() !== params.district!.trim().toLowerCase()) {
          return false;
        }
      }

      // 3. Pincode filter (AND logic)
      if (hasPincode) {
        if (req.pincode !== params.pincode!.trim()) {
          return false;
        }
      }

      // 4. Keyword search
      if (hasSearch) {
        const term = params.search!.trim().toLowerCase();
        const matchTitle = req.productName.toLowerCase().includes(term);
        const matchDesc = req.customDescription?.toLowerCase().includes(term);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }

  // ==========================================
  // 6. ORDER COMPLETION LOGIC
  // ==========================================

  public markOrderCompletedBySeller(
    sellerShopCode: string,
    requestId: string
  ): { success: boolean; request?: ProductRequest; error?: string } {
    const request = this.requests.get(requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.sellerShopCode.toUpperCase() !== sellerShopCode.toUpperCase()) {
      return { success: false, error: 'Unauthorized: Order does not belong to your shop.' };
    }

    if (request.status !== 'accepted' && request.status !== 'completed') {
      return { success: false, error: 'Orders can only be marked completed after they have been accepted.' };
    }

    const updatedSellerCompleted = true;
    const isBothCompleted = updatedSellerCompleted && Boolean(request.buyerCompleted);

    const updatedRequest: ProductRequest = {
      ...request,
      sellerCompleted: true,
      status: isBothCompleted ? 'completed' : 'accepted',
      updatedAt: new Date().toISOString(),
    };

    this.setOptimisticRequest(updatedRequest);
    this.notifyListeners();

    this.syncRequestUpdateToFirestore(requestId, updatedRequest);
    return { success: true, request: updatedRequest };
  }

  public markOrderCompletedByBuyer(
    buyerUsername: string,
    requestId: string
  ): { success: boolean; request?: ProductRequest; error?: string } {
    const request = this.requests.get(requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.buyerUsername.toLowerCase() !== buyerUsername.toLowerCase()) {
      return { success: false, error: 'Unauthorized: Order does not belong to your account.' };
    }

    if (request.status !== 'accepted' && request.status !== 'completed') {
      return { success: false, error: 'Orders can only be marked completed after they have been accepted by the seller.' };
    }

    const updatedBuyerCompleted = true;
    const isBothCompleted = updatedBuyerCompleted && Boolean(request.sellerCompleted);

    const updatedRequest: ProductRequest = {
      ...request,
      buyerCompleted: true,
      status: isBothCompleted ? 'completed' : 'accepted',
      updatedAt: new Date().toISOString(),
    };

    this.setOptimisticRequest(updatedRequest);
    this.notifyListeners();

    this.syncRequestUpdateToFirestore(requestId, updatedRequest);
    return { success: true, request: updatedRequest };
  }

  // ==========================================
  // 7. REVIEWS AND RATINGS LOGIC
  // ==========================================

  public addReview(
    buyerUsername: string,
    requestId: string,
    data: { rating: number; writtenReview: string }
  ): { success: boolean; review?: Review; error?: string } {
    const request = this.requests.get(requestId);
    if (!request) {
      return { success: false, error: 'Order request not found' };
    }

    if (request.buyerUsername.toLowerCase() !== buyerUsername.toLowerCase()) {
      return { success: false, error: 'Unauthorized: You can only review orders that you placed.' };
    }

    if (!request.buyerCompleted) {
      return { success: false, error: 'You can only add a review after marking the order as completed.' };
    }

    if (request.reviewId && this.reviews.has(request.reviewId)) {
      return { success: false, error: 'A review has already been submitted for this order. You can edit it instead.' };
    }

    const validation = ValidationService.validateReview(data);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requestId: request.id,
      productId: request.productId,
      productName: request.productName,
      sellerShopCode: request.sellerShopCode,
      buyerUid: request.buyerUid || auth.currentUser?.uid,
      buyerUsername: buyerUsername,
      rating: Number(data.rating),
      writtenReview: data.writtenReview.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.reviews.set(newReview.id, newReview);

    // Link review to request
    const updatedReq = { ...request, reviewId: newReview.id };
    this.setOptimisticRequest(updatedReq);

    // Recalculate seller rating
    this.recalculateSellerRating(request.sellerShopCode);
    this.notifyListeners();

    // Async sync to Firestore
    this.syncReviewToFirestore(newReview, updatedReq);

    return { success: true, review: newReview };
  }

  private async syncReviewToFirestore(review: Review, updatedReq: ProductRequest): Promise<void> {
    if (!this.canSyncFirestore) return;
    try {
      await setDoc(doc(db, 'reviews', review.id), stripUndefined(review as unknown as Record<string, unknown>));
      await setDoc(doc(db, 'requests', updatedReq.id), { reviewId: review.id }, { merge: true });
    } catch (err) {
      console.warn('Could not persist review to Firestore:', err);
    }
  }

  public editReview(
    buyerUsername: string,
    reviewId: string,
    data: { rating?: number; writtenReview?: string }
  ): { success: boolean; review?: Review; error?: string } {
    const review = this.reviews.get(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    if (review.buyerUsername.toLowerCase() !== buyerUsername.toLowerCase()) {
      return { success: false, error: 'Unauthorized: Only the review creator can edit this review.' };
    }

    const merged = {
      rating: data.rating !== undefined ? data.rating : review.rating,
      writtenReview: data.writtenReview !== undefined ? data.writtenReview : review.writtenReview,
    };

    const validation = ValidationService.validateReview(merged);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    const updatedReview: Review = {
      ...review,
      rating: Number(merged.rating),
      writtenReview: merged.writtenReview.trim(),
      updatedAt: new Date().toISOString(),
    };

    this.reviews.set(reviewId, updatedReview);
    this.recalculateSellerRating(review.sellerShopCode);
    this.notifyListeners();

    this.syncReviewUpdateToFirestore(reviewId, updatedReview);
    return { success: true, review: updatedReview };
  }

  private async syncReviewUpdateToFirestore(reviewId: string, review: Review): Promise<void> {
    if (!this.canSyncFirestore) return;
    try {
      await setDoc(doc(db, 'reviews', reviewId), stripUndefined(review as unknown as Record<string, unknown>), { merge: true });
    } catch (err) {
      console.warn('Could not update review in Firestore:', err);
    }
  }

  public deleteReview(
    buyerUsername: string,
    reviewId: string
  ): { success: boolean; error?: string } {
    const review = this.reviews.get(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    if (review.buyerUsername.toLowerCase() !== buyerUsername.toLowerCase()) {
      return { success: false, error: 'Unauthorized: Only the review creator can delete this review.' };
    }

    const req = this.requests.get(review.requestId);
    if (req && req.reviewId === reviewId) {
      const { reviewId: _removed, ...restReq } = req;
      const updatedReq: ProductRequest = { ...restReq, updatedAt: new Date().toISOString() };
      this.setOptimisticRequest(updatedReq);
      if (this.canSyncFirestore) {
        updateDoc(doc(db, 'requests', req.id), {
          reviewId: deleteField(),
          updatedAt: updatedReq.updatedAt,
        }).catch((err) => {
          console.warn('Could not unlink reviewId from request in Firestore:', err);
        });
      }
    }

    this.reviews.delete(reviewId);
    this.recalculateSellerRating(review.sellerShopCode);
    this.notifyListeners();

    this.syncReviewDeleteFromFirestore(reviewId);
    return { success: true };
  }

  private async syncReviewDeleteFromFirestore(reviewId: string): Promise<void> {
    if (!this.canSyncFirestore) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      console.warn('Could not delete review from Firestore:', err);
    }
  }

  public getReviewsBySeller(sellerShopCode: string): Review[] {
    const shopKey = sellerShopCode.toUpperCase();
    return Array.from(this.reviews.values()).filter(
      (r) => r.sellerShopCode.toUpperCase() === shopKey
    );
  }

  public getAllReviews(): Review[] {
    return Array.from(this.reviews.values());
  }

  public getAllRequests(): ProductRequest[] {
    return Array.from(this.requests.values());
  }

  private recalculateSellerRating(sellerShopCode: string): void {
    const seller = this.sellers.get(sellerShopCode.toUpperCase());
    if (!seller) return;

    const sellerRevs = this.getReviewsBySeller(sellerShopCode);
    const avg =
      sellerRevs.length === 0
        ? 5.0
        : parseFloat((sellerRevs.reduce((acc, r) => acc + r.rating, 0) / sellerRevs.length).toFixed(1));

    const updatedSeller: SellerProfile = {
      ...seller,
      rating: avg,
      reviewCount: sellerRevs.length,
    };
    this.sellers.set(sellerShopCode.toUpperCase(), updatedSeller);

    if (this.canSyncFirestore && updatedSeller.uid) {
      updateDoc(doc(db, 'sellers', updatedSeller.uid), {
        rating: avg,
        reviewCount: sellerRevs.length,
      }).catch((err) => {
        console.warn('Could not update seller rating in Firestore:', err);
      });
    }
  }
}

// Export singleton instance for app runtime
export const marketplaceService = new MarketplaceService();
