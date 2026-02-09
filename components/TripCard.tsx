import React from 'react';
import { Trip } from '../types';
import { Plane, Star, ShieldCheck, ArrowRight, Package, Calendar } from 'lucide-react';
import { useStore } from '../store';

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
  onProfileClick?: (uid: string) => void; 
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onPress, onProfileClick }) => {
  const { preferences } = useStore();
  const isImperial = preferences.unitSystem === 'IMPERIAL';
  
  const displayWeight = isImperial 
    ? Math.round(trip.available_weight_kg * 2.20462) 
    : trip.available_weight_kg;

  const displayPrice = isImperial
    ? Math.round(trip.price_per_kg / 2.20462)
    : trip.price_per_kg;

  const unitLabel = isImperial ? 'lbs' : 'kg';

  return (
    <div 
      onClick={onPress}
      className="bg-white dark:bg-zinc-900 rounded-3xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-zinc-800 active:scale-[0.98] transition-transform duration-200"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div 
            className="flex items-center gap-3 active:opacity-70 transition-opacity"
            onClick={(e) => {
                if (onProfileClick) {
                    e.stopPropagation(); // Stop propagation so we don't open the trip details
                    onProfileClick(trip.traveler_uid);
                }
            }}
        >
          <div className="relative">
            <img 
              src={trip.traveler_photo} 
              alt={trip.traveler_name} 
              className="w-12 h-12 rounded-full border-2 border-white dark:border-zinc-800 shadow-md object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 border-white dark:border-zinc-800">
               <ShieldCheck className="w-3 h-3" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-moover-dark dark:text-white text-base">{trip.traveler_name}</h3>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">4.9</span>
              <span className="text-xs text-gray-400">• 12 trips</span>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-xl">
          <span className="text-green-700 dark:text-green-400 font-extrabold text-sm">${displayPrice}</span>
          <span className="text-green-600 dark:text-green-500 text-xs font-medium">/{unitLabel}</span>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">From</div>
            <div className="font-bold text-moover-dark dark:text-white text-lg leading-tight">{trip.origin_city.split(',')[0]}</div>
            <div className="text-xs text-gray-500 mt-1">{trip.outbound_date}</div>
        </div>

        <div className="px-4 flex flex-col items-center">
            <div className="w-16 h-px bg-gray-200 dark:bg-zinc-700 relative">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 p-1">
                    <Plane className="w-3 h-3 text-gray-400 rotate-90" />
                </div>
            </div>
        </div>

        <div className="flex-1 text-right">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">To</div>
            <div className="font-bold text-moover-dark dark:text-white text-lg leading-tight">{trip.destination_city.split(',')[0]}</div>
            <div className="text-xs text-gray-500 mt-1">--</div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex gap-2 pt-3 border-t border-gray-50 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
            <Package className="w-3.5 h-3.5 text-moover-blue" />
            <span className="text-xs font-bold text-moover-dark dark:text-white">{displayWeight} {unitLabel} left</span>
        </div>
        {trip.latest_handoff_date && (
             <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Drop by {trip.latest_handoff_date}</span>
            </div>
        )}
      </div>
    </div>
  );
};