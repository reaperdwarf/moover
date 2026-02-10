import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { UserRole } from '../types';
import { ShieldCheck, Star, Package, RefreshCw, LogOut, AlertTriangle, Settings, UserPlus, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { HapticsService } from '../services/capacitorService';
import { SettingsTab } from './SettingsTab';

export const UserProfile: React.FC = () => {
  const { currentUser, currentRole, toggleRole, createProfile, setUser, loginWithProvider } = useStore();
  const [newName, setNewName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation();

  // Handle Create Profile State
  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-zinc-900 min-h-full flex flex-col p-6 pt-safe-top pb-24 animate-fade-in transition-colors">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
           <div className="w-20 h-20 bg-moover-blue rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20">
               <UserPlus className="w-10 h-10 text-white" />
           </div>
           
           <h1 className="text-3xl font-bold text-moover-dark dark:text-white mb-3">{t('create_profile')}</h1>
           <p className="text-gray-500 mb-10 leading-relaxed">
             {t('create_profile_desc')}
           </p>

           {/* ADDED: Social Login Buttons */}
           <div className="space-y-3 mb-8">
               <button 
                   onClick={() => loginWithProvider('apple')}
                   className="w-full py-4 bg-black text-white font-bold rounded-2xl flex justify-center items-center gap-2 active:scale-95 transition-transform"
               >
                   Sign in with Apple
               </button>
               <button 
                   onClick={() => loginWithProvider('google')}
                   className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl flex justify-center items-center gap-2 active:scale-95 transition-transform"
               >
                   Sign in with Google
               </button>
               
               <div className="relative py-4">
                   <div className="absolute inset-0 flex items-center">
                       <div className="w-full border-t border-gray-200 dark:border-zinc-700"></div>
                   </div>
                   <div className="relative flex justify-center text-sm">
                       <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500">Or continue with email</span>
                   </div>
               </div>
           </div>

           <div className="space-y-5">
              <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('full_name')}</label>
                  <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-gray-50 dark:bg-zinc-800 p-5 rounded-2xl font-bold text-moover-dark dark:text-white outline-none focus:ring-2 focus:ring-moover-blue transition-all border border-gray-100 dark:border-zinc-700 placeholder:text-gray-300 dark:placeholder:text-zinc-600"
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('email_address')}</label>
                  <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full bg-gray-50 dark:bg-zinc-800 p-5 rounded-2xl font-bold text-moover-dark dark:text-white outline-none focus:ring-2 focus:ring-moover-blue transition-all border border-gray-100 dark:border-zinc-700 placeholder:text-gray-300 dark:placeholder:text-zinc-600"
                  />
              </div>
           </div>

           <Button
              fullWidth
              className="mt-10"
              onClick={() => {
                  if(newName.trim()) {
                      createProfile(newName);
                      HapticsService.notification('SUCCESS');
                  }
              }}
              disabled={!newName.trim()}
           >
              {t('create_account')} <ChevronRight className="w-5 h-5 ml-2" />
           </Button>

           <div className="mt-8 text-center">
             <span className="text-gray-400 text-sm font-medium">{t('already_have_account')} </span>
             {/* ADDED: Click handler for Sign In */}
             <button 
                onClick={() => loginWithProvider('google')}
                className="text-moover-blue font-bold text-sm"
             >
                {t('sign_in')}
             </button>
           </div>
        </div>
      </div>
    );
  }

  const isSender = currentRole === UserRole.SENDER;

  return (
    <div className="bg-gray-50 dark:bg-black min-h-full pb-24 animate-fade-in relative transition-colors">
      {/* Settings Overlay */}
      {showSettings && <SettingsTab onClose={() => setShowSettings(false)} />}
      
      {/* Header Image Area */}
      <div className="bg-white dark:bg-zinc-900 p-6 pt-safe-top pb-8 rounded-b-[2.5rem] shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Package className="w-64 h-64 text-black dark:text-white" />
        </div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-2xl font-bold text-moover-dark dark:text-white">{t('nav_profile')}</h1>
                <button 
                    onClick={() => {
                        HapticsService.impact('LIGHT');
                        setShowSettings(true);
                    }}
                    className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                >
                    <Settings className="w-6 h-6 text-gray-400" />
                </button>
            </div>

            <div className="flex items-center gap-5">
                <div className="relative">
                    <img 
                        src={currentUser.photo_url} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-lg"
                    />
                    {currentUser.is_id_verified && (
                        <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full border-2 border-white dark:border-zinc-800">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-moover-dark dark:text-white">{currentUser.display_name}</h2>
                    <p className="text-sm text-gray-500">{t('profile_member_since')} {new Date(currentUser.created_at).getFullYear()}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                            {currentUser.is_id_verified ? t('profile_verified') : t('profile_unverified')}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Role Switcher */}
            <div className="mt-8 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl flex">
                <button 
                    onClick={() => {
                        if (currentRole !== UserRole.SENDER) {
                            toggleRole();
                            HapticsService.impact('LIGHT');
                        }
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isSender ? 'bg-white dark:bg-zinc-700 text-moover-dark dark:text-white shadow-sm' : 'text-gray-500'}`}
                >
                    {t('role_sender')}
                </button>
                <button 
                    onClick={() => {
                         if (currentRole !== UserRole.TRAVELER) {
                            toggleRole();
                            HapticsService.impact('LIGHT');
                        }
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isSender ? 'bg-moover-blue text-white shadow-sm' : 'text-gray-500'}`}
                >
                    {t('role_traveler')}
                </button>
            </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="p-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            {isSender ? t('role_sender') : t('role_traveler')}
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
            {isSender ? (
                <>
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
                        <Package className="w-6 h-6 text-purple-500 mb-2" />
                        <div className="text-2xl font-bold text-moover-dark dark:text-white">{currentUser.sender_stats.items_sent}</div>
                        <div className="text-xs text-gray-400">{t('stats_items_sent')}</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
                        <Star className="w-6 h-6 text-yellow-500 mb-2" />
                        <div className="text-2xl font-bold text-moover-dark dark:text-white">{currentUser.sender_stats.endorsements.length}</div>
                        <div className="text-xs text-gray-400">{t('stats_endorsements')}</div>
                    </div>
                </>
            ) : (
                <>
                     <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
                        <Star className="w-6 h-6 text-yellow-500 mb-2" />
                        <div className="text-2xl font-bold text-moover-dark dark:text-white">{currentUser.traveler_stats.rating}</div>
                        <div className="text-xs text-gray-400">{t('stats_rating')}</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
                        <RefreshCw className="w-6 h-6 text-blue-500 mb-2" />
                        <div className="text-2xl font-bold text-moover-dark dark:text-white">{currentUser.traveler_stats.total_trips}</div>
                        <div className="text-xs text-gray-400">{t('stats_trips')}</div>
                    </div>
                     <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm col-span-2 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                             <div className="text-sm font-bold text-moover-dark dark:text-white">{t('stats_ontime')}</div>
                             <div className="text-green-600 font-bold">{currentUser.traveler_stats.on_time_percentage}%</div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${currentUser.traveler_stats.on_time_percentage}%` }}></div>
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Safety & Actions */}
      <div className="px-6 space-y-4">
        <Button 
            variant="outline" 
            fullWidth 
            className="gap-2 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
            onClick={() => setUser(null as any)}
        >
             <LogOut className="w-4 h-4" /> {t('sign_out')}
        </Button>
        <button className="w-full py-4 text-xs font-bold text-red-500 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
            <AlertTriangle className="w-4 h-4" /> {t('report_block')}
        </button>
      </div>
    </div>
  );
};