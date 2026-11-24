import { PaymentMode } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PINCODE_REGEX = /^\d{6}$/;
// Accepts 10-digit Indian numbers with optional country code (+91 or 0) and optional spaces/dashes
export const PHONE_REGEX = /^(?:\+91[\s-]?)?[6789]\d{9}$|^[0-9]{10}$/;

export const ValidationService = {
  validateBuyerRegistration(data: {
    username?: string;
    password?: string;
    contactNumber?: string;
    district?: string;
    deliveryAddress?: string;
    pincode?: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.username || !data.username.trim()) {
      errors.username = 'Username is required';
    } else if (data.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!data.password || !data.password.trim()) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!data.contactNumber || !data.contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required';
    } else {
      const cleanPhone = data.contactNumber.replace(/[\s-]/g, '');
      if (!PHONE_REGEX.test(cleanPhone)) {
        errors.contactNumber = 'Enter a valid 10-digit mobile number';
      }
    }

    if (!data.district || !data.district.trim()) {
      errors.district = 'District is required';
    }

    if (!data.deliveryAddress || !data.deliveryAddress.trim()) {
      errors.deliveryAddress = 'Delivery address is required';
    } else if (data.deliveryAddress.trim().length < 5) {
      errors.deliveryAddress = 'Delivery address is too short';
    }

    if (!data.pincode || !data.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!PINCODE_REGEX.test(data.pincode.trim())) {
      errors.pincode = 'Enter a valid 6-digit postal pincode';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  validateSellerRegistration(data: {
    username?: string;
    emailId?: string;
    password?: string;
    contactNumber?: string;
    district?: string;
    pincode?: string;
    categories?: string[];
    otherCategoryText?: string;
    shopCode?: string;
    address?: string;
    shopLogo?: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.username || !data.username.trim()) {
      errors.username = 'Seller/Owner name is required';
    } else if (data.username.trim().length < 2) {
      errors.username = 'Name must be at least 2 characters';
    }

    if (!data.emailId || !data.emailId.trim()) {
      errors.emailId = 'Email ID is required';
    } else if (!EMAIL_REGEX.test(data.emailId.trim())) {
      errors.emailId = 'Enter a valid email address';
    }

    if (!data.password || !data.password.trim()) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!data.contactNumber || !data.contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required';
    } else {
      const cleanPhone = data.contactNumber.replace(/[\s-]/g, '');
      if (!PHONE_REGEX.test(cleanPhone)) {
        errors.contactNumber = 'Enter a valid 10-digit contact number';
      }
    }

    if (!data.district || !data.district.trim()) {
      errors.district = 'District is required';
    }

    if (!data.pincode || !data.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!PINCODE_REGEX.test(data.pincode.trim())) {
      errors.pincode = 'Enter a valid 6-digit postal pincode';
    }

    if (!data.categories || data.categories.length === 0) {
      errors.categories = 'Select at least one product category';
    } else if (data.categories.includes('Others') && (!data.otherCategoryText || !data.otherCategoryText.trim())) {
      errors.otherCategory = 'Please specify your other category';
    }

    if (!data.shopCode || !data.shopCode.trim()) {
      errors.shopCode = 'Shop Code is required';
    } else if (data.shopCode.trim().length < 3) {
      errors.shopCode = 'Shop Code must be at least 3 characters';
    }

    if (!data.address || !data.address.trim()) {
      errors.address = 'Workshop / Store address is required';
    }

    // Notice: shopLogo and description remain strictly optional!

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  validateProduct(data: {
    productName?: string;
    category?: string;
    price?: number | string;
    minOrderQty?: number | string;
    image?: string;
    paymentMode?: PaymentMode;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.productName || !data.productName.trim()) {
      errors.productName = 'Product name is required';
    }

    if (!data.category || !data.category.trim()) {
      errors.category = 'Category is required';
    }

    const priceNum = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
    if (priceNum === undefined || isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a positive number greater than 0';
    }

    const moqNum = typeof data.minOrderQty === 'string' ? parseInt(data.minOrderQty, 10) : data.minOrderQty;
    if (moqNum === undefined || isNaN(moqNum) || moqNum < 1 || !Number.isInteger(moqNum)) {
      errors.minOrderQty = 'Minimum order quantity must be an integer of at least 1';
    }

    if (!data.image || !data.image.trim()) {
      errors.image = 'Product image is required';
    } else if (data.image.trim().toLowerCase().startsWith('data:')) {
      errors.image = 'Base64 Data URLs are not supported; please upload a file or provide an HTTPS image URL';
    }

    const validPaymentModes: PaymentMode[] = ['COD', 'Online Payment', 'Both'];
    if (!data.paymentMode || !validPaymentModes.includes(data.paymentMode)) {
      errors.paymentMode = 'Payment mode must be COD, Online Payment, or Both';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  validateProductRequest(data: {
    quantity: number;
    minOrderQty: number;
    expectedDeliveryDate: string;
    paymentMode: PaymentMode;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.quantity || data.quantity < data.minOrderQty) {
      errors.quantity = `Quantity cannot be less than minimum order quantity (${data.minOrderQty} units)`;
    }

    if (!data.expectedDeliveryDate || !data.expectedDeliveryDate.trim()) {
      errors.expectedDeliveryDate = 'Expected delivery date is required';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (data.expectedDeliveryDate < today) {
        errors.expectedDeliveryDate = 'Expected delivery date cannot be in the past';
      }
    }

    const validPaymentModes: PaymentMode[] = ['COD', 'Online Payment', 'Both'];
    if (!data.paymentMode || !validPaymentModes.includes(data.paymentMode)) {
      errors.paymentMode = 'Valid payment mode selection is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  validateCustomRequest(data: {
    title?: string;
    category?: string;
    expectedDeliveryDate?: string;
    quantity?: number | string;
    paymentMode?: PaymentMode;
    specifications?: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.title || !data.title.trim()) {
      errors.title = 'Request title is required';
    }

    if (!data.category || !data.category.trim()) {
      errors.category = 'Category is required';
    }

    if (!data.expectedDeliveryDate || !data.expectedDeliveryDate.trim()) {
      errors.expectedDeliveryDate = 'Expected delivery date is required';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (data.expectedDeliveryDate < today) {
        errors.expectedDeliveryDate = 'Expected delivery date cannot be in the past';
      }
    }

    const qtyNum = typeof data.quantity === 'string' ? parseInt(data.quantity, 10) : data.quantity;
    if (qtyNum === undefined || isNaN(qtyNum) || qtyNum < 1) {
      errors.quantity = 'Required quantity must be at least 1';
    }

    const validPaymentModes: PaymentMode[] = ['COD', 'Online Payment', 'Both'];
    if (!data.paymentMode || !validPaymentModes.includes(data.paymentMode)) {
      errors.paymentMode = 'Payment mode must be COD, Online Payment, or Both';
    }

    if (!data.specifications || !data.specifications.trim()) {
      errors.specifications = 'Detailed custom specifications are required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  validateReview(data: {
    rating: number;
    writtenReview: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      errors.rating = 'Rating must be an integer between 1 and 5';
    }

    if (!data.writtenReview || !data.writtenReview.trim()) {
      errors.writtenReview = 'Written review is required';
    } else if (data.writtenReview.trim().length < 10) {
      errors.writtenReview = 'Review must be at least 10 characters long';
    } else if (data.writtenReview.trim().length > 500) {
      errors.writtenReview = 'Review cannot exceed 500 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};
