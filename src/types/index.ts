export type UserRole = 'guest' | 'buyer' | 'seller';

export type PaymentMode = 'COD' | 'Online Payment' | 'Both';

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface BuyerProfile {
  id: string;
  uid?: string;
  role?: 'buyer';
  username: string;
  password?: string;
  contactNumber: string;
  district: string;
  deliveryAddress: string;
  pincode: string;
  avatar?: string;
  createdAt?: string;
}

export interface SellerProfile {
  id: string;
  uid?: string;
  role?: 'seller';
  username: string;
  emailId: string;
  password?: string;
  contactNumber: string;
  district: string;
  pincode: string;
  categories: string[];
  shopCode: string;
  shopLogo?: string;
  shopLogoStoragePath?: string;
  address: string;
  rating: number;
  reviewCount: number;
  createdAt?: string;
}

export interface Product {
  id: string;
  sellerUid?: string;
  sellerShopCode: string;
  sellerName: string;
  sellerDistrict: string;
  sellerPincode?: string;
  sellerRating?: number;
  productName: string;
  category: string;
  price: number; // Individual Quantity Price (INR)
  minOrderQty: number; // Minimum Order Quantity
  image: string;
  imageStoragePath?: string;
  description?: string;
  paymentMode: PaymentMode;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductRequest {
  id: string;
  type: 'standard' | 'custom';
  productId?: string;
  productName: string;
  category: string;
  sellerUid?: string;
  sellerShopCode: string;
  sellerName: string;
  sellerDistrict?: string;
  sellerPincode?: string;
  buyerUid?: string;
  buyerUsername: string;
  buyerContact: string;
  buyerDistrict: string;
  deliveryAddress: string;
  pincode: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  paymentMode: PaymentMode;
  expectedDeliveryDate: string;
  customDescription?: string;
  sampleImage?: string;
  sampleStoragePath?: string;
  status: RequestStatus;
  rejectionReason?: string;
  buyerCompleted?: boolean;
  sellerCompleted?: boolean;
  reviewId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  requestId: string;
  productId?: string;
  productName?: string;
  sellerShopCode: string;
  buyerUid?: string;
  buyerUsername: string;
  rating: number;
  writtenReview: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  text: string;
}
