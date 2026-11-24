import React, { useState } from 'react';
import { Search, MapPin, IndianRupee, Store, Star, ArrowRight, ZoomIn, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AVAILABLE_DISTRICTS, PRODUCT_CATEGORIES } from '../../data/mockData';
import { Product } from '../../types';
import { StorageImage } from '../common/StorageImage';
import { APP_IMAGES } from '../../assets/cartoonAssets';
import { marketplaceService } from '../../services/marketplaceService';

export const ProductSearchCatalog: React.FC = () => {
  const { setRequestingProduct, openZoom, searchProducts } = useApp();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [pincodeFilter, setPincodeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Active filter state
  const [appliedFilters, setAppliedFilters] = useState<{
    categories: string[];
    district: string;
    pincode: string;
    search: string;
  }>({
    categories: [],
    district: 'All',
    pincode: '',
    search: '',
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      categories: [...selectedCategories],
      district: selectedDistrict,
      pincode: pincodeFilter.trim(),
      search: searchTerm.trim(),
    });
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedDistrict('All');
    setPincodeFilter('');
    setSearchTerm('');
    setAppliedFilters({
      categories: [],
      district: 'All',
      pincode: '',
      search: '',
    });
  };

  // Uses the service logic with all rules:
  // - Any one filter is sufficient
  // - Multiple filters use AND logic
  // - Multiple categories use OR logic
  // - District and pincode match against seller profile details
  const filteredProducts = searchProducts({
    categories: appliedFilters.categories.length > 0 ? appliedFilters.categories : undefined,
    district: appliedFilters.district !== 'All' ? appliedFilters.district : undefined,
    pincode: appliedFilters.pincode || undefined,
    search: appliedFilters.search || undefined,
  });

  return (
    <div className="space-y-8">
      {/* Search & Filter Header Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Search for New Products</h2>
            <p className="text-xs text-slate-500">
              Filter by category, district, and pincode (matched with seller workshop location)
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-5">
          {/* Row 1: Keyword, District, Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Term */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Keyword / Product Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Terracotta, Honey, Cotton"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* District Dropdown (Matched against seller profile) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Seller District
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
                >
                  <option value="All">All Districts</option>
                  {AVAILABLE_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pincode Input (Matched against seller profile) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Seller Pincode
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 641002, 625001"
                value={pincodeFilter}
                onChange={(e) => setPincodeFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Row 2: Category Multi-Selection (OR logic within categories) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Categories (Select Multiple · OR Logic)
              </label>
              <span className="text-xs text-slate-500">
                {selectedCategories.length === 0
                  ? 'All categories active'
                  : `${selectedCategories.length} selected`}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                  selectedCategories.length === 0
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                All Categories
              </button>

              {PRODUCT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 text-amber-950 border-amber-300 shadow-2xs font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-2xs text-slate-400">
              Rule: Any one filter works alone · Combined filters use AND logic
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer btn-cartoon-pop"
            >
              <Search className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Meta Info */}
      <div className="text-xs text-slate-500">
        Showing <strong>{filteredProducts.length}</strong> matching products
        {appliedFilters.categories.length > 0 && (
          <span> in [<strong>{appliedFilters.categories.join(', ')}</strong>]</span>
        )}
        {appliedFilters.district !== 'All' && <span> near seller district <strong>{appliedFilters.district}</strong></span>}
        {appliedFilters.pincode && <span> near seller pincode <strong>{appliedFilters.pincode}</strong></span>}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center max-w-md mx-auto my-8 shadow-xs">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm border-2 border-amber-200/80 mx-auto mb-4 animate-float-slow">
            <img
              src={APP_IMAGES.buyerCartoon}
              alt="No products found"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {appliedFilters.categories.length > 0 || appliedFilters.district !== 'All' || appliedFilters.pincode || appliedFilters.search
              ? 'No products matched your search criteria'
              : 'No products listed yet in the marketplace'}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {appliedFilters.categories.length > 0 || appliedFilters.district !== 'All' || appliedFilters.pincode || appliedFilters.search
              ? 'Try broadening your categories or clearing pincode filters to see items from neighboring sellers.'
              : 'Local home makers and artisans publish new items here. Check back soon or request a custom bespoke item.'}
          </p>
          {(appliedFilters.categories.length > 0 || appliedFilters.district !== 'All' || appliedFilters.pincode || appliedFilters.search) && (
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all cursor-pointer border border-amber-200 btn-cartoon-pop"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        /* Product Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Product Image (zoomable, properly sized, responsive) */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                  <StorageImage
                    src={product.image}
                    storagePath={product.imageStoragePath}
                    alt={product.productName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-800 text-2xs font-semibold px-2.5 py-1 rounded-md shadow-2xs">
                    {product.category}
                  </div>
                  <button
                    type="button"
                    onClick={() => openZoom(product.image, product.productName, product.imageStoragePath)}
                    className="absolute top-3 right-3 p-1.5 bg-slate-950/70 hover:bg-slate-950 text-white rounded-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                    title="Click to zoom image"
                    aria-label="Zoom image"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  {/* Clean unboxed metadata with · */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{product.sellerDistrict}</span>
                    {product.sellerPincode && (
                      <span className="font-mono text-slate-400">({product.sellerPincode})</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>Min: <strong>{product.minOrderQty} units</strong></span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-800 font-medium">{product.paymentMode}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                    {product.productName}
                  </h3>

                  {product.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* Seller Info Strip */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium truncate max-w-[130px]">{product.sellerName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-mono">
                      <span>[{product.sellerShopCode}]</span>
                      {(marketplaceService.getSeller(product.sellerShopCode)?.rating ?? product.sellerRating) ? (
                        <span className="flex items-center gap-0.5 text-amber-700 font-sans font-semibold ml-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {marketplaceService.getSeller(product.sellerShopCode)?.rating ?? product.sellerRating}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Action Footer */}
              <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-2xs text-slate-500 block">Unit Price</span>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    ₹{product.price}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRequestingProduct(product)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-xs rounded-xl shadow-2xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer btn-cartoon-pop"
                >
                  <span>Request Product</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
