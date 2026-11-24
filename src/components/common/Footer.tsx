import React from 'react';
import { Home, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/80 py-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xs">
            <Home className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-800">Home Connect</span>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1 text-slate-600">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Empowering Neighborhood Artisans & Direct Trade
          </span>
        </div>
        <p className="text-slate-400">
          &copy; {new Date().getFullYear()} Home Connect. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
