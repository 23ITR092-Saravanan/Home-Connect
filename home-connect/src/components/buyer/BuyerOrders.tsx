import React, { useState } from 'react';
import {
  ShoppingBag,
  Store,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Star,
  Send,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.ts';
import { OrderService, ReviewService } from '../../services/storage.ts';
import { useToast } from '../common/Toast.tsx';

interface BuyerOrdersProps {
  orders: Order[];
  onOrdersUpdated: () => void;
}

export const BuyerOrders: React.FC<BuyerOrdersProps> = ({ orders, onOrdersUpdated }) => {
  const { showToast } = useToast();
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleCancelOrder = (orderId: string) => {
    try {
      OrderService.cancelOrderWithReason(orderId, 'Cancelled by buyer', 'buyer');
      onOrdersUpdated();
      showToast('info', 'Order Cancelled', 'Your order was marked as cancelled.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel order';
      showToast('error', 'Error', msg);
    }
  };

  const handlePostReview = (order: Order) => {
    if (!comment.trim()) {
      showToast('error', 'Review Required', 'Please write a brief review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      const existingReview = ReviewService.getReviewByOrder(order.id);
      if (existingReview) {
        ReviewService.updateReview(existingReview.id, order.buyerId, {
          rating,
          tags: ['Good', 'Good Product Quality'],
          comment: comment.trim(),
        });
      } else {
        ReviewService.addReview({
          sellerId: order.sellerId,
          orderId: order.id,
          buyerId: order.buyerId,
          buyerUsername: order.buyerUsername,
          rating,
          tags: ['Good', 'Good Product Quality'],
          comment: comment.trim(),
        });
      }

      showToast('success', 'Review Submitted!', 'Thank you for rating this home creator.');
      setReviewingOrderId(null);
      setComment('');
      setRating(5);
      onOrdersUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      showToast('error', 'Error', msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 2;
      case 'dispatched':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Placed', icon: Clock },
    { label: 'Accepted', icon: CheckCircle2 },
    { label: 'Preparing', icon: RotateCcw },
    { label: 'Dispatched', icon: Truck },
    { label: 'Delivered', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Your Orders & Tracking</h2>
          <p className="text-xs text-stone-500">Live order status and local maker contact</p>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {orders.length} Order(s) Placed
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900">No orders yet</h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
            Browse through home-crafted creations across our 20 categories to place your first neighborhood order!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            const isCancelled = order.status === 'cancelled';
            const isDelivered = order.status === 'delivered';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 sm:p-6 transition"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-md">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                          order.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : order.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'preparing'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status === 'dispatched'
                            ? 'bg-indigo-100 text-indigo-800'
                            : order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      Ordered: {new Date(order.createdAt).toLocaleString()} &bull; Payment: <strong>{order.paymentMode}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-stone-400 block">Total</span>
                    <span className="text-xl font-black text-emerald-700">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Tracking Progress */}
                {!isCancelled ? (
                  <div className="py-6 border-b border-stone-100">
                    <div className="relative">
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-200 -z-0" />
                      <div
                        className="absolute top-4 left-4 h-0.5 bg-emerald-600 transition-all duration-300 -z-0"
                        style={{
                          width: `${Math.min(100, Math.max(0, (currentStepIdx / (steps.length - 1)) * 95))}%`,
                        }}
                      />

                      <div className="flex justify-between relative z-10">
                        {steps.map((st, sIdx) => {
                          const isDone = sIdx <= currentStepIdx;
                          const isCurrent = sIdx === currentStepIdx;
                          return (
                            <div key={st.label} className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                                  isDone
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-stone-200 text-stone-500'
                                } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                              >
                                {sIdx + 1}
                              </div>
                              <span
                                className={`text-[10px] mt-1.5 font-semibold text-center max-w-[65px] ${
                                  isDone ? 'text-stone-900' : 'text-stone-400'
                                }`}
                              >
                                {st.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 my-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 px-4">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>This order was cancelled.</span>
                  </div>
                )}

                {/* Seller & Items info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  {/* Seller Contact */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-amber-700" />
                        <span className="font-bold text-stone-900 text-sm">{order.sellerName}</span>
                      </div>
                      <span className="font-mono text-amber-800 text-xs font-bold">
                        {order.sellerCode}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <a
                        href={`tel:${order.sellerContact}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-800 font-semibold hover:bg-stone-50 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        Call {order.sellerContact}
                      </a>
                      <a
                        href={`https://wa.me/${order.sellerContact.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                      Items Ordered
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-100"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-md bg-stone-200 overflow-hidden shrink-0">
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-stone-900 line-clamp-1">{item.title}</span>
                              <span className="text-[11px] text-stone-500">
                                {item.quantity} unit(s) &times; ₹{item.price}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-stone-900">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Form for Delivered Orders */}
                {isDelivered && (
                  <div className="pt-3 border-t border-stone-100">
                    {reviewingOrderId !== order.id ? (
                      <button
                        onClick={() => setReviewingOrderId(order.id)}
                        className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                        Rate & Review this Home Creator
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                            Rate Your Experience with {order.sellerName}
                          </h5>
                          <button
                            onClick={() => setReviewingOrderId(null)}
                            className="text-stone-400 hover:text-stone-700 text-xs"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Star Rating Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-600">Your Rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setRating(s)}
                                className="p-1 hover:scale-110 transition"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    s <= rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-stone-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-stone-800 ml-1">
                            {rating} / 5 Stars
                          </span>
                        </div>

                        <textarea
                          rows={2}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="How was the quality, packaging, and home craft experience?"
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:border-amber-500"
                        />

                        <button
                          type="button"
                          disabled={submittingReview}
                          onClick={() => handlePostReview(order)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Cancel option */}
                {order.status === 'pending' && (
                  <div className="pt-3 border-t border-stone-100 flex justify-end">
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-xs text-rose-700 hover:text-rose-800 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
