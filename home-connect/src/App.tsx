import React, { lazy, Suspense, useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/common/Toast.tsx';
import { StartScreen } from './components/StartScreen.tsx';
import { AuthService, initFirebaseSync } from './services/storage.ts';
import { preloadFirebaseAuth } from './firebase.ts';
import { BuyerProfile, SellerProfile } from './types/index.ts';

const SellerAuth = lazy(() => import('./components/auth/SellerAuth.tsx').then((module) => ({ default: module.SellerAuth })));
const BuyerAuth = lazy(() => import('./components/auth/BuyerAuth.tsx').then((module) => ({ default: module.BuyerAuth })));
const SellerDashboard = lazy(() => import('./components/seller/SellerDashboard.tsx').then((module) => ({ default: module.SellerDashboard })));
const BuyerDashboard = lazy(() => import('./components/buyer/BuyerDashboard.tsx').then((module) => ({ default: module.BuyerDashboard })));

function ScreenLoading() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-stone-500">Loading HomeCraft Connect...</p>
      </div>
    </div>
  );
}

type ScreenState =
  | { view: 'start' }
  | { view: 'seller_auth'; mode: 'login' | 'register' }
  | { view: 'buyer_auth'; mode: 'login' | 'register' }
  | { view: 'seller_dashboard'; seller: SellerProfile }
  | { view: 'buyer_dashboard'; buyer: BuyerProfile };

function MainContent() {
  const { showToast } = useToast();
  const [screen, setScreen] = useState<ScreenState>({ view: 'start' });

  useEffect(() => {
    const handleCloudError = (event: Event) => {
      const { source, message } = (event as CustomEvent<{ source: string; message: string }>).detail;
      showToast('error', 'Firebase Sync Failed', `${source}: ${message}. Changes remain saved on this device.`);
    };

    window.addEventListener('homecraft_cloud_error', handleCloudError);
    return () => window.removeEventListener('homecraft_cloud_error', handleCloudError);
  }, [showToast]);

  // Check existing session and start Firebase synchronization
  useEffect(() => {
    let cancelled = false;

    try {
      const restoreSession = async () => {
        try {
          const currentUser = await AuthService.restoreCurrentUser();
          if (cancelled) return;
          initFirebaseSync();
          if (currentUser?.role === 'seller') {
            setScreen({ view: 'seller_dashboard', seller: currentUser.profile });
          } else if (currentUser?.role === 'buyer') {
            setScreen({ view: 'buyer_dashboard', buyer: currentUser.profile });
          }
        } catch (err) {
          console.error('Session load error:', err);
        }
      };

      void restoreSession();
    } catch (err) {
      console.error('Session load error:', err);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectRole = (role: 'seller' | 'buyer', mode: 'login' | 'register') => {
    preloadFirebaseAuth();
    if (role === 'seller') {
      setScreen({ view: 'seller_auth', mode });
    } else {
      setScreen({ view: 'buyer_auth', mode });
    }
  };

  const handleAuthSuccess = () => {
    initFirebaseSync();
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      if (currentUser.role === 'seller') {
        setScreen({ view: 'seller_dashboard', seller: currentUser.profile });
      } else if (currentUser.role === 'buyer') {
        setScreen({ view: 'buyer_dashboard', buyer: currentUser.profile });
      }
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setScreen({ view: 'start' });
    showToast('info', 'Logged Out', 'You have been successfully logged out.');
  };

  // 1. Start Screen
  if (screen.view === 'start') {
    return <StartScreen onSelectRole={handleSelectRole} />;
  }

  // 2. Seller Auth
  if (screen.view === 'seller_auth') {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <SellerAuth
          initialMode={screen.mode}
          onBack={() => setScreen({ view: 'start' })}
          onSuccess={handleAuthSuccess}
        />
      </Suspense>
    );
  }

  // 3. Buyer Auth
  if (screen.view === 'buyer_auth') {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <BuyerAuth
          initialMode={screen.mode}
          onBack={() => setScreen({ view: 'start' })}
          onSuccess={handleAuthSuccess}
        />
      </Suspense>
    );
  }

  // 4. Seller Dashboard
  if (screen.view === 'seller_dashboard') {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <SellerDashboard
          seller={screen.seller}
          onLogout={handleLogout}
          onProfileUpdated={(updated) => {
            setScreen({ view: 'seller_dashboard', seller: updated });
          }}
        />
      </Suspense>
    );
  }

  // 5. Buyer Dashboard
  if (screen.view === 'buyer_dashboard') {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <BuyerDashboard
          buyer={screen.buyer}
          onLogout={handleLogout}
          onProfileUpdated={(updated) => {
            setScreen({ view: 'buyer_dashboard', buyer: updated });
          }}
        />
      </Suspense>
    );
  }

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <MainContent />
    </ToastProvider>
  );
}
