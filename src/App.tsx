/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ImageZoomModal } from './components/common/ImageZoomModal';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { ToastContainer } from './components/common/Toast';
import { HomePage } from './components/home/HomePage';
import { BuyerRegister } from './components/auth/BuyerRegister';
import { BuyerLogin } from './components/auth/BuyerLogin';
import { SellerRegister } from './components/auth/SellerRegister';
import { SellerLogin } from './components/auth/SellerLogin';
import { BuyerDashboard } from './components/buyer/BuyerDashboard';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { ProductRequestModal } from './components/buyer/ProductRequestModal';
import { EditRequestModal } from './components/orders/EditRequestModal';
import { ReviewFormModal } from './components/reviews/ReviewFormModal';
import { ClickPoppers } from './components/common/ClickPoppers';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainContent: React.FC = () => {
  const { currentView } = useApp();

  return (
    <main key={currentView} className="flex-1 animate-page-enter">
      {currentView === 'home' && <HomePage />}
      {currentView === 'buyer-register' && <BuyerRegister />}
      {currentView === 'buyer-login' && <BuyerLogin />}
      {currentView === 'seller-register' && <SellerRegister />}
      {currentView === 'seller-login' && <SellerLogin />}
      {currentView === 'buyer-dashboard' && <BuyerDashboard />}
      {currentView === 'seller-dashboard' && <SellerDashboard />}
    </main>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-amber-100 selection:text-amber-900">
          <Header />
          <MainContent />
          <Footer />

          {/* Global Interaction Overlays */}
          <ClickPoppers />
          <ImageZoomModal />
          <ConfirmationModal />
          <ToastContainer />
          <ProductRequestModal />
          <EditRequestModal />
          <ReviewFormModal />
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}
