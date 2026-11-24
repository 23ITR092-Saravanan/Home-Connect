import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ReviewFormModal: React.FC = () => {
  const {
    reviewingRequest,
    setReviewingRequest,
    editingReview,
    setEditingReview,
    submitReview,
    updateReview,
  } = useApp();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [writtenReview, setWrittenReview] = useState('');
  const [error, setError] = useState('');

  const isOpen = Boolean(reviewingRequest || editingReview);

  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating);
      setWrittenReview(editingReview.writtenReview);
      setError('');
    } else if (reviewingRequest) {
      setRating(5);
      setWrittenReview('');
      setError('');
    }
  }, [editingReview, reviewingRequest]);

  if (!isOpen) return null;

  const handleClose = () => {
    setReviewingRequest(null);
    setEditingReview(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writtenReview.trim()) {
      setError('Please write a brief review sharing your experience');
      return;
    }
    if (writtenReview.trim().length < 10) {
      setError('Review must be at least 10 characters long');
      return;
    }

    if (editingReview) {
      // Editing review
      const res = updateReview(editingReview.id, {
        rating,
        writtenReview: writtenReview.trim(),
      });
      if (res) handleClose();
    } else if (reviewingRequest) {
      // Submitting new review
      const res = submitReview({
        requestId: reviewingRequest.id,
        rating,
        writtenReview: writtenReview.trim(),
      });
      if (res) handleClose();
    }
  };

  const ratingDescriptions: Record<number, string> = {
    1: 'Poor / Did not meet expectations',
    2: 'Fair / Below average',
    3: 'Good / Met expectations',
    4: 'Very Good / Great quality',
    5: 'Excellent / Outstanding home craftsmanship',
  };

  const title = editingReview
    ? `Edit Review for ${editingReview.productName || 'Order'}`
    : `Add Verified Review for ${reviewingRequest?.productName || 'Order'}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {editingReview ? 'Edit Order Review' : 'Add Order Review'}
            </h3>
            <p className="text-xs text-slate-500">
              {editingReview ? editingReview.productName : reviewingRequest?.productName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Overall Rating <span className="text-rose-600">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-115 cursor-pointer"
                    aria-label={`${star} Stars`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        filled
                          ? 'fill-amber-400 text-amber-500'
                          : 'fill-slate-100 text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-3 text-xs font-medium text-slate-600">
                {ratingDescriptions[hoverRating || rating]}
              </span>
            </div>
          </div>

          {/* Written Review */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Written Review <span className="text-rose-600">*</span>
              </label>
              <span className="text-xs text-slate-400">{writtenReview.length}/500</span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Describe the craft quality, packaging, freshness, and overall communication with the local seller..."
              value={writtenReview}
              onChange={(e) => {
                setWrittenReview(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-100 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingReview ? 'Save Changes' : 'Submit Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
