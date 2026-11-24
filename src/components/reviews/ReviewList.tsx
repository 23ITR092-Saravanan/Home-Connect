import React from 'react';
import { Star, MessageSquare, CheckCircle2, User } from 'lucide-react';
import { Review } from '../../types';

interface ReviewListProps {
  reviews: Review[];
  title?: string;
  subtitle?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  title = 'Public Customer Reviews',
  subtitle = 'Verified feedback from local neighborhood community buyers',
}) => {
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-10 text-center max-w-md mx-auto my-6 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No customer reviews yet</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Verified reviews and ratings from delivered orders will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                    {rev.buyerUsername.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-900">
                        {rev.buyerUsername}
                      </span>
                      <span className="text-2xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Order
                      </span>
                    </div>
                    <span className="text-2xs text-slate-400 font-mono">
                      {rev.createdAt}
                    </span>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= rev.rating
                          ? 'fill-amber-400 text-amber-500'
                          : 'fill-slate-100 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {rev.productName && (
                <div className="text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 w-fit">
                  Item: <span className="text-slate-900 font-semibold">{rev.productName}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                "{rev.writtenReview}"
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-2xs text-slate-400 flex items-center justify-between font-mono">
              <span>Shop: {rev.sellerShopCode}</span>
              <span>Review #{rev.id.slice(-6)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
