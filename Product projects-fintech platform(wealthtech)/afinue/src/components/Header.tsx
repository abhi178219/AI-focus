import { useState } from 'react';
import { Menu, X, User, Bell, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '../App';

interface HeaderProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  activeView: ViewState;
  onSwitchView: (view: ViewState) => void;
}

export default function Header({ isLoggedIn, onLogout, onOpenAuth, activeView, onSwitchView }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLinks = isLoggedIn 
    ? [
        { name: 'Opportunities', id: 'opportunities' as ViewState },
        { name: 'Portfolio', id: 'portfolio' as ViewState },
        { name: 'Refer & Earn', id: 'referral' as ViewState },
        { name: 'Insights', id: 'insights' as ViewState },
      ]
    : [
        { name: 'Overview', href: '#hero' },
        { name: 'Partner with Us', href: '#partner' },
        { name: 'How it Works', href: '#how-it-works' },
        { name: 'Insights', href: '#insights' },
      ];

  const handleNavClick = (id: ViewState) => {
    onSwitchView(id);
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-natural-bg/80 backdrop-blur-md border-b border-natural-border shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => onSwitchView('opportunities')}>
            <span className="text-2xl font-serif font-bold italic tracking-tight text-natural-primary">afinue</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              isLoggedIn ? (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id as ViewState)}
                  className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                    activeView === link.id ? 'text-natural-primary' : 'text-natural-muted hover:text-natural-text'
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-natural-muted hover:text-natural-text transition-colors"
                >
                  {link.name}
                </a>
              )
            ))}

            {!isLoggedIn ? (
              <div className="flex items-center space-x-4 ml-4">
                <button 
                  onClick={() => onOpenAuth('login')}
                  className="text-sm font-medium text-natural-muted hover:text-natural-text"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => onOpenAuth('signup')}
                  className="bg-natural-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-natural-primary/20 hover:bg-natural-primary/90 transition-all"
                >
                  Join Afinue
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 border-l pl-4 border-natural-border">
                <button className="text-natural-muted hover:text-natural-text relative">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-1 p-1 rounded-full hover:bg-natural-surface transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-natural-border border border-natural-border flex items-center justify-center text-natural-primary font-bold text-xs uppercase">
                      JD
                    </div>
                    <ChevronDown size={14} className={`text-natural-muted transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden"
                      >
                        <button 
                          onClick={() => { handleNavClick('profile'); setIsProfileOpen(false); }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User size={16} className="mr-3 text-gray-400" />
                          Profile
                        </button>
                        <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Settings size={16} className="mr-3 text-gray-400" />
                          Settings
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button 
                          onClick={onLogout}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={16} className="mr-3" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-natural-muted hover:text-natural-text p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-natural-bg border-b border-natural-border overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                isLoggedIn ? (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id as ViewState)}
                    className={`block w-full text-left px-3 py-2 text-base font-bold uppercase tracking-widest rounded-lg ${
                      activeView === link.id ? 'text-natural-primary bg-natural-surface' : 'text-natural-muted hover:text-natural-text hover:bg-natural-surface'
                    }`}
                  >
                    {link.name}
                  </button>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block px-3 py-2 text-base font-medium text-natural-muted hover:text-natural-text hover:bg-natural-surface rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                )
              ))}
              {!isLoggedIn ? (
                <div className="mt-4 pt-4 border-t border-natural-border grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { onOpenAuth('login'); setIsMenuOpen(false); }}
                    className="flex justify-center items-center px-4 py-2 border border-natural-border rounded-full text-sm font-bold text-natural-text bg-white hover:bg-natural-surface"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => { onOpenAuth('signup'); setIsMenuOpen(false); }}
                    className="flex justify-center items-center px-4 py-2 border border-transparent rounded-full text-sm font-bold text-white bg-natural-primary hover:bg-natural-primary/90"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-natural-border">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={20} className="mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
