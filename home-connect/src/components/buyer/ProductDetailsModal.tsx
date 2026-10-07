import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  MapPin,
  IndianRupee,
  ShoppingBag,
  Phone,
  Mail,
  ShieldCheck,
  Package,
  Layers,
  CreditCard,
  Banknote,
  Info,
  Send,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2,
  ArrowLeft,
  Calendar,
  Check,
  Star,
} from 'lucide-react';
import { BuyerProfile, PaymentMode, Product } from '../../types/index.ts';
import { OrderService, ProductRequestService, ReviewService } from '../../services/storage.ts';
import { useToast } from '../common/Toast.tsx';

interface ProductDetailsModalProps {
  product: Product | null;
  buyer?: BuyerProfile;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess?: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  buyer,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { showToast } = useToast();

  // Image zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Place Order Modal State
  const [showPlaceOrderModal, setShowPlaceOrderModal] = useState<boolean>(false);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderDueDate, setOrderDueDate] = useState<string>('');
  const [orderDeliveryAddress, setOrderDeliveryAddress] = useState<string>('');
  const [orderDeliveryCity, setOrderDeliveryCity] = useState<string>('');
  const [orderDeliveryPincode, setOrderDeliveryPincode] = useState<string>('');
  const [orderPaymentMode, setOrderPaymentMode] = useState<PaymentMode>('Cash After Delivery');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);

  // Custom Request Form State
  const [showRequestForm, setShowRequestForm] = useState<boolean>(false);
  const [reqTitle, setReqTitle] = useState<string>('');
  const [reqDesc, setReqDesc] = useState<string>('');
  const [reqQty, setReqQty] = useState<number>(1);
  const [reqDueDate, setReqDueDate] = useState<string>('');
  const [submittingReq, setSubmittingReq] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setZoomLevel(1);
      const minQty = product.minOrderQuantity || 1;
      setOrderQuantity(minQty);
      setReqQty(minQty);
      setReqTitle(`Custom ${product.title}`);
      setShowPlaceOrderModal(false);
      setShowRequestForm(false);

      // Pre-fill delivery info from buyer
      if (buyer) {
        setOrderDeliveryAddress(buyer.address || '');
        setOrderDeliveryCity(buyer.city || '');
        setOrderDeliveryPincode(buyer.pincode || '');
      }

      // Default payment mode matching product
      if (product.paymentMode === 'Online Payment') {
        setOrderPaymentMode('Online Payment');
      } else {
        setOrderPaymentMode('Cash After Delivery');
      }

      // Set default due date to 3 days from now
      const d = new Date();
      d.setDate(d.getDate() + 3);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setOrderDueDate(`${yyyy}-${mm}-${dd}`);
      setReqDueDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [product, buyer, isOpen]);

  if (!isOpen || !product) return null;

  const minMoq = product.minOrderQuantity || 1;

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(1, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => setZoomLevel(1);

  // Share Product handler
  const handleShareProduct = async () => {
    const shareData = {
      title: product.title,
      text: `Check out "${product.title}" by ${product.sellerName} on HomeCraft Connect! Price: ₹${product.price}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        showToast('success', 'Product Shared!', 'Thank you for sharing local crafts.');
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\nSeller Code: ${product.sellerCode}\n${window.location.href}`
        );
        showToast('success', 'Link & Details Copied!', 'Product info copied to your clipboard.');
      }
    } catch (err) {
      showToast('info', 'Share link copied', 'Link copied to clipboard');
    }
  };

  // Place Order submission
  const handleConfirmPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyer) {
      showToast('error', 'Login Required', 'Please log in to place orders');
      return;
    }
    if (orderQuantity < minMoq) {
      showToast('error', 'Minimum Quantity', `Minimum order quantity is ${minMoq}`);
      return;
    }
    if (!orderDueDate) {
      showToast('error', 'Due Date Required', 'Please select a required due date');
      return;
    }
    if (!orderDeliveryAddress.trim() || !orderDeliveryCity.trim() || !orderDeliveryPincode.trim()) {
      showToast('error', 'Address Required', 'Please provide delivery address, city, and pincode');
      return;
    }

    setPlacingOrder(true);
    try {
      const order = OrderService.createOrder({
        buyer,
        sellerId: product.sellerId,
        items: [
          {
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: orderQuantity,
            imageUrl: product.imageUrl,
            minOrderQuantity: product.minOrderQuantity,
          },
        ],
        deliveryAddress: orderDeliveryAddress.trim(),
        deliveryCity: orderDeliveryCity.trim(),
        deliveryPincode: orderDeliveryPincode.trim(),
        paymentMode: orderPaymentMode,
        dueDate: orderDueDate,
        notes: orderNotes.trim(),
      });

      // Send the request to that seller
      await ProductRequestService.createRequest({
        seller: {
          id: product.sellerId,
          sellerCode: product.sellerCode,
          username: product.sellerName,
        } as any,
        buyer,
        productTitle: product.title,
        category: product.category,
        description: `Order placement for "${product.title}" (${orderQuantity} unit(s) @ ₹${product.price} each). Due: ${orderDueDate}. Address: ${orderDeliveryAddress.trim()}, ${orderDeliveryCity.trim()} (${orderDeliveryPincode.trim()})${orderNotes.trim() ? `. Note: ${orderNotes.trim()}` : ''}`,
        targetQuantity: orderQuantity,
        dueDate: orderDueDate,
        paymentMode: orderPaymentMode,
        orderId: order.id,
        productId: product.id,
      });

      showToast(
        'success',
        'Order Request Sent!',
        `Request for ${orderQuantity} × "${product.title}" (Due: ${orderDueDate}) sent to ${product.sellerName}. View under Pending Requests!`
      );

      setShowPlaceOrderModal(false);
      onClose();
      if (onOrderSuccess) onOrderSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      showToast('error', 'Error', msg);
    } finally {
      setPlacingOrder(false);
    }
  };

  // Send Custom Request submission
  const handleSendCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer) {
      showToast('error', 'Login Required', 'Please log in to send custom requests');
      return;
    }
    if (!reqTitle.trim() || !reqDesc.trim()) {
      showToast('error', 'Missing Information', 'Please provide a request title and description');
      return;
    }

    setSubmittingReq(true);
    try {
      await ProductRequestService.createRequest({
        seller: {
          id: product.sellerId,
          sellerCode: product.sellerCode,
          username: product.sellerName,
        } as any,
        buyer,
        productTitle: reqTitle.trim(),
        category: product.category,
        description: reqDesc.trim(),
        targetQuantity: reqQty,
        dueDate: reqDueDate,
        paymentMode: product.paymentMode,
      });

      showToast('success', 'Custom Request Sent!', `Sent directly to ${product.sellerName}`);
      setShowRequestForm(false);
      onClose();
      if (onOrderSuccess) onOrderSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send request';
      showToast('error', 'Error', msg);
    } finally {
      setSubmittingReq(false);
    }
  };

  const ratingStats = ReviewService.getSellerRatingStats(product.sellerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="relative">
          {/* Top action buttons: Share and Close */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={handleShareProduct}
              className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-stone-800 text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-md transition"
              title="Share Product"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Share Product</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Back to products"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-black/60 px-3 text-white shadow-md backdrop-blur-md transition hover:bg-black/80"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs font-semibold">Back</span>
            </button>
          </div>

          {/* Product Image with Zoom Controls */}
          <div className="relative h-64 sm:h-72 bg-stone-100 overflow-hidden flex items-center justify-center select-none">
            <img
              src={product.imageUrl}
              alt={product.title}
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease-out',
              }}
              className="w-full h-full object-cover origin-center"
            />

            {/* Category badge */}
            <div className="absolute bottom-4 left-4 z-10">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/95 text-stone-900 shadow-md backdrop-blur-md">
                {product.category}
              </span>
            </div>

            {/* Image Zoom in / Zoom out Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white/20">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-1.5 text-white/80 hover:text-white disabled:opacity-40 rounded-lg hover:bg-white/10 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-white font-bold px-1 min-w-[38px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2.5}
                className="p-1.5 text-white/80 hover:text-white disabled:opacity-40 rounded-lg hover:bg-white/10 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition ml-0.5"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Title & Price */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                {product.title}
              </h2>
              <div className="text-right shrink-0">
                <span className="text-2xl font-black text-emerald-700">₹{product.price}</span>
                <span className="text-[11px] text-stone-500 block">per individual unit</span>
              </div>
            </div>

            {/* Badges: In Stock, MOQ, Payment Mode */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <span
                className={`font-bold px-2.5 py-1 rounded-full ${
                  product.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>

              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                Minimum Order Quantity: <strong>{product.minOrderQuantity || 1}</strong>
              </span>

              <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                {product.paymentMode === 'Cash After Delivery' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                {product.paymentMode === 'Online Payment' && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                {product.paymentMode === 'Both' && <CreditCard className="w-3.5 h-3.5 text-amber-600" />}
                Payment Mode: <strong>{product.paymentMode}</strong>
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 text-stone-700 text-sm leading-relaxed">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              Description
            </h4>
            <p className="whitespace-pre-line text-xs sm:text-sm">{product.description}</p>
          </div>

          {/* Additional Information */}
          {product.additionalInfo && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-xs text-amber-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Additional Information:</strong>
                <p className="mt-0.5 text-stone-700">{product.additionalInfo}</p>
              </div>
            </div>
          )}

          {/* Seller Basic Details */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">{product.sellerName}</h4>
                  <span className="text-[11px] font-mono text-amber-800 font-semibold">
                    Seller Code: {product.sellerCode}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-stone-600 flex items-center gap-1 font-medium justify-end">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  {product.sellerCity}
                </span>
                {ratingStats.count > 0 && (
                  <span className="text-[11px] font-bold text-amber-700 block mt-0.5">
                    ★ {ratingStats.average} ({ratingStats.count} review{ratingStats.count !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-700">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Home Creator</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`tel:${product.sellerContact}`}
                  className="text-stone-800 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 text-stone-500" />
                  {product.sellerContact}
                </a>
              </div>
            </div>
          </div>

          {/* Custom Product Request Form Toggle */}
          {!showRequestForm ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowRequestForm(true)}
                className="text-xs text-amber-800 hover:text-amber-950 font-bold inline-flex items-center gap-1.5 hover:underline"
              >
                <Send className="w-3.5 h-3.5" />
                Need customized dimensions, flavor, or craft? Send a Custom Request to this Maker
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendCustomRequest} className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                  Request Custom Craft from {product.sellerName}
                </h5>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="text-stone-400 hover:text-stone-700 text-xs"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="Request Title"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:border-amber-500"
                required
              />

              <textarea
                rows={2}
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                placeholder="Describe your customized requirements..."
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:border-amber-500"
                required
              />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Target Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={reqQty}
                    onChange={(e) => setReqQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Needed Due Date:</label>
                  <input
                    type="date"
                    value={reqDueDate}
                    onChange={(e) => setReqDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                >
                  {submittingReq ? 'Sending...' : 'Send Custom Request'}
                </button>
              </div>
            </form>
          )}

          {/* PLACE ORDER BUTTON & INLINE MODAL */}
          <div className="pt-2 border-t border-stone-100 space-y-4">
            {!showPlaceOrderModal ? (
              <button
                type="button"
                onClick={() => setShowPlaceOrderModal(true)}
                disabled={!product.inStock}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                  product.inStock
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/20'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {product.inStock
                    ? `Place Order for this Product (Min Qty: ${minMoq})`
                    : 'Out of Stock'}
                </span>
              </button>
            ) : (
              /* When buyer clicks Place Order: Ask Quantity & Due Date */
              <form
                onSubmit={handleConfirmPlaceOrder}
                className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-4 animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    Place Order & Send Request to {product.sellerName}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowPlaceOrderModal(false)}
                    className="text-stone-400 hover:text-stone-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {/* 1. Quantity & 2. Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Order Quantity <span className="text-rose-500">*</span>
                      <span className="text-[10px] font-normal text-stone-500 ml-1">
                        (Minimum: {minMoq})
                      </span>
                    </label>
                    <input
                      type="number"
                      min={minMoq}
                      step="1"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Math.max(minMoq, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-900 outline-none focus:border-emerald-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      Expected Delivery Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={orderDueDate}
                      onChange={(e) => setOrderDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-900 outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>

                {/* Total amount preview */}
                <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs text-stone-600">
                    Total Order Value ({orderQuantity} units &times; ₹{product.price})
                  </span>
                  <span className="text-lg font-black text-emerald-800">
                    ₹{orderQuantity * product.price}
                  </span>
                </div>

                {/* Delivery Address */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700">
                    Delivery Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orderDeliveryAddress}
                    onChange={(e) => setOrderDeliveryAddress(e.target.value)}
                    placeholder="Street Address / Flat No"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:border-emerald-600"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={orderDeliveryCity}
                      onChange={(e) => setOrderDeliveryCity(e.target.value)}
                      placeholder="City"
                      className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:border-emerald-600"
                      required
                    />
                    <input
                      type="text"
                      value={orderDeliveryPincode}
                      onChange={(e) => setOrderDeliveryPincode(e.target.value)}
                      placeholder="Pincode"
                      className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>

                {/* Payment Mode Selection */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Payment Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderPaymentMode('Cash After Delivery')}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition ${
                        orderPaymentMode === 'Cash After Delivery'
                          ? 'border-emerald-600 bg-white text-emerald-900 shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      Cash After Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderPaymentMode('Online Payment')}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition ${
                        orderPaymentMode === 'Online Payment'
                          ? 'border-emerald-600 bg-white text-emerald-900 shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      Online Payment
                    </button>
                  </div>
                </div>

                {/* Additional Notes */}
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Optional delivery notes or customization details..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:border-emerald-600"
                />

                {/* Submit button */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPlaceOrderModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {placingOrder ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm & Send Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
