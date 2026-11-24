import React from 'react';
import { Package, Plus, Edit3, Trash2, ZoomIn, IndianRupee, Store, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { StorageImage } from '../common/StorageImage';

export const MyProductsList: React.FC = () => {
  const {
    products,
    activeSeller,
    setEditingProduct,
    deleteProduct,
    setSellerActiveTab,
    openZoom,
  } = useApp();

  // Filter products belonging to this seller
  const myProducts = products.filter((p) => p.sellerShopCode === activeSeller?.shopCode);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setSellerActiveTab('publish');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Products Inventory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active product listings associated with shop code <strong>{activeSeller?.shopCode}</strong>
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setSellerActiveTab('publish');
          }}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-2xs hover:shadow transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Product</span>
        </button>
      </div>

      {/* Empty State */}
      {myProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No products published yet</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Start listing your homemade crafts, textiles, and specialty foods to receive orders from neighborhood buyers.
          </p>
          <button
            onClick={() => setSellerActiveTab('publish')}
            className="mt-5 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        /* Product Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Product Image (zoomable, responsive, properly sized) */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
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
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>MOQ: <strong>{product.minOrderQty} units</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Payment: <strong className="text-sky-800">{product.paymentMode}</strong></span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-2">
                    {product.productName}
                  </h3>

                  {product.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Price & Actions Strip */}
              <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-2xs text-slate-500 block">Unit Price</span>
                  <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                    ₹{product.price}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="p-2 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                    title="Edit Product"
                    aria-label="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(product.id)}
                    className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                    title="Delete Product"
                    aria-label="Delete"
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
  );
};
