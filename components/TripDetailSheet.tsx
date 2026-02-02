import React, { useState } from 'react';
import { Trip } from '../types';
import { X, ShieldCheck, Star, MessageCircle, Package, ArrowRight, Share2, Heart, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HapticsService } from '../services/capacitorService';
import { OfferWizard } from './OfferWizard'; 
import { DeliveryCoordinationSheet } from './DeliveryCoordinationSheet';

interface TripDetailSheetProps {
  trip: Trip;
  onClose: () => void;
}

export const TripDetailSheet: React.FC<TripDetailSheetProps> = ({ trip, onClose }) => {
  const { t } = useTranslation();
  
  // State for toggling sheets
  const [showOfferWizard, setShowOfferWizard] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);

  // The "Safe" Button Click Handler
  const handleBookPress = () => {
      console.log("Button Clicked: Requesting to Carry...");
      try {
          HapticsService.impact('MEDIUM');
      } catch (e) {
          console.warn("Haptics skipped");
      }
      setShowOfferWizard(true);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop (Click to close) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={onClose} />
      
      {/* Sheet Content */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] relative z-10 animate-slide-up shadow-2xl h-[90vh] flex flex-col overflow-hidden pointer-events-auto transition-colors">
        
        {/* Sticky Header */}
        <div className="px-6 pt-6 pb-4 bg-white dark:bg-zinc-900 z-20 shrink-0">
             <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <img src={trip.traveler_photo} className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-800 shadow-md object-cover" />
                    <div>
                        <h2 className="text-xl font-bold text-moover-dark dark:text-white">{trip.traveler_name}</h2>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                             <ShieldCheck className="w-4 h-4 text-green-500" />
                             <span className="font-medium text-green-600">{t('identity_verified')}</span>
                             <span className="mx-1">•</span>
                             <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                             <span className="text-moover-dark dark:text-white font-bold">4.9</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                        <Heart className="w-5 h-5 text-moover-dark dark:text-white" />
                    </button>
                    <button className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                        <Share2 className="w-5 h-5 text-moover-dark dark:text-white" />
                    </button>
                    <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ml-2">
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
             </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
            
            {/* Route Map Visual */}
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-3xl p-6 mb-6 border border-gray-100 dark:border-zinc-700 relative overflow-hidden">
                 <div className="flex justify-between items-center relative z-10">
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t('from')}</div>
                        <div className="text-xl font-bold text-moover-dark dark:text-white">{trip.origin_city.split(',')[0]}</div>
                        <div className="text-sm text-gray-500 mt-1">{trip.outbound_date}</div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center px-4 opacity-50">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 mt-1">ONE-WAY</span>
                    </div>

                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t('to')}</div>
                        <div className="text-xl font-bold text-moover-dark dark:text-white">{trip.destination_city.split(',')[0]}</div>
                        <div className="text-sm text-gray-500 mt-1">--</div>
                    </div>
                 </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-moover-blue" />
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase">{t('capacity')}</span>
                    </div>
                    <div className="text-2xl font-bold text-moover-dark dark:text-white">{trip.available_weight_kg} <span className="text-sm font-medium text-gray-500">kg</span></div>
                    <div className="text-xs text-gray-500 mt-1">Open to boxes & luggage</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="font-bold text-green-600 text-lg">$</div>
                        <span className="text-xs font-bold text-green-600 dark:text-green-300 uppercase">{t('price')}</span>
                    </div>
                    <div className="text-2xl font-bold text-moover-dark dark:text-white">${trip.price_per_kg} <span className="text-sm font-medium text-gray-500">/kg</span></div>
                    <div className="text-xs text-gray-500 mt-1">~${Math.round(trip.price_per_kg * 2.2)} /lb</div>
                </div>
            </div>

            {/* About Section */}
            <div className="mb-6">
                <h3 className="font-bold text-moover-dark dark:text-white mb-3">About this trip</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Heading back home for the holidays! I have plenty of space in my checked luggage. Happy to transport electronics, clothes, or documents. Can pick up in Manhattan area.
                </p>
            </div>

             {/* Safety Warning */}
             <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl flex gap-3 border border-yellow-100 dark:border-yellow-900/30">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                <div className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                    <strong>Moover Guarantee:</strong> Your payment is held in escrow until you confirm delivery. Never pay outside the app.
                </div>
             </div>
        </div>

        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 z-30 pb-safe-bottom">
            <div className="flex gap-3">
                {/* Chat Button */}
                <button className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 text-moover-dark dark:text-white font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Chat
                </button>
                
                {/* TEMP: Test Delivery Flow */}
                <button 
                    onClick={() => setShowDelivery(true)}
                    className="px-4 py-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold rounded-2xl active:scale-95 transition-transform"
                >
                    Test Delivery
                </button>

                <button 
                    onClick={handleBookPress}
                    className="flex-[2] py-4 bg-moover-dark dark:bg-white text-white dark:text-moover-dark font-bold rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    Request to Carry
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>

    {/* RENDER WIZARD IF ACTIVE */}
    {/* FORCE Z-INDEX 100 TO MAKE VISIBLE */}
    {showOfferWizard && (
        <div className="relative z-[100]">
            <OfferWizard trip={trip} onClose={() => setShowOfferWizard(false)} />
        </div>
    )}

    {showDelivery && (
        <div className="relative z-[100]">
            <DeliveryCoordinationSheet tripId={trip.id} onClose={() => setShowDelivery(false)} />
        </div>
    )}
    </>
  );
};