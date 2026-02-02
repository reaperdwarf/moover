import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trip } from '../types';
import { Plane, ArrowRight, Package, Calendar } from 'lucide-react';
import { useStore } from '../store';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onPress }) => {
  const { t } = useTranslation();
  const { preferences } = useStore(); // Connect to the store

  // --- UNIT CONVERSION LOGIC ---
  const isImperial = preferences.unitSystem === 'IMPERIAL';

  // 1. Convert Weight
  const displayWeight = isImperial 
    ? Math.round(trip.available_weight_kg * 2.20462) 
    : trip.available_weight_kg;
  
  // 2. Convert Price (e.g. $22/kg -> $10/lb)
  const displayPrice = isImperial
    ? Math.round(trip.price_per_kg / 2.20462)
    : trip.price_per_kg;

  const unitLabel = isImperial ? 'lbs' : 'kg';
  // ----------------------------

  return (
    <div 
      onClick={onPress}
      className="bg-white dark:bg-zinc-900 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-zinc-800 active:bg-gray-50 dark:active:bg-zinc-800 transition-colors"
    >
      {/* Header: Traveler Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={trip.traveler_photo} alt={trip.traveler_name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-zinc-700" />
          <div>
            <h4 className="font-semibold text-sm text-moover-dark dark:text-white">{trip.traveler_name}</h4>
            <div className="flex items-center gap-1">
               <span className="text-xs text-green-600 font-medium flex items-center">
                 ★ 4.9
               </span>
               <span className="text-xs text-gray-400">• {t('verified')}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-moover-blue font-bold text-lg">
            ${displayPrice}
            <span className="text-xs text-gray-400 font-normal">/{unitLabel}</span>
          </span>
        </div>
      </div>

      {/* Route Visualization */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('from')}</span>
          <span className="text-xl font-bold text-moover-dark dark:text-white">{trip.origin_city.split(',')[0]}</span>
          <span className="text-xs text-gray-400">{trip.outbound_date}</span>
        </div>

        <div className="flex-1 flex justify-center items-center px-4">
          <div className="h-[2px] w-full bg-gray-200 dark:bg-zinc-700 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 p-1">
              <Plane className="w-4 h-4 text-gray-400 rotate-90" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('to')}</span>
          <span className="text-xl font-bold text-moover-dark dark:text-white text-right">{trip.destination_city.split(',')[0]}</span>
          <span className="text-xs text-gray-400">
             {trip.return_date ? trip.return_date : t('one_way')}
          </span>
        </div>
      </div>

      {/* Footer Tags */}
      <div className="flex items-center gap-2 mt-2">
        <div className="bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <Package className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
             {displayWeight} {unitLabel} available
          </span>
        </div>
        {trip.is_round_trip && (
          <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Calendar className="w-3 h-3 text-moover-blue" />
            <span className="text-xs font-medium text-moover-blue">{t('round_trip')}</span>
          </div>
        )}
      </div>
    </div>
  );
};