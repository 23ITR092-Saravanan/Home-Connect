import { Product, ProductRequest, SellerProfile } from '../types/index.ts';

export interface ProductSearchFilters {
  categories: string[];
  city: string;
  pincode: string;
}

type ProductRecord = Record<string, unknown>;

function firstValue(record: ProductRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return '';
}

export function normalizeProductDocument(id: string, data: ProductRecord): Product {
  return {
    ...data,
    id,
    sellerId: firstValue(data, ['sellerId', 'sellerID', 'seller_id']),
    sellerCity: firstValue(data, ['sellerCity', 'seller_city', 'city', 'sellerLocationCity']),
    sellerPincode: firstValue(data, ['sellerPincode', 'seller_pincode', 'pincode', 'pinCode', 'postalCode', 'zipCode']),
    category: firstValue(data, ['category', 'productCategory', 'product_category', 'productCategoryName']),
  } as Product;
}

export function matchesProductSearch(
  product: Product,
  seller: SellerProfile | undefined,
  filters: ProductSearchFilters
): boolean {
  const categories = new Set(filters.categories.map((value) => value.trim().toLocaleLowerCase()).filter(Boolean));
  const city = filters.city.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  const pincode = filters.pincode.replace(/[\s-]/g, '');

  if (categories.size === 0 && !city && !pincode) return false;

  const productRecord = product as Product & { sellerPincode?: string };
  const productCategory = String(product.category || '').trim().toLocaleLowerCase();
  const sellerRecord = seller as (SellerProfile & ProductRecord) | undefined;
  const sellerCity = firstValue(sellerRecord || {}, ['city', 'sellerCity', 'seller_city', 'sellerLocationCity'])
    .trim().replace(/\s+/g, ' ').toLocaleLowerCase() ||
    String(product.sellerCity || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  const sellerPincode = (firstValue(sellerRecord || {}, ['pincode', 'pinCode', 'postalCode', 'zipCode', 'sellerPincode']) ||
    String(productRecord.sellerPincode || '')).replace(/[\s-]/g, '');

  if (categories.size && !categories.has(productCategory)) return false;
  if (city && !sellerCity.includes(city)) return false;
  if (pincode && sellerPincode !== pincode) return false;
  return true;
}

export function normalizeProductRequestDocument(id: string, data: ProductRecord): ProductRequest {
  const rawStatus = firstValue(data, ['status', 'requestStatus', 'request_status']).toLowerCase();
  const status = rawStatus === 'rejected' ? 'declined' : rawStatus;
  return {
    ...data,
    id,
    buyerId: firstValue(data, ['buyerId', 'buyerID', 'buyer_id']),
    buyerCity: firstValue(data, ['buyerCity', 'buyer_city', 'city']),
    buyerPincode: firstValue(data, ['buyerPincode', 'buyer_pincode', 'pincode', 'pinCode', 'postalCode']),
    category: firstValue(data, ['category', 'productCategory', 'product_category', 'productCategoryName']),
    productTitle: firstValue(data, ['productTitle', 'product_title', 'title', 'productName']),
    status,
    statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
  } as ProductRequest;
}