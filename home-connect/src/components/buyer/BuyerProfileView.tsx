import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Building, Hash, Save, ShieldCheck } from 'lucide-react';
import { BuyerProfile } from '../../types/index.ts';
import { AuthService } from '../../services/storage.ts';
import { useToast } from '../common/Toast.tsx';

interface BuyerProfileViewProps {
  buyer: BuyerProfile;
  onProfileUpdated: (updated: BuyerProfile) => void;
}

export const BuyerProfileView: React.FC<BuyerProfileViewProps> = ({
  buyer,
  onProfileUpdated,
}) => {
  const { showToast } = useToast();
  const [username, setUsername] = useState(buyer.username);
  const [mobileNumber, setMobileNumber] = useState(buyer.mobileNumber);
  const [email, setEmail] = useState(buyer.email);
  const [address, setAddress] = useState(buyer.address);
  const [city, setCity] = useState(buyer.city);
  const [pincode, setPincode] = useState(buyer.pincode);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updated = await AuthService.updateBuyerProfile(buyer.id, {
        username: username.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
      });

      onProfileUpdated(updated);
      showToast('success', 'Profile Updated', 'Your delivery and account details were saved.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      showToast('error', 'Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Account Badge */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-700/15 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
          <User className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Registered Buyer Account
          </span>
          <h2 className="text-2xl font-bold">{buyer.username}</h2>
          <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {buyer.city} ({buyer.pincode})
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-3 mb-6 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Buyer Profile & Delivery Address
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Username *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:bg-white focus:border-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:bg-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:bg-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Default Delivery Address *
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:bg-white focus:border-emerald-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                City *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:bg-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Pincode *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:bg-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
