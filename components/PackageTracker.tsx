import React from 'react';
import { useTranslation } from 'react-i18next';
import { Map, Navigation, Shield, Phone, MessageSquare, MapPin } from 'lucide-react';
import { useStore } from '../store';
import { OrderStatus } from '../types';

export const PackageTracker: React.FC = () => {
  const { activeOrder, activeTrips } = useStore();
  const { t } = useTranslation();

  if (!activeOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400 dark:text-gray-500 pt-safe-top bg-white dark:bg-black transition-colors">
        <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
            <Map className="w-8 h-8 text-gray-300 dark:text-gray-600" />
        </div>
        <h2 className="text-xl font-bold text-moover-dark dark:text-white mb-2">{t('no_active_shipment_title')}</h2>
        <p className="max-w-xs mx-auto">{t('no_active_shipment_desc')}</p>
      </div>
    );
  }

  const trip = activeTrips.find(t => t.id === activeOrder.trip_id);
  
  // Logic to determine "Current City" for the display
  // In a real app, this would come from the traveler's live GPS Geohash
  const currentCity = activeOrder.status === OrderStatus.IN_TRANSIT 
    ? trip?.destination_city || "Unknown" // Simulating they are en route
    : trip?.origin_city || "Unknown";

  const isMoving = activeOrder.status === OrderStatus.IN_TRANSIT;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black relative overflow-hidden transition-colors">
      {/* Map Background (Simulated) */}
      <div className="absolute inset-0 z-0 bg-[#e5e9f2] dark:bg-[#1a1a1a] overflow-hidden transition-colors">
         {/* Abstract Map Roads/Pattern */}
         <div className="absolute inset-0 opacity-40 dark:opacity-20" style={{ 
             backgroundImage: 'linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
         }}></div>
         
         {/* Decorative Map Elements */}
         <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>

         {/* Fuzzy Location Indicator (The "City" Circle) */}
         <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            {/* Pulsing Area (Privacy Radius) */}
            <div className="w-48 h-48 bg-moover-blue/10 dark:bg-moover-blue/5 rounded-full flex items-center justify-center animate-pulse border border-moover-blue/20 dark:border-moover-blue/10">
                <div className="w-24 h-24 bg-moover-blue/20 dark:bg-moover-blue/10 rounded-full flex items-center justify-center">
                   <div className="w-4 h-4 bg-moover-blue rounded-full border-[3px] border-white dark:border-black shadow-xl z-10 relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold text-gray-600 dark:text-gray-300 flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t('last_seen_near')}</span>
                        {currentCity.split(',')[0]}
                        <div className="w-2 h-2 bg-white dark:bg-zinc-800 rotate-45 absolute -bottom-1"></div>
                      </div>
                   </div>
                </div>
            </div>
            <div className="mt-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-white/50 dark:border-zinc-700/50">
                {t('approximate_location')}
            </div>
         </div>
      </div>

      {/* Header Overlay */}
      <div className="relative z-10 pt-safe-top px-6 pt-6 pointer-events-none">
        <h1 className="text-3xl font-bold text-moover-dark dark:text-white drop-shadow-sm">{t('tracking_title')}</h1>
        <p className="text-gray-500 font-medium">Order #{activeOrder.id.split('_')[1]}</p>
      </div>

      {/* Bottom Card */}
      <div className="absolute bottom-[100px] left-4 right-4 bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-2xl z-20 animate-slide-up transition-colors">
         {/* Route Progress */}
         <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">
            <span>{trip?.origin_city.split(',')[0]}</span>
            <span>{trip?.destination_city.split(',')[0]}</span>
         </div>
         <div className="relative h-2 bg-gray-100 dark:bg-zinc-800 rounded-full mb-8 overflow-hidden">
            <div 
                className={`absolute left-0 top-0 bottom-0 bg-moover-blue rounded-full transition-all duration-1000 ${isMoving ? 'w-2/3' : 'w-1/6'}`} 
            />
            {/* Animated Stripes if moving */}
            {isMoving && (
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[spin_1s_linear_infinite]" />
            )}
         </div>

         {/* Status Header */}
         <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isMoving ? 'bg-blue-50 dark:bg-blue-900/20 text-moover-blue' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'}`}>
                {isMoving ? <Navigation className="w-6 h-6 rotate-90" /> : <MapPin className="w-6 h-6" />}
            </div>
            <div>
                <h3 className="text-lg font-bold text-moover-dark dark:text-white leading-tight">
                    {activeOrder.status === OrderStatus.IN_TRANSIT ? t('in_transit') : t('preparing')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    {activeOrder.status === OrderStatus.IN_TRANSIT 
                        ? `${t('on_the_way_to')} ${trip?.destination_city.split(',')[0]}`
                        : `${t('currently_in')} ${trip?.origin_city.split(',')[0]}`
                    }
                </p>
            </div>
         </div>

         {/* Traveler Info */}
         <div className="border-t border-gray-100 dark:border-zinc-800 pt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <img src={trip?.traveler_photo || "https://picsum.photos/200"} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-zinc-700" />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white dark:border-zinc-900 w-4 h-4 rounded-full"></div>
                 </div>
                 <div>
                    <div className="font-bold text-sm text-moover-dark dark:text-white">{trip?.traveler_name}</div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1">
                        <Shield className="w-3 h-3 text-moover-blue" /> {t('profile_verified')}
                    </div>
                 </div>
            </div>
            <div className="flex gap-3">
                <button className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform active:bg-gray-200 dark:active:bg-zinc-700">
                    <MessageSquare className="w-5 h-5" />
                </button>
                <button className="w-11 h-11 rounded-2xl bg-moover-blue text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-transform active:shadow-none">
                    <Phone className="w-5 h-5" />
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};