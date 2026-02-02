import React, { useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchAndBook } from './components/SearchAndBook';
import { UserProfile } from './components/UserProfile';
import { CourierHandoffSheet } from './components/CourierHandoffSheet';
import { PackageTracker } from './components/PackageTracker';
import { Home, User as UserIcon, MessageSquare, Box, Map as MapIcon } from 'lucide-react';
import { useStore } from './store';
import { MessagesTab } from './components/MessagesTab';

// Navigation Component
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <button onClick={() => navigate(to)} className="flex flex-col items-center justify-center w-full">
        <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-moover-blue' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`text-[10px] font-medium ${isActive ? 'text-moover-blue' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 pb-safe-bottom pt-3 px-6 shadow-2xl z-40 flex justify-between items-center h-[88px] transition-colors">
      <NavItem to="/" icon={Home} label={t('nav_home')} />
      <NavItem to="/activity" icon={Box} label={t('nav_activity')} />
      <NavItem to="/track" icon={MapIcon} label={t('nav_track')} />
      <NavItem to="/messages" icon={MessageSquare} label={t('nav_messages')} />
      <NavItem to="/profile" icon={UserIcon} label={t('nav_profile')} />
    </div>
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
  const { preferences } = useStore();

  // THEME ENGINE
  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    // Remove existing
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