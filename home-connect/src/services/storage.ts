import {
  BuyerProfile,
  CartItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMode,
  Product,
  ProductRequest,
  RequestStatus,
  Review,
  SellerProfile,
} from '../types/index.ts';
import { loadFirebaseAuthServices, loadFirebaseServices } from '../firebase.ts';
import type { Unsubscribe } from 'firebase/firestore';
import { normalizeProductDocument, normalizeProductRequestDocument } from './productSearch.ts';

const SELLERS_KEY = 'homecraft_sellers_v1';
const BUYERS_KEY = 'homecraft_buyers_v1';
const PRODUCTS_KEY = 'homecraft_products_v1';
const ORDERS_KEY = 'homecraft_orders_v1';
const REVIEWS_KEY = 'homecraft_reviews_v1';
const REQUESTS_KEY = 'homecraft_requests_v1';
const SESSION_KEY = 'homecraft_session_v1';
const CART_KEY = 'homecraft_cart_v1';

async function getFirebaseApi() {
  const [services, authSdk, firestoreSdk] = await Promise.all([
    loadFirebaseServices(),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);
  return { ...services, authSdk, firestoreSdk };
}

type FirestoreApi = Pick<Awaited<ReturnType<typeof getFirebaseApi>>, 'db' | 'firestoreSdk'>;

async function getFirebaseAuthApi() {
  const [services, authSdk] = await Promise.all([loadFirebaseAuthServices(), import('firebase/auth')]);
  return { ...services, authSdk };
}

async function getDocumentWithCacheFallback(api: FirestoreApi, collectionName: string, id: string) {
  const reference = api.firestoreSdk.doc(api.db, collectionName, id);
  try {
    return await api.firestoreSdk.getDoc(reference);
  } catch (serverError) {
    try {
      const cached = await api.firestoreSdk.getDocFromCache(reference);
      if (cached.exists()) return cached;
    } catch {
      // No offline document is cached; preserve the original network error.
    }
    throw serverError;
  }
}

async function getCollectionWithCacheFallback(
  api: FirestoreApi,
  collectionName: string
) {
  const reference = api.firestoreSdk.collection(api.db, collectionName);
  try {
    return await api.firestoreSdk.getDocs(reference);
  } catch (serverError) {
    try {
      const cached = await api.firestoreSdk.getDocsFromCache(reference);
      if (!cached.empty) return cached;
    } catch {
      // No offline records are cached; preserve the original network error.
    }
    throw serverError;
  }
}

// Cryptographic hash using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_homecraft_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getFirebaseLoginEmail(role: 'seller' | 'buyer', identifier: string): Promise<string> {
  const normalized = identifier.trim().toLowerCase();
  const identifierHash = await hashPassword(`${role}:${normalized}`);
  return `${role}-${identifierHash}@homecraftconnect.invalid`;
}

function readableAuthError(error: unknown, duplicateMessage: string): Error {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

  if (code === 'auth/operation-not-allowed') {
    return new Error('Firebase Email/Password sign-in is disabled. Enable it in Firebase Authentication settings.');
  }
  if (code === 'auth/email-already-in-use') return new Error(duplicateMessage);
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return new Error('The username or seller code and password do not match.');
  }
  if (code === 'auth/network-request-failed') {
    return new Error('Could not reach Firebase. Check your internet connection and try again.');
  }

  return error instanceof Error ? error : new Error('Firebase authentication failed.');
}

// Generate friendly identifiers
export function generateUniqueCode(prefix: string): string {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'HC'}-${randomPart}`;
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Background sync to Firebase Firestore (non-blocking)
function reportFirebaseError(source: string, error: unknown): void {
  const message = getFirebaseErrorMessage(error);
  window.dispatchEvent(new CustomEvent('homecraft_cloud_error', { detail: { source, message } }));
}

export function isFirebaseOfflineError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return code === 'unavailable' || message.includes('client is offline') || message.includes('network is unavailable');
}

export function getFirebaseErrorMessage(error: unknown): string {
  if (isFirebaseOfflineError(error)) {
    return 'Firebase is offline. You can continue with saved account data; reconnect to sync changes.';
  }
  return error instanceof Error ? error.message : String(error);
}

function hasCompleteSellerProfile(profile: SellerProfile): boolean {
  return Boolean(profile.username && profile.sellerCode && profile.contactNumber && profile.city && profile.pincode && profile.address);
}

function hasCompleteBuyerProfile(profile: BuyerProfile): boolean {
  return Boolean(profile.username && profile.mobileNumber && profile.email && profile.address && profile.city && profile.pincode);
}

function mergeRemoteRecords<T extends { id: string; createdAt: string }>(key: string, remote: T[]): void {
  const records = new Map<string, T>();
  getItem<T[]>(key, []).forEach((record) => records.set(record.id, record));
  const previousRemoteIds = remoteRecordIds.get(key) || new Set<string>();
  const nextRemoteIds = new Set(remote.map((record) => record.id));
  previousRemoteIds.forEach((id) => {
    if (!nextRemoteIds.has(id)) records.delete(id);
  });
  remote.forEach((record) => records.set(record.id, record));
  remoteRecordIds.set(key, nextRemoteIds);
  const merged = Array.from(records.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
  setItem(key, merged);
}

async function syncToFirestore(collectionName: string, docId: string, data: Record<string, any>) {
  try {
    await writeToFirestore(collectionName, docId, data);
  } catch (err) {
    reportFirebaseError(`${collectionName}/${docId}`, err);
  }
}

async function writeToFirestore(collectionName: string, docId: string, data: Record<string, any>): Promise<void> {
  const { db, firestoreSdk } = await getFirebaseApi();
  await firestoreSdk.setDoc(firestoreSdk.doc(db, collectionName, docId), data, { merge: true });
}

// Two-way Firebase Firestore listeners for marketplace records
let firebaseSyncInitialized = false;
let firebaseSyncUnsubscribers: Unsubscribe[] = [];
let firebaseSyncGeneration = 0;
const remoteRecordIds = new Map<string, Set<string>>();
export function initFirebaseSync(): void {
  if (firebaseSyncInitialized) return;
  const generation = firebaseSyncGeneration;

  void getFirebaseAuthApi().then(async ({ auth }) => {
    if (generation !== firebaseSyncGeneration || !auth.currentUser) return;
    const { db, firestoreSdk } = await getFirebaseApi();
    if (generation !== firebaseSyncGeneration || !auth.currentUser) return;
    firebaseSyncInitialized = true;
    firebaseSyncUnsubscribers = [
      firestoreSdk.onSnapshot(
      firestoreSdk.collection(db, 'product_requests'),
      (snapshot) => {
        const remote = snapshot.docs.map((item) => normalizeProductRequestDocument(item.id, item.data()));
        mergeRemoteRecords(REQUESTS_KEY, remote);
      },
      (error) => reportFirebaseError('product requests', error)
    ),
      firestoreSdk.onSnapshot(
      firestoreSdk.collection(db, 'orders'),
      (snapshot) => {
        const remote = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Order);
        mergeRemoteRecords(ORDERS_KEY, remote);
      },
      (error) => reportFirebaseError('orders', error)
    ),
      firestoreSdk.onSnapshot(
      firestoreSdk.collection(db, 'products'),
      (snapshot) => {
        const remote = snapshot.docs.map((item) => normalizeProductDocument(item.id, item.data()));
        mergeRemoteRecords(PRODUCTS_KEY, remote);
      },
      (error) => reportFirebaseError('products', error)
    ),
      firestoreSdk.onSnapshot(
        firestoreSdk.collection(db, 'sellers'),
        (snapshot) => {
          const remote = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as SellerProfile);
          mergeRemoteRecords(SELLERS_KEY, remote);
        },
        (error) => reportFirebaseError('seller profiles', error)
      ),
      firestoreSdk.onSnapshot(
        firestoreSdk.collection(db, 'buyers'),
        (snapshot) => {
          const remote = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as BuyerProfile);
          mergeRemoteRecords(BUYERS_KEY, remote);
        },
        (error) => reportFirebaseError('buyer profiles', error)
      ),
      firestoreSdk.onSnapshot(
        firestoreSdk.collection(db, 'reviews'),
        (snapshot) => {
          const remote = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Review);
          mergeRemoteRecords(REVIEWS_KEY, remote);
        },
        (error) => reportFirebaseError('reviews', error)
      ),
    ];
  }).catch((err) => {
    firebaseSyncUnsubscribers.forEach((unsubscribe) => unsubscribe());
    firebaseSyncUnsubscribers = [];
    firebaseSyncInitialized = false;
    reportFirebaseError('initialization', err);
  });
}

export function stopFirebaseSync(): void {
  firebaseSyncGeneration += 1;
  firebaseSyncUnsubscribers.forEach((unsubscribe) => unsubscribe());
  firebaseSyncUnsubscribers = [];
  firebaseSyncInitialized = false;
}

// Raw storage getters & setters
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('homecraft_storage_update', { detail: { key } }));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

export interface AuthSession {
  role: 'seller' | 'buyer';
  userId: string;
}

// ========================
// Auth & User Management
// ========================

export const AuthService = {
  // Sellers
  getSellers(): SellerProfile[] {
    return getItem<SellerProfile[]>(SELLERS_KEY, []);
  },

  getSellerById(id: string): SellerProfile | null {
    const sellers = this.getSellers();
    return sellers.find((s) => s.id === id) || null;
  },

  getSellerByCode(code: string): SellerProfile | null {
    const sellers = this.getSellers();
    const normalized = code.trim().toUpperCase();
    return sellers.find((s) => s.sellerCode.toUpperCase() === normalized) || null;
  },

  isSellerCodeTaken(code: string, excludeId?: string): boolean {
    const normalized = code.trim().toUpperCase();
    const sellers = this.getSellers();
    return sellers.some((s) => s.sellerCode.toUpperCase() === normalized && s.id !== excludeId);
  },

  async registerSeller(data: {
    username: string;
    contactNumber: string;
    email: string;
    city: string;
    pincode: string;
    address: string;
    logo: string;
    sellerCode: string;
    password: string;
    categories: string[];
  }): Promise<SellerProfile> {
    const normalizedCode = data.sellerCode.trim().toUpperCase();
    if (!normalizedCode) {
      throw new Error('Seller code is required');
    }

    if (this.isSellerCodeTaken(normalizedCode)) {
      throw new Error(`The seller code "${normalizedCode}" is already taken. Please choose another unique code.`);
    }

    if (data.categories.length === 0) {
      throw new Error('Please select at least one product category');
    }

    const loginEmail = await getFirebaseLoginEmail('seller', normalizedCode);
    const api = await getFirebaseAuthApi();
    let credential;
    try {
      credential = await api.authSdk.createUserWithEmailAndPassword(api.auth, loginEmail, data.password);
    } catch (error) {
      throw readableAuthError(error, `The seller code "${normalizedCode}" is already in use.`);
    }
    const newSeller: SellerProfile = {
      id: credential.user.uid,
      role: 'seller',
      username: data.username.trim(),
      contactNumber: data.contactNumber.trim(),
      email: data.email.trim().toLowerCase(),
      city: data.city.trim(),
      pincode: data.pincode.trim(),
      address: data.address.trim(),
      logo: data.logo || '',
      sellerCode: normalizedCode,
      categories: data.categories,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sellers = this.getSellers().filter((seller) => seller.id !== newSeller.id);
    sellers.push(newSeller);
    setItem(SELLERS_KEY, sellers);

    this.setSession({ role: 'seller', userId: newSeller.id });
    void syncToFirestore('sellers', newSeller.id, newSeller);
    return newSeller;
  },

  async loginSeller(sellerCode: string, password: string): Promise<SellerProfile> {
    const normalizedCode = sellerCode.trim().toUpperCase();
    const loginEmail = await getFirebaseLoginEmail('seller', normalizedCode);
    const api = await getFirebaseAuthApi();
    await api.auth.authStateReady();
    let authenticatedUser = api.auth.currentUser?.email?.toLowerCase() === loginEmail.toLowerCase()
      ? api.auth.currentUser
      : null;
    if (!authenticatedUser) {
      try {
        authenticatedUser = (await api.authSdk.signInWithEmailAndPassword(api.auth, loginEmail, password)).user;
      } catch (error) {
        throw readableAuthError(error, 'Unable to sign in with this seller code.');
      }
    }
    try {
      const cachedSeller = this.getSellerById(authenticatedUser.uid);
      if (cachedSeller && hasCompleteSellerProfile(cachedSeller)) {
        this.setSession({ role: 'seller', userId: cachedSeller.id });
        void syncToFirestore('sellers', cachedSeller.id, cachedSeller);
        return cachedSeller;
      }

      const firestoreApi = await getFirebaseApi();
      const sellerSnapshot = await getDocumentWithCacheFallback(firestoreApi, 'sellers', authenticatedUser.uid);
      if (!sellerSnapshot.exists()) throw new Error('Seller profile was not found in Firebase.');
      const seller = { ...sellerSnapshot.data(), id: authenticatedUser.uid } as SellerProfile;
      if (seller.role !== 'seller') throw new Error('This account is not registered as a seller.');
      const sellers = this.getSellers().filter((item) => item.id !== seller.id);
      sellers.push(seller);
      setItem(SELLERS_KEY, sellers);
      this.setSession({ role: 'seller', userId: seller.id });
      return seller;
    } catch (error) {
      if (isFirebaseOfflineError(error)) {
        const cachedSeller = this.getSellerById(authenticatedUser.uid) || this.getSellerByCode(normalizedCode);
        const seller: SellerProfile = cachedSeller || {
          id: authenticatedUser.uid,
          role: 'seller',
          username: normalizedCode,
          contactNumber: '',
          email: '',
          city: '',
          pincode: '',
          address: '',
          logo: '',
          sellerCode: normalizedCode,
          categories: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const sellers = this.getSellers().filter((item) => item.id !== seller.id);
        sellers.push(seller);
        setItem(SELLERS_KEY, sellers);
        this.setSession({ role: 'seller', userId: seller.id });
        return seller;
      }
      await api.authSdk.signOut(api.auth);
      throw error;
    }
  },

  async updateSellerProfile(
    sellerId: string,
    updates: Partial<Omit<SellerProfile, 'id' | 'role'>>
  ): Promise<SellerProfile> {
    const sellers = this.getSellers();
    const index = sellers.findIndex((s) => s.id === sellerId);
    if (index === -1) throw new Error('Seller not found');

    if (updates.sellerCode && this.isSellerCodeTaken(updates.sellerCode, sellerId)) {
      throw new Error(`Seller code "${updates.sellerCode}" is already taken.`);
    }

    const updatedSeller: SellerProfile = {
      ...sellers[index],
      ...updates,
      sellerCode: (updates.sellerCode || sellers[index].sellerCode).trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };

    const previousSeller = sellers[index];
    const api = await getFirebaseApi();
    await api.firestoreSdk.setDoc(api.firestoreSdk.doc(api.db, 'sellers', updatedSeller.id), updatedSeller);
    const currentUser = api.auth.currentUser;
    if (updatedSeller.sellerCode !== previousSeller.sellerCode && currentUser?.uid === sellerId) {
      try {
        const loginEmail = await getFirebaseLoginEmail('seller', updatedSeller.sellerCode);
        await api.authSdk.updateEmail(currentUser, loginEmail);
      } catch (error) {
        await api.firestoreSdk.setDoc(api.firestoreSdk.doc(api.db, 'sellers', previousSeller.id), previousSeller);
        throw readableAuthError(error, 'This seller code is already in use.');
      }
    }

    sellers[index] = updatedSeller;
    setItem(SELLERS_KEY, sellers);

    return updatedSeller;
  },

  // Buyers
  getBuyers(): BuyerProfile[] {
    return getItem<BuyerProfile[]>(BUYERS_KEY, []);
  },

  getBuyerById(id: string): BuyerProfile | null {
    const buyers = this.getBuyers();
    return buyers.find((b) => b.id === id) || null;
  },

  getBuyerByUsername(username: string): BuyerProfile | null {
    const buyers = this.getBuyers();
    const normalized = username.trim().toLowerCase();
    return buyers.find((b) => b.username.toLowerCase() === normalized) || null;
  },

  isBuyerUsernameTaken(username: string, excludeId?: string): boolean {
    const normalized = username.trim().toLowerCase();
    const buyers = this.getBuyers();
    return buyers.some((b) => b.username.toLowerCase() === normalized && b.id !== excludeId);
  },

  async registerBuyer(data: {
    username: string;
    mobileNumber: string;
    email: string;
    address: string;
    city: string;
    pincode: string;
    password: string;
  }): Promise<BuyerProfile> {
    const normalizedUsername = data.username.trim();
    if (!normalizedUsername) {
      throw new Error('Username is required');
    }

    if (this.isBuyerUsernameTaken(normalizedUsername)) {
      throw new Error(`The username "${normalizedUsername}" is already taken. Please pick another username.`);
    }

    const loginEmail = await getFirebaseLoginEmail('buyer', normalizedUsername);
    const api = await getFirebaseAuthApi();
    let credential;
    try {
      credential = await api.authSdk.createUserWithEmailAndPassword(api.auth, loginEmail, data.password);
    } catch (error) {
      throw readableAuthError(error, `The username "${normalizedUsername}" is already in use.`);
    }
    const newBuyer: BuyerProfile = {
      id: credential.user.uid,
      role: 'buyer',
      username: normalizedUsername,
      mobileNumber: data.mobileNumber.trim(),
      email: data.email.trim().toLowerCase(),
      address: data.address.trim(),
      city: data.city.trim(),
      pincode: data.pincode.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const buyers = this.getBuyers().filter((buyer) => buyer.id !== newBuyer.id);
    buyers.push(newBuyer);
    setItem(BUYERS_KEY, buyers);

    this.setSession({ role: 'buyer', userId: newBuyer.id });
    void syncToFirestore('buyers', newBuyer.id, newBuyer);
    return newBuyer;
  },

  async loginBuyer(username: string, password: string): Promise<BuyerProfile> {
    const loginEmail = await getFirebaseLoginEmail('buyer', username);
    const api = await getFirebaseAuthApi();
    await api.auth.authStateReady();
    let authenticatedUser = api.auth.currentUser?.email?.toLowerCase() === loginEmail.toLowerCase()
      ? api.auth.currentUser
      : null;
    if (!authenticatedUser) {
      try {
        authenticatedUser = (await api.authSdk.signInWithEmailAndPassword(api.auth, loginEmail, password)).user;
      } catch (error) {
        throw readableAuthError(error, 'Unable to sign in with this username.');
      }
    }
    try {
      const cachedBuyer = this.getBuyerById(authenticatedUser.uid);
      if (cachedBuyer && hasCompleteBuyerProfile(cachedBuyer)) {
        this.setSession({ role: 'buyer', userId: cachedBuyer.id });
        void syncToFirestore('buyers', cachedBuyer.id, cachedBuyer);
        return cachedBuyer;
      }

      const firestoreApi = await getFirebaseApi();
      const buyerSnapshot = await getDocumentWithCacheFallback(firestoreApi, 'buyers', authenticatedUser.uid);
      if (!buyerSnapshot.exists()) throw new Error('Buyer profile was not found in Firebase.');
      const buyer = { ...buyerSnapshot.data(), id: authenticatedUser.uid } as BuyerProfile;
      if (buyer.role !== 'buyer') throw new Error('This account is not registered as a buyer.');
      const buyers = this.getBuyers().filter((item) => item.id !== buyer.id);
      buyers.push(buyer);
      setItem(BUYERS_KEY, buyers);
      this.setSession({ role: 'buyer', userId: buyer.id });
      return buyer;
    } catch (error) {
      if (isFirebaseOfflineError(error)) {
        const cachedBuyer = this.getBuyerById(authenticatedUser.uid) || this.getBuyerByUsername(username);
        const buyer: BuyerProfile = cachedBuyer || {
          id: authenticatedUser.uid,
          role: 'buyer',
          username: username.trim(),
          mobileNumber: '',
          email: '',
          address: '',
          city: '',
          pincode: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const buyers = this.getBuyers().filter((item) => item.id !== buyer.id);
        buyers.push(buyer);
        setItem(BUYERS_KEY, buyers);
        this.setSession({ role: 'buyer', userId: buyer.id });
        return buyer;
      }
      await api.authSdk.signOut(api.auth);
      throw error;
    }
  },

  async updateBuyerProfile(
    buyerId: string,
    updates: Partial<Omit<BuyerProfile, 'id' | 'role'>>
  ): Promise<BuyerProfile> {
    const buyers = this.getBuyers();
    const index = buyers.findIndex((b) => b.id === buyerId);
    if (index === -1) throw new Error('Buyer not found');

    if (updates.username && this.isBuyerUsernameTaken(updates.username, buyerId)) {
      throw new Error(`Username "${updates.username}" is already taken.`);
    }

    const updatedBuyer: BuyerProfile = {
      ...buyers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const previousBuyer = buyers[index];
    const api = await getFirebaseApi();
    await api.firestoreSdk.setDoc(api.firestoreSdk.doc(api.db, 'buyers', updatedBuyer.id), updatedBuyer);
    const currentUser = api.auth.currentUser;
    if (updatedBuyer.username !== previousBuyer.username && currentUser?.uid === buyerId) {
      try {
        const loginEmail = await getFirebaseLoginEmail('buyer', updatedBuyer.username);
        await api.authSdk.updateEmail(currentUser, loginEmail);
      } catch (error) {
        await api.firestoreSdk.setDoc(api.firestoreSdk.doc(api.db, 'buyers', previousBuyer.id), previousBuyer);
        throw readableAuthError(error, 'This username is already in use.');
      }
    }

    buyers[index] = updatedBuyer;
    setItem(BUYERS_KEY, buyers);

    return updatedBuyer;
  },

  // Sessions
  getSession(): AuthSession | null {
    return getItem<AuthSession | null>(SESSION_KEY, null);
  },

  setSession(session: AuthSession | null): void {
    if (session) {
      setItem(SESSION_KEY, session);
    } else {
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new CustomEvent('homecraft_storage_update', { detail: { key: SESSION_KEY } }));
    }
  },

  async restoreCurrentUser(): Promise<
    { role: 'seller'; profile: SellerProfile } | { role: 'buyer'; profile: BuyerProfile } | null
  > {
    const authApi = await getFirebaseAuthApi();
    await authApi.auth.authStateReady();
    const firebaseUser = authApi.auth.currentUser;
    if (!firebaseUser) {
      this.setSession(null);
      return null;
    }

    const cachedSellerById = this.getSellerById(firebaseUser.uid);
    if (cachedSellerById && hasCompleteSellerProfile(cachedSellerById)) {
      this.setSession({ role: 'seller', userId: firebaseUser.uid });
      return { role: 'seller', profile: cachedSellerById };
    }
    const cachedBuyerById = this.getBuyerById(firebaseUser.uid);
    if (cachedBuyerById && hasCompleteBuyerProfile(cachedBuyerById)) {
      this.setSession({ role: 'buyer', userId: firebaseUser.uid });
      return { role: 'buyer', profile: cachedBuyerById };
    }

    const sessionUser = this.getCurrentUser();
    if (sessionUser) {
      const identifier = sessionUser.role === 'seller' ? sessionUser.profile.sellerCode : sessionUser.profile.username;
      const expectedEmail = await getFirebaseLoginEmail(sessionUser.role, identifier);
      const complete = sessionUser.role === 'seller'
        ? hasCompleteSellerProfile(sessionUser.profile)
        : hasCompleteBuyerProfile(sessionUser.profile);
      if (firebaseUser.email?.toLowerCase() === expectedEmail.toLowerCase() && complete) {
        this.setSession({ role: sessionUser.role, userId: firebaseUser.uid });
        return sessionUser;
      }
    }

    const api = await getFirebaseApi();
    try {
      const sellerSnapshot = await getDocumentWithCacheFallback(api, 'sellers', firebaseUser.uid);
      if (sellerSnapshot.exists()) {
        const seller = { ...sellerSnapshot.data(), id: firebaseUser.uid } as SellerProfile;
        const sellers = this.getSellers().filter((item) => item.id !== seller.id);
        sellers.push(seller);
        setItem(SELLERS_KEY, sellers);
        this.setSession({ role: 'seller', userId: seller.id });
        return { role: 'seller', profile: seller };
      }

      const buyerSnapshot = await getDocumentWithCacheFallback(api, 'buyers', firebaseUser.uid);
      if (buyerSnapshot.exists()) {
        const buyer = { ...buyerSnapshot.data(), id: firebaseUser.uid } as BuyerProfile;
        const buyers = this.getBuyers().filter((item) => item.id !== buyer.id);
        buyers.push(buyer);
        setItem(BUYERS_KEY, buyers);
        this.setSession({ role: 'buyer', userId: buyer.id });
        return { role: 'buyer', profile: buyer };
      }

      await api.authSdk.signOut(api.auth);
      this.setSession(null);
      return null;
    } catch (error) {
      if (isFirebaseOfflineError(error) && sessionUser) {
        this.setSession({ role: sessionUser.role, userId: firebaseUser.uid });
        return sessionUser;
      }
      throw error;
    }
  },

  getCurrentUser(): { role: 'seller'; profile: SellerProfile } | { role: 'buyer'; profile: BuyerProfile } | null {
    const session = this.getSession();
    if (!session) return null;

    if (session.role === 'seller') {
      const profile = this.getSellerById(session.userId);
      if (profile) return { role: 'seller', profile };
    } else if (session.role === 'buyer') {
      const profile = this.getBuyerById(session.userId);
      if (profile) return { role: 'buyer', profile };
    }

    this.setSession(null);
    return null;
  },

  logout(): void {
    this.setSession(null);
    stopFirebaseSync();
    void getFirebaseAuthApi()
      .then(({ auth, authSdk }) => authSdk.signOut(auth))
      .catch((error) => console.error('Firebase sign-out failed:', error));
  },
};

// ========================
// Products Management
// ========================

export const ProductService = {
  getProducts(): Product[] {
    return getItem<Product[]>(PRODUCTS_KEY, []).map((product) =>
      normalizeProductDocument(product.id, product as unknown as Record<string, unknown>)
    );
  },

  async refreshFromFirebase(): Promise<Product[]> {
    try {
      const { db, firestoreSdk } = await getFirebaseApi();
      const snapshot = await getCollectionWithCacheFallback({ db, firestoreSdk }, 'products');
      const remoteProducts = snapshot.docs.map((item) => normalizeProductDocument(item.id, item.data()));
      mergeRemoteRecords(PRODUCTS_KEY, remoteProducts);
      return this.getProducts();
    } catch (error) {
      reportFirebaseError('product search', error);
      throw error;
    }
  },

  getProductsBySeller(sellerId: string): Product[] {
    return this.getProducts().filter((p) => p.sellerId === sellerId);
  },

  getProductById(id: string): Product | null {
    return this.getProducts().find((p) => p.id === id) || null;
  },

  createProduct(
    seller: SellerProfile,
    data: {
      title: string;
      description: string;
      price: number;
      minOrderQuantity: number;
      imageUrl: string;
      paymentMode: PaymentMode;
      additionalInfo?: string;
      category?: string;
      inStock?: boolean;
    }
  ): Product {
    const newProduct: Product = {
      id: generateId('prod'),
      sellerId: seller.id,
      sellerCode: seller.sellerCode,
      sellerName: seller.username,
      sellerCity: seller.city,
      sellerPincode: seller.pincode,
      sellerContact: seller.contactNumber,
      title: data.title.trim(),
      description: data.description.trim(),
      price: Math.max(0, Number(data.price)),
      minOrderQuantity: Math.max(1, Number(data.minOrderQuantity || 1)),
      imageUrl: data.imageUrl.trim(),
      paymentMode: data.paymentMode,
      additionalInfo: data.additionalInfo?.trim() || '',
      category: data.category?.trim() || 'Customized Products',
      inStock: data.inStock ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const products = this.getProducts();
    products.unshift(newProduct);
    setItem(PRODUCTS_KEY, products);

    syncToFirestore('products', newProduct.id, newProduct);
    return newProduct;
  },

  updateProduct(
    productId: string,
    sellerId: string,
    updates: Partial<Omit<Product, 'id' | 'sellerId' | 'sellerCode'>>
  ): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === productId && p.sellerId === sellerId);
    if (index === -1) throw new Error('Product not found or unauthorized');

    const updatedProduct: Product = {
      ...products[index],
      ...updates,
      price: updates.price !== undefined ? Math.max(0, Number(updates.price)) : products[index].price,
      minOrderQuantity:
        updates.minOrderQuantity !== undefined
          ? Math.max(1, Number(updates.minOrderQuantity))
          : products[index].minOrderQuantity,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updatedProduct;
    setItem(PRODUCTS_KEY, products);

    syncToFirestore('products', updatedProduct.id, updatedProduct);
    return updatedProduct;
  },

  toggleStockStatus(productId: string, sellerId: string): boolean {
    const product = this.getProductById(productId);
    if (!product || product.sellerId !== sellerId) return false;
    this.updateProduct(productId, sellerId, { inStock: !product.inStock });
    return !product.inStock;
  },

  async deleteProduct(productId: string, sellerId: string): Promise<void> {
    const products = this.getProducts();
    const product = products.find((item) => item.id === productId && item.sellerId === sellerId);
    if (!product) throw new Error('Product not found or unauthorized');

    const api = await getFirebaseApi();
    await api.firestoreSdk.deleteDoc(api.firestoreSdk.doc(api.db, 'products', productId));
    const filtered = products.filter((p) => !(p.id === productId && p.sellerId === sellerId));
    setItem(PRODUCTS_KEY, filtered);
  },
};

// ========================
// Orders Management
// ========================

export const OrderService = {
  getOrders(): Order[] {
    return getItem<Order[]>(ORDERS_KEY, []);
  },

  getOrdersBySeller(sellerId: string): Order[] {
    return this.getOrders().filter((o) => o.sellerId === sellerId);
  },

  getActiveOrdersBySeller(sellerId: string): Order[] {
    return this.getOrders().filter(
      (o) => o.sellerId === sellerId && o.status !== 'delivered' && o.status !== 'cancelled'
    );
  },

  getCompletedOrdersBySeller(sellerId: string): Order[] {
    return this.getOrders().filter((o) => o.sellerId === sellerId && o.status === 'delivered');
  },

  getOrdersByBuyer(buyerId: string): Order[] {
    return this.getOrders().filter((o) => o.buyerId === buyerId);
  },

  getOrderById(orderId: string): Order | null {
    return this.getOrders().find((o) => o.id === orderId) || null;
  },

  createOrder(params: {
    buyer: BuyerProfile;
    sellerId: string;
    items: OrderItem[];
    deliveryAddress: string;
    deliveryCity: string;
    deliveryPincode: string;
    paymentMode: PaymentMode;
    dueDate?: string;
    notes?: string;
    requestId?: string;
  }): Order {
    const seller = AuthService.getSellerById(params.sellerId);
    if (!seller) throw new Error('Seller not found for this order');

    const totalAmount = params.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNumber = `HC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: generateId('ord'),
      orderNumber,
      sellerId: seller.id,
      sellerCode: seller.sellerCode,
      sellerName: seller.username,
      sellerContact: seller.contactNumber,
      buyerId: params.buyer.id,
      buyerUsername: params.buyer.username,
      buyerEmail: params.buyer.email,
      buyerMobile: params.buyer.mobileNumber,
      deliveryAddress: params.deliveryAddress.trim(),
      deliveryCity: params.deliveryCity.trim(),
      deliveryPincode: params.deliveryPincode.trim(),
      paymentMode: params.paymentMode,
      dueDate: params.dueDate,
      notes: params.notes?.trim() || '',
      requestId: params.requestId,
      items: params.items,
      totalAmount,
      status: 'pending',
      statusTimeline: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Order placed by buyer',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    setItem(ORDERS_KEY, orders);

    syncToFirestore('orders', newOrder.id, newOrder);
    return newOrder;
  },

  updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): Order {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    const order = orders[index];
    const timeline = [
      ...order.statusTimeline,
      {
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: note || `Status updated to ${newStatus}`,
      },
    ];

    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      statusTimeline: timeline,
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updatedOrder;
    setItem(ORDERS_KEY, orders);

    syncToFirestore('orders', updatedOrder.id, updatedOrder);
    return updatedOrder;
  },

  cancelOrderWithReason(orderId: string, reason: string, cancelledBy: 'seller' | 'buyer'): Order {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    if (!reason || !reason.trim()) {
      throw new Error('A cancellation reason is required');
    }

    const order = orders[index];
    const timeline = [
      ...order.statusTimeline,
      {
        status: 'cancelled' as OrderStatus,
        timestamp: new Date().toISOString(),
        note: `Cancelled by ${cancelledBy}: ${reason.trim()}`,
      },
    ];

    const updatedOrder: Order = {
      ...order,
      status: 'cancelled',
      cancellationReason: reason.trim(),
      statusTimeline: timeline,
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updatedOrder;
    setItem(ORDERS_KEY, orders);

    syncToFirestore('orders', updatedOrder.id, updatedOrder);

    // If there is an associated request, update its status as declined
    try {
      const requests = ProductRequestService.getRequests();
      const reqIndex = requests.findIndex((r) => r.orderId === orderId || (order.requestId && r.id === order.requestId));
      if (reqIndex > -1 && requests[reqIndex].status === 'pending') {
        const request = requests[reqIndex];
        const timestamp = new Date().toISOString();
        requests[reqIndex] = {
          ...request,
          status: 'declined',
          acceptedBySellerId: cancelledBy === 'seller' ? order.sellerId : request.acceptedBySellerId,
          acceptedBySellerName: cancelledBy === 'seller' ? order.sellerName : request.acceptedBySellerName,
          sellerResponse: `Order cancelled by ${cancelledBy}: ${reason.trim()}`,
          statusHistory: [
            ...(request.statusHistory || []),
            { status: 'declined', timestamp, note: `Order cancelled by ${cancelledBy}: ${reason.trim()}` },
          ],
          updatedAt: timestamp,
        };
        setItem(REQUESTS_KEY, requests);
        syncToFirestore('product_requests', requests[reqIndex].id, requests[reqIndex]);
      }
    } catch (e) {
      console.debug('Error updating linked request on cancel:', e);
    }

    return updatedOrder;
  },
};

// ========================
// Reviews Management
// ========================

export const ReviewService = {
  getReviews(): Review[] {
    return getItem<Review[]>(REVIEWS_KEY, []);
  },

  getReviewsBySeller(sellerId: string): Review[] {
    return this.getReviews().filter((r) => r.sellerId === sellerId);
  },

  getReviewByOrder(orderId: string): Review | null {
    return this.getReviews().find((r) => r.orderId === orderId) || null;
  },

  getSellerRatingStats(sellerId: string): { average: number; count: number } {
    const sellerReviews = this.getReviewsBySeller(sellerId);
    if (sellerReviews.length === 0) return { average: 0, count: 0 };
    const ratedReviews = sellerReviews.filter((r) => typeof r.rating === 'number' && r.rating > 0);
    if (ratedReviews.length === 0) return { average: 0, count: sellerReviews.length };
    const sum = ratedReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return {
      average: Number((sum / ratedReviews.length).toFixed(1)),
      count: sellerReviews.length,
    };
  },

  addReview(params: {
    sellerId: string;
    orderId?: string;
    buyerId: string;
    buyerUsername: string;
    rating?: number;
    tags: string[];
    comment?: string;
  }): Review {
    const newReview: Review = {
      id: generateId('rev'),
      sellerId: params.sellerId,
      orderId: params.orderId,
      buyerId: params.buyerId,
      buyerUsername: params.buyerUsername,
      rating: params.rating ? Math.min(5, Math.max(1, params.rating)) : undefined,
      tags: params.tags || [],
      comment: params.comment ? params.comment.trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reviews = this.getReviews();
    reviews.unshift(newReview);
    setItem(REVIEWS_KEY, reviews);

    syncToFirestore('reviews', newReview.id, newReview);
    return newReview;
  },

  updateReview(
    reviewId: string,
    buyerId: string,
    updates: {
      rating?: number;
      tags: string[];
      comment?: string;
    }
  ): Review {
    const reviews = this.getReviews();
    const index = reviews.findIndex((r) => r.id === reviewId);
    if (index === -1) throw new Error('Review not found');

    const existing = reviews[index];
    if (existing.buyerId !== buyerId) {
      throw new Error('Only the review owner can edit their review');
    }

    const updated: Review = {
      ...existing,
      rating: updates.rating !== undefined ? Math.min(5, Math.max(1, updates.rating)) : existing.rating,
      tags: updates.tags || existing.tags,
      comment: updates.comment !== undefined ? updates.comment.trim() : existing.comment,
      updatedAt: new Date().toISOString(),
    };

    reviews[index] = updated;
    setItem(REVIEWS_KEY, reviews);

    syncToFirestore('reviews', updated.id, updated);
    return updated;
  },
};

// ========================
// Product Requests Management
// ========================

export const ProductRequestService = {
  getRequests(): ProductRequest[] {
    return getItem<ProductRequest[]>(REQUESTS_KEY, []).map((request) =>
      normalizeProductRequestDocument(request.id, request as unknown as Record<string, unknown>)
    );
  },

  async refreshFromFirebase(): Promise<ProductRequest[]> {
    try {
      const { db, firestoreSdk } = await getFirebaseApi();
      const snapshot = await getCollectionWithCacheFallback({ db, firestoreSdk }, 'product_requests');
      const remoteRequests = snapshot.docs.map((item) => normalizeProductRequestDocument(item.id, item.data()));
      mergeRemoteRecords(REQUESTS_KEY, remoteRequests);
      return this.getRequests();
    } catch (error) {
      reportFirebaseError('custom request search', error);
      throw error;
    }
  },

  getRequestsBySeller(sellerId: string): ProductRequest[] {
    return this.getRequests().filter(
      (r) => r.sellerId === sellerId || r.acceptedBySellerId === sellerId
    );
  },

  getPendingRequestsBySeller(sellerId: string): ProductRequest[] {
    return this.getRequests().filter(
      (r) => (r.sellerId === sellerId || !r.sellerId || r.sellerId === 'open') && r.status === 'pending'
    );
  },

  getAcceptedRequestsBySeller(sellerId: string): ProductRequest[] {
    return this.getRequests().filter(
      (r) => (r.sellerId === sellerId || r.acceptedBySellerId === sellerId) && r.status === 'accepted'
    );
  },

  getDeclinedRequestsBySeller(sellerId: string): ProductRequest[] {
    return this.getRequests().filter(
      (r) => (r.sellerId === sellerId || r.acceptedBySellerId === sellerId) && r.status === 'declined'
    );
  },

  getRequestsByBuyer(buyerId: string): ProductRequest[] {
    return this.getRequests().filter((r) => r.buyerId === buyerId);
  },

  getPendingRequestsByBuyer(buyerId: string): ProductRequest[] {
    return this.getRequests().filter((r) => r.buyerId === buyerId && r.status === 'pending');
  },

  getAcceptedRequestsByBuyer(buyerId: string): ProductRequest[] {
    return this.getRequests().filter((r) => r.buyerId === buyerId && r.status === 'accepted');
  },

  getDeclinedRequestsByBuyer(buyerId: string): ProductRequest[] {
    return this.getRequests().filter((r) => r.buyerId === buyerId && r.status === 'declined');
  },

  // Search open requests for sellers using City, Category, Pincode
  // "Allow search using: City, Category, Pincode. If any one of these is entered, show matching requests."
  searchRequestsForSellers(filters: {
    city?: string;
    category?: string;
    pincode?: string;
  }): ProductRequest[] {
    const all = this.getRequests();
    const cityTrim = filters.city?.trim().toLowerCase() || '';
    const catTrim =
      filters.category && filters.category !== 'All Categories'
        ? filters.category.trim().toLowerCase()
        : '';
    const pinTrim = filters.pincode?.trim() || '';

    const openRequests = all.filter((request) => request.status === 'pending' || request.status === 'got_seller');

    // If none entered, return all community requests that are pending or got_seller
    if (!cityTrim && !catTrim && !pinTrim) {
      return openRequests;
    }

    // Any supplied filter can match independently; multiple filters use OR semantics.
    return openRequests.filter((r) => {
      const requestCity = String(r.buyerCity || '').trim().replace(/\s+/g, ' ').toLowerCase();
      const requestCategory = String(r.category || '').trim().replace(/\s+/g, ' ').toLowerCase();
      const requestPincode = String(r.buyerPincode || '').replace(/[\s-]/g, '');
      return Boolean(
        (cityTrim && requestCity.includes(cityTrim.replace(/\s+/g, ' '))) ||
        (catTrim && requestCategory === catTrim.replace(/\s+/g, ' ')) ||
        (pinTrim && requestPincode === pinTrim.replace(/[\s-]/g, ''))
      );
    });
  },

  async createRequest(params: {
    buyer: BuyerProfile;
    category: string;
    dueDate: string;
    targetQuantity: number;
    paymentMode: PaymentMode;
    description: string;
    productTitle?: string;
    sampleImages?: string[];
    seller?: SellerProfile;
    orderId?: string;
    productId?: string;
  }): Promise<ProductRequest> {
    const timestamp = new Date().toISOString();
    const newRequest: ProductRequest = {
      id: generateId('req'),
      sellerId: params.seller?.id,
      sellerCode: params.seller?.sellerCode,
      sellerName: params.seller?.username,
      buyerId: params.buyer.id,
      buyerUsername: params.buyer.username,
      buyerContact: params.buyer.mobileNumber,
      buyerEmail: params.buyer.email,
      buyerAddress: params.buyer.address,
      buyerCity: params.buyer.city,
      buyerPincode: params.buyer.pincode,
      productTitle: params.productTitle?.trim() || `Custom ${params.category} Request`,
      category: params.category.trim(),
      dueDate: params.dueDate,
      targetQuantity: Math.max(1, Number(params.targetQuantity || 1)),
      paymentMode: params.paymentMode,
      description: params.description.trim(),
      sampleImages: params.sampleImages || [],
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp, note: 'Request submitted by buyer' }],
      orderId: params.orderId,
      productId: params.productId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await writeToFirestore('product_requests', newRequest.id, newRequest);
    const requests = this.getRequests();
    requests.unshift(newRequest);
    setItem(REQUESTS_KEY, requests);

    return newRequest;
  },

  async acceptRequestBySeller(
    requestId: string,
    seller: SellerProfile,
    sellerResponse?: string
  ): Promise<ProductRequest> {
    const requests = this.getRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Request not found');

    const timestamp = new Date().toISOString();
    const updated: ProductRequest = {
      ...requests[index],
      status: 'accepted',
      acceptedBySellerId: seller.id,
      acceptedBySellerName: seller.username,
      acceptedBySellerCode: seller.sellerCode,
      acceptedBySellerContact: seller.contactNumber,
      sellerResponse: sellerResponse !== undefined ? sellerResponse : requests[index].sellerResponse,
      statusHistory: [
        ...(requests[index].statusHistory || []),
        { status: 'accepted', timestamp, note: sellerResponse || 'Accepted by seller' },
      ],
      updatedAt: timestamp,
    };

    await writeToFirestore('product_requests', updated.id, updated);
    requests[index] = updated;
    setItem(REQUESTS_KEY, requests);

    // Sync status with associated Order if present
    if (updated.orderId) {
      try {
        OrderService.updateOrderStatus(
          updated.orderId,
          'accepted',
          sellerResponse ? `Accepted by maker: ${sellerResponse}` : 'Order request accepted by maker'
        );
      } catch (err) {
        console.debug('Error syncing order status:', err);
      }
    }

    return updated;
  },

  async markGotSeller(requestId: string, buyerId: string): Promise<ProductRequest> {
    const requests = this.getRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Request not found');

    if (requests[index].buyerId !== buyerId) {
      throw new Error('Only the request creator can mark Got Seller');
    }

    const timestamp = new Date().toISOString();
    const updated: ProductRequest = {
      ...requests[index],
      status: 'got_seller',
      statusHistory: [
        ...(requests[index].statusHistory || []),
        { status: 'got_seller', timestamp, note: 'Buyer marked request as fulfilled' },
      ],
      updatedAt: timestamp,
    };

    await writeToFirestore('product_requests', updated.id, updated);
    requests[index] = updated;
    setItem(REQUESTS_KEY, requests);
    return updated;
  },

  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    sellerResponse?: string,
    seller?: SellerProfile
  ): Promise<ProductRequest> {
    const requests = this.getRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Request not found');

    const timestamp = new Date().toISOString();
    const updated: ProductRequest = {
      ...requests[index],
      status,
      ...(seller ? {
        acceptedBySellerId: seller.id,
        acceptedBySellerName: seller.username,
        acceptedBySellerCode: seller.sellerCode,
        acceptedBySellerContact: seller.contactNumber,
      } : {}),
      sellerResponse: sellerResponse !== undefined ? sellerResponse : requests[index].sellerResponse,
      statusHistory: [
        ...(requests[index].statusHistory || []),
        { status, timestamp, note: sellerResponse || `Status updated to ${status}` },
      ],
      updatedAt: timestamp,
    };

    await writeToFirestore('product_requests', updated.id, updated);
    requests[index] = updated;
    setItem(REQUESTS_KEY, requests);

    // Sync status with associated Order if present
    if (updated.orderId) {
      try {
        if (status === 'accepted') {
          OrderService.updateOrderStatus(
            updated.orderId,
            'accepted',
            sellerResponse ? `Accepted by maker: ${sellerResponse}` : 'Order request accepted by maker'
          );
        } else if (status === 'declined') {
          OrderService.cancelOrderWithReason(
            updated.orderId,
            sellerResponse || 'Request was declined by maker',
            'seller'
          );
        }
      } catch (err) {
        console.debug('Error syncing order status with request:', err);
      }
    }

    return updated;
  },
};

// ========================
// Cart Management
// ========================

export const CartService = {
  getCart(): CartItem[] {
    return getItem<CartItem[]>(CART_KEY, []);
  },

  saveCart(items: CartItem[]): void {
    setItem(CART_KEY, items);
  },

  addToCart(product: Product, quantity: number = 1): CartItem[] {
    const cart = this.getCart();
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    // Ensure at least minOrderQuantity
    const addQty = Math.max(product.minOrderQuantity || 1, quantity);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += addQty;
    } else {
      cart.push({ product, quantity: addQty });
    }

    this.saveCart(cart);
    return cart;
  },

  updateQuantity(productId: string, quantity: number): CartItem[] {
    let cart = this.getCart();
    if (quantity <= 0) {
      cart = cart.filter((item) => item.product.id !== productId);
    } else {
      const item = cart.find((i) => i.product.id === productId);
      if (item) {
        // Enforce minimum order quantity if updating
        item.quantity = Math.max(item.product.minOrderQuantity || 1, quantity);
      }
    }
    this.saveCart(cart);
    return cart;
  },

  removeFromCart(productId: string): CartItem[] {
    const cart = this.getCart().filter((item) => item.product.id !== productId);
    this.saveCart(cart);
    return cart;
  },

  clearCart(): void {
    setItem(CART_KEY, []);
  },
};
