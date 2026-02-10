import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { 
  ChevronLeft, ChevronRight, ShieldCheck, Lock, CreditCard, 
  Wallet, Globe, Moon, Ruler, Bell, LifeBuoy, FileText, 
  Trash2, Smartphone, Mail, AlertTriangle, Languages, Shield, LogOut 
} from 'lucide-react';
import { HapticsService } from '../services/capacitorService';
import { OnboardingStage } from '../types';

interface SettingsTabProps {
  onClose: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onClose }) => {
  const { preferences, updatePreference, toggleNotification, currentUser, deleteAccount, setUser } = useStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    HapticsService.impact('LIGHT');
  };

  // ADDED: Profile Strength Helper
  const getStageLabel = (stage: number) => {
      switch(stage) {
          case 0: return "Visitor";
          case 1: return "Basic Member";
          case 2: return "Traveler Ready";
          case 3: return "Fully Verified";
          default: return "Unknown";
      }
  };

  const completion = currentUser ? currentUser.profile_completion_score : 0;
  const stage = currentUser ? currentUser.onboarding_stage : 0;

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-6 pb-2 mt-8 mb-2">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
    </div>
  );

  const ListItem = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick, 
    destructive = false,
    rightElement 
  }: { 
    icon: any, 
    label: string, 
    value?: string, 
    onClick?: () => void, 
    destructive?: boolean,
    rightElement?: React.ReactNode
  }) => (
    <div 
      onClick={() => {
        if (onClick) {
            HapticsService.impact('LIGHT');
            onClick();
        }
      }}
      className="bg-white px-6 py-4 flex items-center justify-between active:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl ${destructive ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`font-semibold text-sm ${destructive ? 'text-red-500' : 'text-moover-dark'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-sm text-gray-400 font-medium">{value}</span>}
        {rightElement || <ChevronRight className="w-4 h-4 text-gray-300" />}
      </div>
    </div>
  );

  const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        HapticsService.impact('MEDIUM');
        onToggle();
      }}
      className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer ${active ? 'bg-moover-blue' : 'bg-gray-200'}`}
    >
      <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="bg-white px-6 pt-safe-top pb-4 shadow-sm z-10 flex items-center gap-4">
        <button 
            onClick={onClose}
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
            <ChevronLeft className="w-6 h-6 text-moover-dark" />
        </button>
        <h1 className="text-xl font-bold text-moover-dark">{t('settings_title')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-safe-bottom">
        
        {/* ADDED: PROFILE STRENGTH METER */}
        {currentUser && (
            <div className="m-6 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <img 
                        src={currentUser.photo_url} 
                        className="w-12 h-12 rounded-full object-cover" 
                    />
                    <div>
                        <div className="font-bold text-moover-dark dark:text-white">{currentUser.display_name}</div>
                        <div className="flex items-center gap-1 text-xs text-moover-blue font-bold">
                            <Shield className="w-3 h-3" /> {getStageLabel(stage)}
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Profile Strength</span>
                    <span className="text-sm font-bold text-moover-blue">{completion}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                    <div 
                        className="h-full bg-gradient-to-r from-moover-blue to-purple-500 transition-all duration-1000" 
                        style={{ width: `${completion}%` }} 
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {stage < 3 && (
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-xl shrink-0 border border-gray-100 dark:border-zinc-700">
                            <div className="p-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full text-gray-500">
                                <CreditCard className="w-3 h-3" />
                            </div>
                            <div className="text-xs font-bold text-gray-600 dark:text-gray-300">Add Payment</div>
                            <span className="text-[10px] text-green-500 font-bold">+20%</span>
                        </div>
                    )}
                    {stage < 4 && (
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-xl shrink-0 border border-gray-100 dark:border-zinc-700">
                            <div className="p-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full text-gray-500">
                                <Smartphone className="w-3 h-3" />
                            </div>
                            <div className="text-xs font-bold text-gray-600 dark:text-gray-300">Verify Phone</div>
                            <span className="text-[10px] text-green-500 font-bold">+15%</span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* SECTION 1: ACCOUNT & SECURITY */}
        <SectionHeader title={t('account_security')} />
        <div className="bg-white border-y border-gray-100">
            <ListItem 
                icon={ShieldCheck} 
                label={t('identity_verification')} 
                value={currentUser?.is_id_verified ? "Verified" : "Pending"}
                rightElement={
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${currentUser?.is_id_verified ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {currentUser?.is_id_verified ? 'VERIFIED' : 'PENDING'}
                    </span>
                }
            />
            <ListItem icon={Lock} label={t('login_security')} />
        </div>

        {/* SECTION 2: FINANCIALS */}
        <SectionHeader title={t('financials')} />
        <div className="bg-white border-y border-gray-100">
            <ListItem icon={CreditCard} label={t('payment_methods')} value="Visa •••• 4242" />
            <ListItem icon={Wallet} label={t('payout_settings')} />
            <ListItem 
                icon={Globe} 
                label={t('currency')} 
                rightElement={
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        {['USD', 'HNL', 'EUR'].map(curr => (
                            <button
                                key={curr}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updatePreference('currency', curr as any);
                                    HapticsService.impact('LIGHT');
                                }}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${preferences.currency === curr ? 'bg-white text-moover-dark shadow-sm' : 'text-gray-400'}`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>
                }
            />
        </div>

        {/* SECTION 3: APP PREFERENCES */}
        <SectionHeader title={t('app_preferences')} />
        <div className="bg-white border-y border-gray-100">
             <ListItem 
                icon={Languages} 
                label={t('language_label')}
                rightElement={
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); changeLanguage('en'); }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${i18n.language.startsWith('en') ? 'bg-white text-moover-dark shadow-sm' : 'text-gray-400'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); changeLanguage('es'); }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${i18n.language.startsWith('es') ? 'bg-white text-moover-dark shadow-sm' : 'text-gray-400'}`}
                        >
                            ES
                        </button>
                    </div>
                }
            />
             <ListItem 
                icon={Moon} 
                label={t('appearance_label')} 
                value={preferences.theme.charAt(0).toUpperCase() + preferences.theme.slice(1).toLowerCase()}
                onClick={() => {
                    const next = preferences.theme === 'SYSTEM' ? 'LIGHT' : preferences.theme === 'LIGHT' ? 'DARK' : 'SYSTEM';
                    updatePreference('theme', next);
                }}
            />
            <ListItem 
                icon={Ruler} 
                label={t('units_label')} 
                rightElement={
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${preferences.unitSystem === 'METRIC' ? 'text-moover-blue' : 'text-gray-400'}`}>KG</span>
                        <Toggle 
                            active={preferences.unitSystem === 'IMPERIAL'} 
                            onToggle={() => updatePreference('unitSystem', preferences.unitSystem === 'METRIC' ? 'IMPERIAL' : 'METRIC')}
                        />
                        <span className={`text-xs font-bold ${preferences.unitSystem === 'IMPERIAL' ? 'text-moover-blue' : 'text-gray-400'}`}>LBS</span>
                    </div>
                }
            />
        </div>

        {/* SUBSECTION: NOTIFICATIONS */}
        <div className="px-6 pb-2 mt-6 mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-3 h-3" /> {t('notifications')}
            </h3>
        </div>
        <div className="bg-white border-y border-gray-100">
            <div className="px-6 py-3 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">{t('push_matches')}</span>
                </div>
                <Toggle active={preferences.notifications.push_matches} onToggle={() => toggleNotification('push_matches')} />
            </div>
            <div className="px-6 py-3 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">{t('push_chat')}</span>
                </div>
                <Toggle active={preferences.notifications.push_chat} onToggle={() => toggleNotification('push_chat')} />
            </div>
            <div className="px-6 py-3 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">{t('push_updates')}</span>
                </div>
                <Toggle active={preferences.notifications.push_updates} onToggle={() => toggleNotification('push_updates')} />
            </div>
             <div className="px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">{t('email_marketing')}</span>
                </div>
                <Toggle active={preferences.notifications.email_marketing} onToggle={() => toggleNotification('email_marketing')} />
            </div>
        </div>

        {/* SECTION 4: LEGAL & DANGER ZONE */}
        <SectionHeader title={t('support_legal')} />
        <div className="bg-white border-y border-gray-100 mb-8">
            <ListItem icon={LifeBuoy} label={t('help_center')} />
            <ListItem icon={FileText} label={t('terms_privacy')} />
        </div>

        {/* MODIFIED: Log Out instead of Delete Account */}
        <div className="px-6 pb-24">
            <button 
                onClick={() => {
                    HapticsService.impact('MEDIUM');
                    setUser(null as any); // Logout
                    onClose();
                }}
                className="w-full bg-white border border-gray-200 py-4 rounded-xl flex items-center justify-center gap-2 text-gray-600 font-bold active:bg-gray-50 transition-colors shadow-sm"
            >
                <LogOut className="w-5 h-5" /> {t('sign_out')}
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};