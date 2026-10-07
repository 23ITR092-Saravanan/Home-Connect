import React, { useState } from 'react';
import {
  Store,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Lock,
  Tag,
  Upload,
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
  Building,
  Hash,
  Check,
} from 'lucide-react';
import { PRESET_CATEGORIES } from '../../types/index.ts';
import { AuthService, generateUniqueCode } from '../../services/storage.ts';
import { optimizeImage } from '../../services/images.ts';
import { useToast } from '../common/Toast.tsx';

interface SellerAuthProps {
  initialMode?: 'login' | 'register';
  onBack: () => void;
  onSuccess: () => void;
}

export const SellerAuth: React.FC<SellerAuthProps> = ({
  initialMode = 'login',
  onBack,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login form state
  const [loginSellerCode, setLoginSellerCode] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [sellerCode, setSellerCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');

  // Handle image upload for Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image too large', 'Please upload an image smaller than 2MB');
      return;
    }

    try {
      setLogoDataUrl(await optimizeImage(file, 640, 0.75));
    } catch (error) {
      showToast('error', 'Image Processing Failed', error instanceof Error ? error.message : 'Please try another image.');
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    if (!selectedCategories.includes(trimmed)) {
      setSelectedCategories((prev) => [...prev, trimmed]);
    }
    setCustomCategory('');
  };

  const handleGenerateCode = () => {
    const prefix = username.replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'KRAFT';
    const suggested = generateUniqueCode(prefix);
    setSellerCode(suggested);
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginSellerCode.trim()) {
      setErrorMsg('Please enter your Unique Seller Code');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const seller = await AuthService.loginSeller(loginSellerCode, loginPassword);
      showToast('success', `Welcome back, ${seller.username}!`, 'Logged into Seller Dashboard');
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setErrorMsg(message);
      showToast('error', 'Authentication Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!username.trim()) {
      setErrorMsg('Please enter your store or artisan username');
      return;
    }
    if (!contactNumber.trim() || contactNumber.trim().length < 7) {
      setErrorMsg('Please provide a valid contact phone number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('City is required');
      return;
    }
    if (!pincode.trim()) {
      setErrorMsg('Pincode is required');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Workshop / pickup address is required');
      return;
    }
    if (!sellerCode.trim()) {
      setErrorMsg('Please choose a Unique Seller Code');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (selectedCategories.length === 0) {
      setErrorMsg('Please select at least one product category');
      return;
    }

    setLoading(true);
    try {
      const seller = await AuthService.registerSeller({
        username,
        contactNumber,
        email,
        city,
        pincode,
        address,
        logo: logoDataUrl,
        sellerCode,
        password,
        categories: selectedCategories,
      });

      showToast('success', 'Seller Account Created!', `Store code: ${seller.sellerCode}`);
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setErrorMsg(message);
      showToast('error', 'Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 py-8 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Top Back Navigation */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-amber-900/70 hover:text-amber-950 transition mb-6 bg-white/70 hover:bg-white px-3.5 py-1.5 rounded-full shadow-sm border border-amber-200/60"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Role Selection
        </button>

        {/* Card Box */}
        <div className="bg-white rounded-3xl shadow-xl shadow-amber-950/5 border border-amber-100 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 sm:p-8 text-white relative">
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-100 border border-white/20">
              Seller Portal
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <Store className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Product Seller</h2>
                <p className="text-amber-100 text-sm">Sell homemade crafts, foods & artisan goods</p>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 mt-6 p-1 bg-black/15 backdrop-blur-md rounded-xl max-w-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition ${
                  mode === 'login'
                    ? 'bg-white text-amber-900 shadow-sm'
                    : 'text-amber-100 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition ${
                  mode === 'register'
                    ? 'bg-white text-amber-900 shadow-sm'
                    : 'text-amber-100 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-6 sm:p-8">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    Unique Seller Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      value={loginSellerCode}
                      onChange={(e) => setLoginSellerCode(e.target.value.toUpperCase())}
                      placeholder="e.g. KRAFT-4821 or ANITA-COOKS"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition font-mono uppercase font-medium text-stone-800"
                      required
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5">
                    Enter the unique alphanumeric seller code you created during registration.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-11 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-stone-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold shadow-lg shadow-amber-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Signing in...</span>
                  ) : (
                    <>
                      <span>Login to Seller Dashboard</span>
                    </>
                  )}
                </button>

                <div className="pt-4 text-center border-t border-stone-100">
                  <p className="text-sm text-stone-600">
                    Don&apos;t have a seller account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg(null);
                      }}
                      className="text-amber-700 font-semibold hover:underline"
                    >
                      Create Seller Account
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                {/* Section: Basic Brand Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-600" />
                    Store Identity & Contact
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                        Username / Store Name *
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. Radhika's Organic Bakes"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                        Contact Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type="tel"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-sm"
                          required
                        />
                      </div>
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
                        placeholder="yourname@gmail.com"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Location */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    Workshop Location & Pickup Address
                  </h3>

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
                          placeholder="e.g. Bangalore"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-sm"
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
                          placeholder="e.g. 560034"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                      Full Address *
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Flat/House No, Street, Landmark, Area for pickup or local dispatch"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Section: Logo Upload */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-600" />
                    Seller Logo
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 flex items-center justify-center overflow-hidden shrink-0">
                      {logoDataUrl ? (
                        <img
                          src={logoDataUrl}
                          alt="Store Logo Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-8 h-8 text-amber-300" />
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold transition">
                        <Upload className="w-4 h-4" />
                        Choose Logo Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-stone-500 mt-1.5">
                        JPG, PNG or SVG (max 2MB). If left blank, a default store badge will be used.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section: Unique Seller Code & Password */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    Login Credentials
                  </h3>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                        Unique Seller Code * (Used for Seller Login)
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Auto-generate code
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        value={sellerCode}
                        onChange={(e) => setSellerCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                        placeholder="e.g. PRIYA-CRAFT, HC-BAKER8"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition font-mono uppercase font-semibold text-stone-800 text-sm"
                        required
                      />
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      This unique code will be your primary login credential.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Product Categories (Multiple Selection) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-600" />
                      Product Categories * (Select Multiple)
                    </h3>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      {selectedCategories.length} selected
                    </span>
                  </div>

                  <p className="text-xs text-stone-500">
                    Choose the craft and homemade categories you will be selling.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {PRESET_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 font-medium ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Category */}
                  <div className="pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Add another category..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs focus:bg-white focus:border-amber-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-black text-white text-xs font-semibold rounded-xl transition"
                      >
                        + Add Tag
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-stone-100 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold shadow-lg shadow-amber-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating account...</span>
                    ) : (
                      <span>Complete Registration & Open Store</span>
                    )}
                  </button>

                  <p className="text-center text-sm text-stone-600">
                    Already have a seller code?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg(null);
                      }}
                      className="text-amber-700 font-semibold hover:underline"
                    >
                      Log in here
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
