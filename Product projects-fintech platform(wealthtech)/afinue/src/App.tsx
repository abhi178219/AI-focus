import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import WhyInvest from './components/WhyInvest';
import HowItWorks from './components/HowItWorks';
import InvestmentClasses from './components/InvestmentClasses';
import FeaturedDeals from './components/FeaturedDeals';
import Footer from './components/Footer';
import AuthFlow from './components/AuthFlow';
import Dashboard from './components/Dashboard';
import DealDetails from './components/DealDetails';
import { User, Deal } from './types';

export type ViewState = 'opportunities' | 'portfolio' | 'referral' | 'insights' | 'profile' | 'deal-details';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<ViewState>('opportunities');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'login'
  });

  const handleLoginSuccess = (user: User) => {
    setIsLoggedIn(true);
    setCurrentUser({
      ...user,
      address: '123, Silver Oak Apt, Indiranagar, Bangalore - 560038',
      rm: {
        name: 'Vikram Malhotra',
        email: 'vikram@afinue.com',
        phone: '+91 99912 44556',
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a'
      }
    });
    setAuthModal({ ...authModal, isOpen: false });
    setActiveView('opportunities');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveView('opportunities');
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthModal({ isOpen: true, mode });
  };

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-natural-bg font-sans text-natural-text selection:bg-natural-primary selection:text-white">
      <Header 
        isLoggedIn={isLoggedIn} 
        onLogout={handleLogout} 
        onOpenAuth={openAuth} 
        activeView={activeView}
        onSwitchView={setActiveView}
      />

      <main>
        {isLoggedIn && currentUser ? (
          <Dashboard 
            user={currentUser} 
            onUpdateUser={setCurrentUser} 
            activeView={activeView} 
            onSwitchView={setActiveView} 
          />
        ) : (
          <>
            {activeView === 'deal-details' && selectedDeal ? (
              <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <DealDetails 
                  deal={selectedDeal} 
                  onBack={() => setActiveView('opportunities')} 
                  onSimilarDealClick={setSelectedDeal}
                />
              </div>
            ) : (
              <>
                <Hero onGetStarted={() => openAuth('signup')} />
                <FeaturedDeals onViewDeal={(deal) => { setSelectedDeal(deal); setActiveView('deal-details'); }} />
                <WhyInvest />
                <HowItWorks />
                <InvestmentClasses />
              </>
            )}
          </>
        )}
      </main>

      <Footer />

      <AuthFlow 
        isOpen={authModal.isOpen} 
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

