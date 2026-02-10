import React, { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchAndBook } from './components/SearchAndBook';
import { UserProfile } from './components/UserProfile';
import { CourierHandoffSheet } from './components/CourierHandoffSheet';
import { PackageTracker } from './components/PackageTracker';
import { Home, User as UserIcon, MessageSquare, Box, Map as MapIcon } from 'lucide-react';
import { useStore } from './store';
import { MessagesTab } from './components/MessagesTab';

// ADDED: Auth Modal for Trigger Guard
const AuthModal = ({ onClose }: { onClose: () => void }) => {
    const { loginWithProvider } = useStore();
    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] p-8 relative z-10 animate-slide-up pb-safe-bottom">
                <h2 className="text-2xl font-bold text-center mb-2 text-moover-dark dark:text-white">Welcome to Moover</h2>
                <p className="text-center text-gray-500 mb-8">Sign in to publish trips and send requests.</p>
                
                <button 
                    onClick={() => { loginWithProvider('apple'); onClose(); }}
                    className="w-full py-4 bg-black text-white font-bold rounded-2xl mb-3 flex justify-center items-center gap-2"
                >
                    Sign in with Apple
                </button>
                <button 
                    onClick={() => { loginWithProvider('google'); onClose(); }}
                    className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl flex justify-center items-center gap-2"
                >
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

// Navigation Component
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useStore(); // Access Auth State
  const [showAuth, setShowAuth] = useState(false); // Local State for Nav Auth Guard
  
  const NavItem = ({ to, icon: Icon, label, protectedTab = false }: { to: string, icon: any, label: string, protectedTab?: boolean }) => {
    const isActive = location.pathname === to;
    return (
      <button 
        onClick={() => {
            if (protectedTab && !currentUser) {
                setShowAuth(true); // Trigger Guard
            } else {
                navigate(to);
            }
        }} 
        className="flex flex-col items-center justify-center w-full"
      >
        <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-moover-blue' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`text-[10px] font-medium ${isActive ? 'text-moover-blue' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
      </button>
    );
  };

  return (
    <>
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 pb-safe-bottom pt-3 px-6 shadow-2xl z-40 flex justify-between items-center h-[88px] transition-colors">
        <NavItem to="/" icon={Home} label={t('nav_home')} />
        <NavItem to="/activity" icon={Box} label={t('nav_activity')} protectedTab={true} />
        <NavItem to="/track" icon={MapIcon} label={t('nav_track')} />
        <NavItem to="/messages" icon={MessageSquare} label={t('nav_messages')} protectedTab={true} />
        <NavItem to="/profile" icon={UserIcon} label={t('nav_profile')} />
        </div>
        
        {/* Render Auth Modal from Nav */}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
};

const ActivityPlaceholder = () => {
  const startDemoHandoff = useStore((state) => state.startDemoHandoff);
  const { t } = useTranslation();

  return (
    <div className="p-8 text-center text-gray-500 dark:text-gray-400 pt-20 h-full bg-gray-50 dark:bg-black transition-colors">
        <h2 className="text-xl font-bold text-moover-dark dark:text-white mb-2">{t('activity_title')}</h2>
        <p className="mb-8">{t('no_active_shipments')}</p>
        
        <button 
          onClick={() => startDemoHandoff()}
          className="px-6 py-3 bg-moover-blue/10 text-moover-blue font-bold rounded-xl text-sm hover:bg-moover-blue/20 active:scale-95 transition-all"
        >
          {t('demo_handoff')}
        </button>
    </div>
  );
};

const App: React.FC = () => {
  const { preferences, detectUserLocation } = useStore();

  // 1. Smart Defaults Trigger (Existing)
  useEffect(() => {
      detectUserLocation();
  }, []);

  // 2. GOOGLE MAPS LOADER (NEW & SECURE)
  // This loads the API key from your .env file safely
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    // Safety Check: Ensure script isn't loaded twice
    if (apiKey && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // 3. Theme Engine (Existing)
  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    root.classList.remove('light', 'dark');

    if (preferences.theme === 'SYSTEM') {
        root.classList.add(systemTheme);
    } else {
        root.classList.add(preferences.theme.toLowerCase());
    }
  }, [preferences.theme]);

  return (
    <Router>
      <div className="bg-gray-50 dark:bg-black min-h-screen pb-24 text-moover-dark dark:text-white font-sans select-none transition-colors duration-300">
        <Routes>
          <Route path="/" element={<SearchAndBook />} />
          <Route path="/activity" element={<ActivityPlaceholder />} />
          <Route path="/track" element={<PackageTracker />} />
          <Route path="/messages" element={<MessagesTab />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
        
        {/* Persistent Elements */}
        <BottomNav />
        <CourierHandoffSheet />
      </div>
    </Router>
  );
};

export default App;