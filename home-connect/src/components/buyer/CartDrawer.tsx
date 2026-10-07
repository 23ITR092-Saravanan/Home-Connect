import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MapPin,
  Calendar,
  FileText,
  ArrowRight,
  ShieldCheck,
  Store,
  CreditCard,
  Banknote,
  Layers,
} from 'lucide-react';
import { BuyerProfile, CartItem, PaymentMode } from '../../types/index.ts';
import { CartService, OrderService } from '../../services/storage.ts';
import { useToast } from '../common/Toast.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  buyer: BuyerProfile;
  cart: CartItem[];
  onCartUpdated: (updated: CartItem[]) => void;
  onOrderPlaced: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  buyer,
  cart,
  onCartUpdated,
  onOrderPlaced,
}) => {
  const { showToast } = useToast();
  const [deliveryAddress, setDeliveryAddress] = useState(buyer.address);
  const [deliveryCity, setDeliveryCity] = useState(buyer.city);
  const [deliveryPincode, setDeliveryPincode] = useState(buyer.pincode);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 4);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('Cash After Delivery');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUpdateQuantity = (productId: string, newQty: number, minQty: number = 1) => {
    if (newQty < minQty) {
      showToast('info', 'Minimum Order Quantity', `This product has a minimum order quantity of ${minQty}`);
      return;
    }
    const updated = CartService.updateQuantity(productId, newQty);
    onCartUpdated(updated);
  };

  const handleRemoveItem = (productId: string) => {
    const updated = CartService.removeFromCart(productId);
    onCartUpdated(updated);
    showToast('info', 'Item Removed from Basket');
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Group items by sellerId
  const itemsBySeller: { [sellerId: string]: CartItem[] } = {};
  cart.forEach((item) => {
    if (!itemsBySeller[item.product.sellerId]) {
      itemsBySeller[item.product.sellerId] = [];
    }
    itemsBySeller[item.product.sellerId].push(item);
  });

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (!deliveryAddress.trim() || !deliveryCity.trim() || !deliveryPincode.trim()) {
      showToast('error', 'Delivery Address Required', 'Please provide a complete delivery address');
      return;
    }
    if (!expectedDeliveryDate) {
      showToast('error', 'Expected Delivery Date Required', 'Select when you need the order delivered.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sellerIds = Object.keys(itemsBySeller);
      const createdOrders = [];

      for (const sId of sellerIds) {
        const sellerItems = itemsBySeller[sId];
        const orderItems = sellerItems.map((ci) => ({
          productId: ci.product.id,
          title: ci.product.title,
          price: ci.product.price,
          quantity: ci.quantity,
          imageUrl: ci.product.imageUrl,
          minOrderQuantity: ci.product.minOrderQuantity,
        }));

        const newOrder = OrderService.createOrder({
          buyer,
          sellerId: sId,
          items: orderItems,
          deliveryAddress,
          deliveryCity,
          deliveryPincode,
          paymentMode: selectedPaymentMode,
          dueDate: expectedDeliveryDate,
          notes,
        });

        createdOrders.push(newOrder);
      }

      CartService.clearCart();
      onCartUpdated([]);

      showToast(
        'success',
        'Order Placed Successfully!',
        `${createdOrders.length} order(s) placed with home creator(s).`
      );

      onOrderPlaced();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      showToast('error', 'Checkout Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">Your Craft Basket</h3>
              <p className="text-xs text-stone-500">{cart.length} unique creation(s)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-stone-800 text-base">Your basket is empty</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Explore local home-crafted goods across 20 categories to fill your basket!
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Selected Items
                </h4>

                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3"
                  >
                    <div className="w-16 h-16 rounded-xl bg-stone-200 overflow-hidden shrink-0 border border-stone-200">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="font-bold text-xs text-stone-900 line-clamp-1">
                          {item.product.title}
                        </h5>
                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-stone-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Store className="w-3 h-3 text-amber-600" />
                        <span>{item.product.sellerName} ({item.product.sellerCode})</span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60">
                        <span className="font-extrabold text-xs text-emerald-800">
                          ₹{item.product.price * item.quantity}
                          <span className="text-[10px] font-normal text-stone-500 ml-1">
                            (₹{item.product.price} each)
                          </span>
                        </span>

                        <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-0.5">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.product.minOrderQuantity || 1
                              )
                            }
                            className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded"
                            title={`Minimum order quantity is ${item.product.minOrderQuantity || 1}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-stone-900 w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.product.minOrderQuantity || 1
                              )
                            }
                            className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Select Payment Option
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode('Cash After Delivery')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      selectedPaymentMode === 'Cash After Delivery'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cash After Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode('Online Payment')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      selectedPaymentMode === 'Online Payment'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Online Payment (UPI/Card)</span>
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Delivery Destination
                </h4>

                <label className="block space-y-1 text-xs font-semibold text-stone-700">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    Expected Delivery Date
                  </span>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setExpectedDeliveryDate(event.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs focus:border-emerald-500 focus:bg-white outline-none"
                    required
                  />
                </label>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery street address"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    required
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      placeholder="City"
                      className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={deliveryPincode}
                      onChange={(e) => setDeliveryPincode(e.target.value)}
                      placeholder="Pincode"
                      className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Notes for Sellers (Optional)
                </h4>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please deliver after 5 PM, mild spice preferred"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-xs text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero middleman commission. Direct connection with neighborhood makers.</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/90 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-stone-600">Subtotal ({cart.length} items)</span>
              <span className="font-extrabold text-stone-900 text-base">₹{totalAmount}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Place Order ({selectedPaymentMode}) &bull; ₹{totalAmount}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
