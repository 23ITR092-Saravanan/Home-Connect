export type UserRole = 'seller' | 'buyer';

export type PaymentMode = 'Cash After Delivery' | 'Online Payment' | 'Both';

export interface SellerProfile {
  id: string;
  role: 'seller';
  username: string; // Store or seller business name
  contactNumber: string;
  email: string;
  city: string;
  pincode: string;
  address: string;
  logo: string; // Base64 data URL or image URL
  sellerCode: string; // Unique seller code (e.g. HC-KRAFT01)
  categories: string[]; // Selected product categories
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfile {
  id: string;
  role: 'buyer';
  username: string; // Unique username for buyer
  mobileNumber: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerCode: string;
  sellerName: string;
  sellerCity: string;
  sellerPincode?: string;
  sellerContact: string;
  title: string; // Product Name - required
  description: string; // Description - required
  price: number; // Individual Quantity Price - required
  minOrderQuantity: number; // Minimum Order Quantity - required
  imageUrl: string; // Product Image - required
  paymentMode: PaymentMode; // Payment Mode - required
  additionalInfo?: string; // Additional Information - optional
  category: string;
  inStock: boolean;
  unit?: string;
  leadTime?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  unit?: string;
  imageUrl: string;
  minOrderQuantity?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  sellerId: string;
  sellerCode: string;
  sellerName: string;
  sellerContact: string;
  buyerId: string;
  buyerUsername: string;
  buyerEmail: string;
  buyerMobile: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPincode: string;
  notes?: string;
  paymentMode: PaymentMode;
  dueDate?: string;
  cancellationReason?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  requestId?: string;
  statusTimeline: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  dueDate?: string;
}

export const REVIEW_TAGS = [
  'Best',
  'Good',
  'Average',
  'Poor',
  'Reasonable Price',
  'More Price',
  'Poor Quality',
  'Good Product Quality',
  'Late Delivery',
  'On Time Delivery',
  'Early Delivery',
  'Poor Response',
  'Good Response',
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];

export interface Review {
  id: string;
  sellerId: string;
  orderId?: string;
  buyerId: string;
  buyerUsername: string;
  rating?: number; // 1 to 5 optional star rating
  tags: string[]; // Multiple selections from REVIEW_TAGS
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'got_seller';

export interface ProductRequest {
  id: string;
  sellerId?: string; // Optional if requested from a specific seller, or empty/'open' for all sellers
  sellerCode?: string;
  sellerName?: string;
  buyerId: string;
  buyerUsername: string;
  buyerContact: string;
  buyerEmail?: string;
  buyerAddress?: string;
  buyerCity: string;
  buyerPincode: string;
  productTitle: string;
  category: string; // Required
  dueDate: string; // Expected Due Date - Required
  targetQuantity: number; // Order Quantity - Required
  paymentMode: PaymentMode; // Payment Mode - Required
  description: string; // Description - Required
  sampleImages?: string[]; // Sample Images - Optional
  status: RequestStatus;
  statusHistory?: {
    status: RequestStatus;
    timestamp: string;
    note?: string;
  }[];
  acceptedBySellerId?: string;
  acceptedBySellerName?: string;
  acceptedBySellerCode?: string;
  acceptedBySellerContact?: string;
  sellerResponse?: string;
  orderId?: string;
  productId?: string;
  createdAt: string;
  updatedAt: string;
}

// Exactly the 20 requested categories
export const PRESET_CATEGORIES = [
  'Food Powders',
  'Embroidery',
  'Crafts',
  'Mini Toys',
  'Pottery',
  'Clay Art',
  'Drawings',
  'Paintings',
  'Gifts',
  'Decorations',
  'Handmade Jewellery',
  'Home Decor',
  'Candles',
  'Soaps',
  'Bags',
  'Clothing',
  'Accessories',
  'Wood Crafts',
  'Greeting Cards',
  'Customized Products',
] as const;
