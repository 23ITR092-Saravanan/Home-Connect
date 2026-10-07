import React, { useState, useEffect } from 'react';
import { X, Star, Check, Tag } from 'lucide-react';
import { BuyerProfile, Order, Review, REVIEW_TAGS } from '../../types/index.ts';
import { ReviewService } from '../../services/storage.ts';
import { useToast } from './Toast.tsx';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  buyer: BuyerProfile;
  existingReview?: Review | null;
  onSaved: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  buyer,
  existingReview,
  onSaved,
}) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setSelectedTags(existingReview.tags || []);
      setComment(existingReview.comment || '');
    } else {
      setRating(5);
      setSelectedTags(['Good', 'Good Product Quality', 'On Time Delivery']);
      setComment('');
    }
  }, [existingReview, isOpen]);

  if (!isOpen || !order) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (existingReview) {
        // Only the review owner can edit their review
        if (existingReview.buyerId !== buyer.id) {
          showToast('error', 'Unauthorized', 'Only the review owner can edit their review');
          return;
        }

        ReviewService.updateReview(existingReview.id, buyer.id, {
          rating,
          tags: selectedTags,
          comment,
        });

        showToast('success', 'Review Updated!', 'Your feedback was successfully updated.');
      } else {
        ReviewService.addReview({
          sellerId: order.sellerId,
          orderId: order.id,
          buyerId: buyer.id,
          buyerUsername: buyer.username,
          rating,
          tags: selectedTags,
          comment,
        });

        showToast('success', 'Review Submitted!', 'Thank you for rating this home maker.');
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save review';
      showToast('error', 'Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper styling for tag categories
  const getTagStyle = (tag: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:border-stone-300';
    }

    if (
      ['Best', 'Good', 'Reasonable Price', 'Good Product Quality', 'On Time Delivery', 'Early Delivery', 'Good Response'].includes(tag)
    ) {
      return 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500';
    }

    if (['Average'].includes(tag)) {
      return 'bg-amber-500 text-white border-amber-500 shadow-xs ring-1 ring-amber-400';
    }

    // Poor / Negative tags
    return 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 my-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-extrabold text-lg text-stone-900">
              {existingReview ? 'Edit Your Review' : 'Review Home Maker'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Maker: <strong>{order.sellerName}</strong> &bull; Order #{order.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Star Rating <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 hover:scale-110 transition focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-stone-700 ml-2">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Multiple Selection Badges */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                Select Feedback Tags <span className="text-stone-400 font-normal">(Multiple selections allowed)</span>
              </label>
              <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {selectedTags.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 select-none cursor-pointer ${getTagStyle(
                      tag,
                      isSelected
                    )}`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Comments Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Comments / Detailed Feedback <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience about product taste, handmade quality, packaging, and delivery..."
              className="w-full p-3 rounded-2xl border border-stone-200 text-xs text-stone-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 bg-stone-50/50"
            />
          </div>

          {/* Public Notice */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600">
            <span>
              Your review will be shown publicly with your username: <strong>{buyer.username}</strong>. Only you can edit this review later.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : existingReview ? 'Save Changes' : 'Publish Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
