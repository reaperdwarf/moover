import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Plane, Building2, X, Briefcase, Minus, Plus, Scale, ArrowUpDown, CalendarDays } from 'lucide-react';
import { TripCard } from './TripCard';
import { TripDetailSheet } from './TripDetailSheet';
import { PostTripWizard } from './PostTripWizard';
import { useStore } from '../store';
import { HapticsService } from '../services/capacitorService';
import { Trip } from '../types';

type LocationType = 'AIRPORT' | 'CITY';

interface LocationItem {
  id: string;
  name: string;
  subText: string;
  type: LocationType;
  keywords: string[]; 
}

export const SearchAndBook: React.FC = () => {
  const { activeTrips } = useStore(); 
  const { t } = useTranslation();
  
  // Form State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  
  // Autocomplete State
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);

  // Google Service Ref
  const autocompleteService = useRef<any>(null);

  // Initialize Google Maps Service (Try 1: On Load)
  useEffect(() => {
    // @ts-ignore - Check if Google Maps is loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      // @ts-ignore
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  // NEW: Lazy Load the Service (Try 2: On Type)
  const fetchPredictions = (input: string) => {
    // 1. If service is missing, try to initialize it now
    if (!autocompleteService.current) {
        // @ts-ignore
        if (window.google && window.google.maps && window.google.maps.places) {
            // @ts-ignore
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
        } else {
            console.error("Google Maps Script is NOT loaded yet!");
            return;
        }
    }

    if (!input) {
      setSuggestions([]);
      return;
    }

    const request = {
      input: input,
      types: ['(cities)'], 
    };

    autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
      // @ts-ignore
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
        setSuggestions([]);
        return;
      }

      // Map Google's data format to our app's format
      const formattedSuggestions: LocationItem[] = predictions.map((prediction: any) => {
        const isAirport = prediction.types.includes('airport');
        return {
          id: prediction.place_id,
          name: prediction.structured_formatting.main_text,
          subText: prediction.structured_formatting.secondary_text,
          type: isAirport ? 'AIRPORT' : 'CITY',
          keywords: [] 
        };
      });

      setSuggestions(formattedSuggestions);
    });
  };

  const handleInput = (value: string, field: 'origin' | 'destination') => {
    if (field === 'origin') setOrigin(value);
    else setDestination(value);
    
    setActiveField(field);
    fetchPredictions(value);
  };

  const selectSuggestion = (item: LocationItem) => {
    if (activeField === 'origin') setOrigin(item.name);
    else setDestination(item.name);
    
    setActiveField(null);
    setSuggestions([]);
  };

  // --- EXISTING STATE & LOGIC ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTripSheet, setShowTripSheet] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'recommended', 
    minCapacity: 0,
    maxPrice: 100, 
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleApplyFilters = () => {
      HapticsService.impact('MEDIUM');
      setShowFilterSheet(false);
  };

  const filteredTrips = activeTrips.filter(trip => {
    if (searchQuery) {
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(t => t.length > 0);
        const tripString = `${trip.origin_city} ${trip.destination_city} ${trip.traveler_name} ${trip.outbound_date} ${trip.return_date || ''}`.toLowerCase();
        if (!searchTerms.every(term => tripString.includes(term))) return false;
    }
    if (trip.available_weight_kg < filters.minCapacity) return false;
    if (trip.price_per_kg > filters.maxPrice) return false;

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
        case 'price_asc': return a.price_per_kg - b.price_per_kg;
        case 'price_desc': return b.price_per_kg - a.price_per_kg;
        case 'capacity_desc': return b.available_weight_kg - a.available_weight_kg;
        case 'capacity_asc': return a.available_weight_kg - b.available_weight_kg;
        case 'date_asc': return new Date(a.outbound_date).getTime() - new Date(b.outbound_date).getTime();
        default: return 0;
    }
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors">
      {/* Header / Search Input Area */}
      <div className="bg-white dark:bg-zinc-900 p-5 pb-6 rounded-b-3xl shadow-sm z-20 sticky top-0 relative transition-colors">
        <h1 className="text-2xl font-bold mb-4 text-moover-dark dark:text-white">{t('search_title')}</h1>
        
        <div className="space-y-3 relative z-10">
          <div className="absolute left-[19px] top-10 bottom-10 w-[2px] bg-gray-200 dark:bg-zinc-700 z-0"></div>

          {/* Origin Input */}
          <div className="relative z-10">
            <input 
              type="text"
              placeholder={t('search_from')}
              value={origin}
              onChange={(e) => handleInput(e.target.value, 'origin')}
              onFocus={() => handleInput(origin, 'origin')}
              className="w-full bg-gray-100 dark:bg-zinc-800 dark:text-white p-4 pl-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-moover-blue focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-moover-blue border-[3px] border-white dark:border-zinc-800 shadow-sm pointer-events-none z-20"></div>
          </div>

          {/* Destination Input */}
          <div className="relative z-10">
            <input 
              type="text"
              placeholder={t('search_to')}
              value={destination}
              onChange={(e) => handleInput(e.target.value, 'destination')}
              onFocus={() => handleInput(destination, 'destination')}
              className="w-full bg-gray-100 dark:bg-zinc-800 dark:text-white p-4 pl-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-moover-blue focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-black dark:bg-white border-[3px] border-white dark:border-zinc-800 shadow-sm pointer-events-none z-20"></div>
          </div>
        </div>

        {/* Traveler Action Button */}
        {origin && destination && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 animate-fade-in">
                <button
                    onClick={() => {
                        HapticsService.impact('LIGHT');
                        setShowTripSheet(true);
                    }}
                    className="w-full bg-moover-dark dark:bg-white text-white dark:text-moover-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-gray-200 dark:shadow-none"
                >
                    <Briefcase className="w-5 h-5" />
                    {t('im_traveling')}
                </button>
            </div>
        )}

        {/* Autocomplete Dropdown - Overlay */}
        {activeField && suggestions.length > 0 && (
          <div className="absolute top-[85%] left-4 right-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700 z-30 overflow-hidden max-h-72 overflow-y-auto animate-fade-in-down">
            {suggestions.map((loc) => (
              <div 
                key={loc.id}
                className="px-5 py-3 border-b border-gray-50 dark:border-zinc-700 active:bg-gray-50 dark:active:bg-zinc-700 flex items-center gap-3 cursor-pointer transition-colors"
                onClick={() => selectSuggestion(loc)}
              >
                <div className={`p-2 rounded-full shrink-0 ${loc.type === 'AIRPORT' ? 'bg-blue-50 dark:bg-blue-900/30 text-moover-blue' : 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'}`}>
                  {loc.type === 'AIRPORT' ? (
                    <Plane className="w-4 h-4" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-moover-dark dark:text-white">{loc.name}</span>
                    <span className="text-xs text-gray-400 font-medium">{loc.subText}</span>
                </div>
              </div>
            ))}
            {/* Google Attribution */}
            <div className="px-5 py-2 bg-gray-50 dark:bg-zinc-900 flex justify-end">
               <img src="https://maps.gstatic.com/mapfiles/api-3/images/google_white5.png" alt="Powered by Google" className="h-3 opacity-70" />
            </div>
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="flex-1 p-5 overflow-y-auto pb-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold dark:text-white">{t('results_travelers')}</h2>
        </div>

        {/* Search Bar & Filter Button */}
        <div className="flex gap-3 mb-6">
            <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400 group-focus-within:text-moover-blue transition-colors" />
                </div>
                <input 
                    type="text"
                    placeholder={t('filter_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-moover-dark dark:text-white text-sm rounded-xl py-3 pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-moover-blue focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                />
            </div>
            <button 
                onClick={() => {
                    HapticsService.impact('LIGHT');
                    setShowFilterSheet(true);
                }}
                className={`w-12 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all border ${filters.sortBy !== 'recommended' || filters.minCapacity > 0 ? 'bg-moover-blue text-white border-transparent' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-zinc-800'}`}
            >
                <Filter className="w-5 h-5" />
            </button>
        </div>
        
        {filteredTrips.length > 0 ? (
            filteredTrips.map((trip) => (
            <TripCard 
                key={trip.id} 
                trip={trip} 
                onPress={() => {
                    HapticsService.impact('LIGHT');
                    setSelectedTrip(trip);
                }} 
            />
            ))
        ) : (
            <div className="text-center py-8 opacity-50">
                 <p className="text-sm font-medium text-gray-400 dark:text-gray-500">{t('no_travelers')} "{searchQuery}"</p>
            </div>
        )}
        
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">{t('thats_all')}</p>
          <button className="text-moover-blue text-sm font-semibold mt-2">{t('wishlist_request')}</button>
        </div>
      </div>

      {/* Date Picker Bottom Sheet */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDatePicker(false)} />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2rem] p-6 relative z-10 animate-slide-up pb-safe-bottom shadow-2xl">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-moover-dark dark:text-white">Select Dates</h2>
                    <button onClick={() => setShowDatePicker(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* FILTER SHEET */}
      {showFilterSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilterSheet(false)} />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2rem] p-6 relative z-10 animate-slide-up pb-safe-bottom shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-moover-dark dark:text-white">Filters & Sort</h2>
                    <button onClick={() => setShowFilterSheet(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="space-y-8">
                    {/* Sort Section */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sort By</h3>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'recommended', label: 'Recommended', icon: null },
                                { id: 'price_asc', label: 'Price: Low to High', icon: <ArrowUpDown className="w-3 h-3" /> },
                                { id: 'price_desc', label: 'Price: High to Low', icon: <ArrowUpDown className="w-3 h-3" /> },
                                { id: 'capacity_asc', label: 'Capacity: Low to High', icon: <Scale className="w-3 h-3" /> },
                                { id: 'capacity_desc', label: 'Capacity: High to Low', icon: <Scale className="w-3 h-3" /> },
                                { id: 'date_asc', label: 'Earliest Departure', icon: <CalendarDays className="w-3 h-3" /> },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFilters(prev => ({ ...prev, sortBy: opt.id }))}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${filters.sortBy === opt.id ? 'bg-moover-blue text-white border-moover-blue shadow-md' : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700'}`}
                                >
                                    {opt.icon} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Max Price (per kg)</h3>
                            <span className="text-moover-dark dark:text-white font-bold">${filters.maxPrice}</span>
                         </div>
                         <input 
                            type="range" 
                            min="5" max="100" step="1"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-moover-blue"
                        />
                    </div>

                    {/* Capacity Range */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Minimum Capacity Needed</h3>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setFilters(prev => ({ ...prev, minCapacity: Math.max(0, prev.minCapacity - 1) }))}
                                className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <div className="flex-1 text-center bg-gray-50 dark:bg-zinc-800 py-3 rounded-xl border border-gray-100 dark:border-zinc-700">
                                <span className="text-2xl font-bold text-moover-dark dark:text-white">{filters.minCapacity}</span>
                                <span className="text-gray-400 text-sm ml-1">kg+</span>
                            </div>
                            <button 
                                onClick={() => setFilters(prev => ({ ...prev, minCapacity: prev.minCapacity + 1 }))}
                                className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                         <button 
                            onClick={() => setFilters({ sortBy: 'recommended', minCapacity: 0, maxPrice: 100 })}
                            className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 active:scale-95 transition-transform"
                         >
                            Reset
                        </button>
                        <button 
                            onClick={handleApplyFilters}
                            className="flex-[2] py-4 rounded-2xl font-bold text-white bg-moover-dark dark:bg-white dark:text-moover-dark shadow-lg active:scale-95 transition-transform"
                        >
                            Show {filteredTrips.length} Results
                        </button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* Post Trip Sheet */}
      {showTripSheet && (
          <PostTripWizard 
              initialOrigin={origin}
              initialDestination={destination}
              onClose={() => setShowTripSheet(false)}
          />
      )}

      {/* NEW TRIP DETAIL SHEET */}
      {selectedTrip && (
          <TripDetailSheet 
             trip={selectedTrip} 
             onClose={() => setSelectedTrip(null)} 
          />
      )}
    </div>
  );
};