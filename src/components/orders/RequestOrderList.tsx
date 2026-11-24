import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Calendar,
  MapPin,
  Phone,
  User,
  ZoomIn,
  Edit3,
  Trash2,
  Star,
  Check,
  X,
  CreditCard,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductRequest, RequestStatus } from '../../types';
import { StorageImage } from '../common/StorageImage';
import { APP_IMAGES } from '../../assets/cartoonAssets';

interface RequestOrderListProps {
  viewMode: 'seller' | 'buyer';
  filterStatus?: RequestStatus;
  title: string;
  description?: string;
}

export const RequestOrderList: React.FC<RequestOrderListProps> = ({
  viewMode,
  filterStatus,
  title,
  description,
}) => {
  const {
    requests,
    activeSeller,
    activeBuyer,
    updateRequestStatus,
    markOrderCompletedBySeller,
    markOrderCompletedByBuyer,
    setEditingRequest,
    deleteRequest,
    setReviewingRequest,
    setEditingReview,
    deleteReview,
    openZoom,
    reviews,
    products,
  } = useApp();

  // State for seller rejection reason modal
  const [rejectingReq, setRejectingReq] = useState<ProductRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Filter requests according to viewMode & status
  const filteredRequests = requests.filter((r) => {
    // Role filter
    if (viewMode === 'seller') {
      const isForMyShop =
        r.sellerShopCode.toUpperCase() === activeSeller?.shopCode.toUpperCase() ||
        r.sellerShopCode === 'OPEN-MARKET';
      if (!isForMyShop) return false;

      // Status logic for seller
      if (filterStatus === 'pending') return r.status === 'pending';
      if (filterStatus === 'accepted') return r.status === 'accepted' && !r.sellerCompleted;
      if (filterStatus === 'rejected') return r.status === 'rejected';
      if (filterStatus === 'completed') return r.sellerCompleted === true || r.status === 'completed';
    } else {
      // Buyer sees their own orders
      const isMine = r.buyerUsername.toLowerCase() === activeBuyer?.username.toLowerCase();
      if (!isMine) return false;

      // Status logic for buyer
      if (filterStatus === 'pending') return r.status === 'pending';
      if (filterStatus === 'accepted') return r.status === 'accepted' && !r.buyerCompleted;
      if (filterStatus === 'completed') return r.buyerCompleted === true || r.status === 'completed';
      if (filterStatus && r.status !== filterStatus) return false;
    }

    return true;
  });

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectingReq) {
      updateRequestStatus(rejectingReq.id, 'rejected', rejectionReason);
      setRejectingReq(null);
      setRejectionReason('');
    }
  };

  const getStatusBadge = (req: ProductRequest) => {
    if (req.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Review</span>
        </span>
      );
    }

    if (req.status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
        </span>
      );
    }

    // Both completed
    if (req.buyerCompleted && req.sellerCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md">
          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fully Completed & Confirmed</span>
        </span>
      );
    }

    // Seller completed only
    if (req.sellerCompleted && !req.buyerCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-300 px-2.5 py-1 rounded-md">
          <PackageCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Completed by Seller · Awaiting Buyer</span>
        </span>
      );
    }

    // Buyer completed only
    if (req.buyerCompleted && !req.sellerCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-800 bg-purple-50 border border-purple-300 px-2.5 py-1 rounded-md">
          <PackageCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>Confirmed by Buyer · Awaiting Seller</span>
        </span>
      );
    }

    // Accepted and in progress
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-md">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Accepted & In Progress</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
          {filteredRequests.length} {filteredRequests.length === 1 ? 'Record' : 'Records'}
        </div>
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No requests in this category</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {viewMode === 'seller'
              ? 'Incoming requests from customers will appear here automatically when orders are placed.'
              : 'Browse marketplace products or request custom goods to see your order pipeline here.'}
          </p>
        </div>
      ) : (
        /* Requests Grid */
        <div className="grid grid-cols-1 gap-5">
          {filteredRequests.map((req) => {
            const matchedReview = reviews.find(
              (rev) => rev.requestId === req.id || (req.reviewId && rev.id === req.reviewId)
            );
            const isMyReview =
              matchedReview &&
              matchedReview.buyerUsername.toLowerCase() === activeBuyer?.username.toLowerCase();

            const linkedProduct = req.productId
              ? products.find((p) => p.id === req.productId)
              : undefined;
            const displayImage = req.sampleImage || linkedProduct?.image;
            const displayStoragePath = req.sampleStoragePath || linkedProduct?.imageStoragePath;

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  {/* Left: Product & Request Details */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Image / Sample Thumbnail with zoom */}
                    {(displayImage || displayStoragePath) && (
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <StorageImage
                            src={displayImage}
                            storagePath={displayStoragePath}
                            alt={req.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openZoom(
                              displayImage || APP_IMAGES.handcraftedPottery,
                              req.productName,
                              displayStoragePath
                            )
                          }
                          className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity cursor-pointer"
                          title="Zoom photo"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(req)}
                        {req.type === 'custom' && (
                          <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Custom Order
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {req.id} · {req.createdAt}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {req.productName}
                      </h3>

                      {/* Clean Unboxed Metadata with · separator */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>Category: {req.category}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>Quantity: <strong>{req.quantity} units</strong></span>
                        {req.unitPrice && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span>Rate: ₹{req.unitPrice}/unit</span>
                          </>
                        )}
                        {req.totalPrice && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="font-semibold text-slate-900 font-mono tabular-nums">
                              Total: ₹{req.totalPrice}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Delivery Date & Payment Mode */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1 text-amber-800">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Expected: <strong>{req.expectedDeliveryDate}</strong></span>
                        </div>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <div className="flex items-center gap-1 text-slate-700">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Payment: <strong>{req.paymentMode}</strong></span>
                        </div>
                      </div>

                      {/* Custom notes or specifications */}
                      {req.customDescription && (
                        <div className="mt-2 text-xs bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-slate-700">
                          <span className="font-semibold text-slate-900">Custom Notes: </span>
                          {req.customDescription}
                        </div>
                      )}

                      {/* Rejection notice if rejected */}
                      {req.status === 'rejected' && req.rejectionReason && (
                        <div className="mt-2 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-2.5">
                          <span className="font-semibold">Seller Feedback: </span>
                          {req.rejectionReason}
                        </div>
                      )}

                      {/* Independent Completion Indicators */}
                      {req.status === 'accepted' && (
                        <div className="mt-2 text-xs flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-2xs font-medium border ${
                              req.sellerCompleted
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            Seller Confirmed: {req.sellerCompleted ? 'Completed ✓' : 'In Progress'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-2xs font-medium border ${
                              req.buyerCompleted
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            Buyer Confirmed: {req.buyerCompleted ? 'Delivered ✓' : 'Awaiting Delivery'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: Contact & Logistics Details */}
                  <div className="lg:border-l lg:border-slate-100 lg:pl-6 text-xs text-slate-600 space-y-1.5 shrink-0 min-w-[220px]">
                    <div className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      {viewMode === 'seller' ? 'Customer Profile' : 'Seller Store'}
                    </div>

                    {viewMode === 'seller' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Buyer: <strong>{req.buyerUsername}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.buyerContact}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p>{req.deliveryAddress}</p>
                            <p className="text-slate-500 font-mono">{req.buyerDistrict} - {req.pincode}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Shop: <strong>{req.sellerName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500">Code: {req.sellerShopCode}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>District: {req.sellerDistrict || req.buyerDistrict}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                  {/* SELLER ACTIONS */}
                  {viewMode === 'seller' && (
                    <>
                      {req.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectionReason('');
                              setRejectingReq(req);
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject Request</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateRequestStatus(req.id, 'accepted')}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Request</span>
                          </button>
                        </>
                      )}

                      {/* Enable Mark as Completed after seller acceptance; independent seller completion */}
                      {req.status === 'accepted' && !req.sellerCompleted && (
                        <button
                          type="button"
                          onClick={() => markOrderCompletedBySeller(req.id)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Mark as Completed (Seller)</span>
                        </button>
                      )}

                      {req.sellerCompleted && !req.buyerCompleted && (
                        <span className="text-xs text-sky-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Marked completed by you · Awaiting buyer receipt confirmation
                        </span>
                      )}

                      {req.sellerCompleted && req.buyerCompleted && (
                        <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Fully completed & confirmed by both parties
                        </span>
                      )}
                    </>
                  )}

                  {/* BUYER ACTIONS */}
                  {viewMode === 'buyer' && (
                    <>
                      {/* Before acceptance, buyer can edit or delete their request */}
                      {req.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingRequest(req)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Request</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRequest(req.id)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete / Cancel</span>
                          </button>
                        </>
                      )}

                      {/* After acceptance, buyer CANNOT edit or delete the request! */}
                      {req.status === 'accepted' && (
                        <>
                          {!req.buyerCompleted ? (
                            <button
                              type="button"
                              onClick={() => markOrderCompletedByBuyer(req.id)}
                              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Confirm Received & Completed</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              You confirmed order completion
                            </span>
                          )}
                        </>
                      )}

                      {/* Reviews: Buyer can add review AFTER marking order completed! */}
                      {req.buyerCompleted && (
                        <>
                          {!matchedReview ? (
                            <button
                              type="button"
                              onClick={() => setReviewingRequest(req)}
                              className="px-4 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>Add Review</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-amber-800 font-medium flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                Review ({matchedReview.rating}★)
                              </span>
                              {isMyReview && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setEditingReview(matchedReview)}
                                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="Edit your review"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteReview(matchedReview.id)}
                                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete your review"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Seller Rejection Reason Dialog Modal */}
      {rejectingReq && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900">
              Reject Request ({rejectingReq.productName})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide a clear reason so the customer understands why this order cannot be fulfilled.
            </p>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Rejection <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-100"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingReq(null);
                    setRejectionReason('');
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
