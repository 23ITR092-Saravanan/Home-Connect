import React, { useState } from 'react';
import { Sparkles, Search, MapPin, Calendar, Check, X, ZoomIn, CreditCard, User, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AVAILABLE_DISTRICTS, PRODUCT_CATEGORIES } from '../../data/mockData';
import { marketplaceService } from '../../services/marketplaceService';
import { StorageImage } from '../common/StorageImage';

export const CustomerRequestsMarket: React.FC = () => {
  const { updateRequestStatus, activeSeller, openZoom } = useApp();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [pincodeFilter, setPincodeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Seller rejection modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleReset = () => {
    setCategoryFilter('All');
    setDistrictFilter('All');
    setPincodeFilter('');
    setSearchTerm('');
  };

  const handleMatchMyProfile = () => {
    if (activeSeller) {
      setDistrictFilter(activeSeller.district);
      setPincodeFilter(activeSeller.pincode);
    }
  };

  // Uses marketplaceService searchCustomRequests
  const customRequests = marketplaceService.searchCustomRequests({
    categories: categoryFilter !== 'All' ? [categoryFilter] : undefined,
    district: districtFilter !== 'All' ? districtFilter : undefined,
    pincode: pincodeFilter.trim() || undefined,
    search: searchTerm.trim() || undefined,
  });

  const handleClaimRequest = (requestId: string) => {
    updateRequestStatus(requestId, 'accepted');
  };

  const handleRejectCustomRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;

    updateRequestStatus(rejectingId, 'rejected', rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Search for Customer Product Requests</h2>
              <p className="text-xs text-slate-500">
                Filter customized requests by category, district, and pincode to bid and fulfill local buyer orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleMatchMyProfile}
              className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Match My Location ({activeSeller?.district})
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-1.5 transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Grid: Any one works; multiple use AND logic */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Search Keywords
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Nameplate, pottery, honey..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-purple-600"
            >
              <option value="All">All Categories</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Buyer District
            </label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-purple-600"
            >
              <option value="All">All Districts</option>
              {AVAILABLE_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Buyer Pincode
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 641004"
              value={pincodeFilter}
              onChange={(e) => setPincodeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:border-purple-600"
            />
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500 font-medium">
          Showing {customRequests.length} custom request(s)
        </div>
      </div>

      {/* Requests Feed */}
      {customRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No custom requests found</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {categoryFilter !== 'All' || districtFilter !== 'All' || pincodeFilter || searchTerm
              ? 'Try resetting your filters or clearing pincode constraints to see requests from other nearby districts.'
              : 'When customers in your district submit bespoke product requests, they will appear here for you to claim and fulfill.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {customRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all"
            >
              <div className="flex flex-col md:flex-row items-start justify-between gap-5">
                <div className="flex items-start gap-4 flex-1">
                  {req.sampleImage && (
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <StorageImage
                          src={req.sampleImage}
                          storagePath={req.sampleStoragePath}
                          alt="Customer sample reference"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => openZoom(req.sampleImage!, 'Customer Sample Image', req.sampleStoragePath)}
                        className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity cursor-pointer"
                        title="Zoom Sample"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {req.category}
                      </span>
                      <span className="text-2xs text-slate-400 font-mono">
                        Posted {req.createdAt}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {req.productName}
                    </h3>

                    {req.customDescription && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                        <strong className="text-slate-900">Buyer Specifications:</strong> {req.customDescription}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                      <span>Required Qty: <strong>{req.quantity} units</strong></span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <div className="flex items-center gap-1 text-amber-800">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Target Delivery: <strong>{req.expectedDeliveryDate}</strong></span>
                      </div>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>Payment: <strong>{req.paymentMode}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buyer Location & Actions (Accept or Reject) */}
                <div className="md:border-l md:border-slate-100 md:pl-6 text-xs text-slate-600 space-y-2 shrink-0 min-w-[200px]">
                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer: {req.buyerUsername}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{req.buyerDistrict} - {req.pincode}</span>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleClaimRequest(req.id)}
                          className="w-full py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept to Fulfill Order</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectReason('');
                            setRejectingId(req.id);
                          }}
                          className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline Request</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 block text-center">
                        Status: {req.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900">Decline Custom Order Request</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide a note explaining why your workshop cannot fulfill this custom request.
            </p>

            <form onSubmit={handleRejectCustomRequest} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Declining <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-100"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingId(null);
                    setRejectReason('');
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
