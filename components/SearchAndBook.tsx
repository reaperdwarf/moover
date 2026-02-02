import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Plane, Building2, X, Briefcase, Minus, Plus, Scale, ArrowUpDown, CalendarDays, MapPin, Package, ArrowRight } from 'lucide-react';
import { TripCard } from './TripCard';
import { TripDetailSheet } from './TripDetailSheet';
import { PostTripWizard } from './PostTripWizard';
import { useStore } from '../store';
import { HapticsService } from '../services/capacitorService';
import { Trip, WishlistRequest } from '../types';

type LocationType = 'AIRPORT' | 'CITY';

interface LocationItem {
  id: string;
  name: string;
  subText: string;
  type: LocationType;
  keywords: string[]; 
}

export const SearchAndBook: React.FC = () => {
  const { activeTrips, activeRequests, addWishlistRequest, preferences } = useStore(); 
  const { t } = useTranslation();
  
  // VIEW MODE: 'TRIPS' (Standard) or 'REQUESTS' (Travelers looking for gigs)
  const [viewMode, setViewMode] = useState<'TRIPS' | 'REQUESTS'>('TRIPS');

  // Form State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  
  // Autocomplete State
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);

  // Wishlist Creation State
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [reqFrom, setReqFrom] = useState('');
  const [reqTo, setReqTo] = useState('');
  const [reqWeight, setReqWeight] = useState(1);
  const [reqDesc, setReqDesc] = useState('');

  // Google Service Ref
  const autocompleteService = useRef<any>(null);

  // Initialize Google Maps Service (Try 1: On Load)
  useEffect(() => {
    // @ts-ignore
    if (window.google && window.google.maps && window.google.maps.places) {
      // @ts-ignore
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  const fetchPredictions = (input: string) => {
    if (!autocompleteService.current) {
        // @ts-ignore
        if (window.google && window.google.maps && window.google.maps.places) {
            // @ts-ignore
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
        } else {
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

  const handleCreateRequest = () => {
      if (!reqFrom || !reqTo || !reqDesc) return;
      
      const newReq: WishlistRequest = {
          id: 'req_' + Date.now(),
          requester_uid: 'me',
          requester_name: 'Me', // In real app, get from currentUser
          origin_location: reqFrom,
          destination_location: reqTo,
          item_weight_kg: reqWeight,
          item_description: reqDesc,
          status: 'OPEN',
          created_at: new Date().toISOString()
      };

      addWishlistRequest(newReq);
      setIsCreatingRequest(false);
      setReqFrom('');
      setReqTo('');
      setReqWeight(1);
      setReqDesc('');
      HapticsService.notification('SUCCESS');
  };

  const isImperial = preferences.unitSystem === 'IMPERIAL';
  const displayWeight = isImperial ? (reqWeight * 2.20462).toFixed(1) : reqWeight.toFixed(1);
  const displayUnit = isImperial ? 'lbs' : 'kg';

  // --- FILTERING LOGIC ---
  const filteredTrips = activeTrips.filter(trip => {
    if (searchQuery) {
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(t => t.length > 0);
        const tripString = `${trip.origin_city} ${trip.destination_city} ${trip.traveler_name} ${trip.outbound_date} ${trip.return_date || ''}`.toLowerCase();
        if (!searchTerms.every(term => tripString.includes(term))) return false;
    }
    if (trip.available_weight_kg < filters.minCapacity) return false;
    if (trip.price_per_kg > filters.maxPrice) return false;
    return true;
  });

  const filteredRequests = activeRequests.filter(req => 
    req.destination_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.origin_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.item_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors">
      
      {/* HEADER AREA */}
      <div className="bg-white dark:bg-zinc-900 p-5 pb-6 rounded-b-3xl shadow-sm z-20 sticky top-0 relative transition-colors">
        <h1 className="text-2xl font-bold mb-4 text-moover-dark dark:text-white">{t('search_title')}</h1>
        
        {/* EXISTING GOOGLE INPUTS */}
        <div className="space-y-3 relative z-10">
          <div className="absolute left-[19px] top-10 bottom-10 w-[2px] bg-gray-200 dark:bg-zinc-700 z-0"></div>

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

        {/* NEW: MODE TOGGLE & ACTION BUTTONS */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 animate-fade-in space-y-3">
            
            {/* TOGGLE */}
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button 
                    onClick={() => { setViewMode('TRIPS'); HapticsService.impact('LIGHT'); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'TRIPS' ? 'bg-white dark:bg-zinc-700 shadow text-moover-dark dark:text-white' : 'text-gray-400'}`}
                >
                    Find Travelers
                </button>
                <button 
                    onClick={() => { setViewMode('REQUESTS'); HapticsService.impact('LIGHT'); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'REQUESTS' ? 'bg-white dark:bg-zinc-700 shadow text-moover-dark dark:text-white' : 'text-gray-400'}`}
                >
                    Find Gigs
                </button>
            </div>

            {/* ACTION BUTTONS */}
            {viewMode === 'TRIPS' ? (
                // "I'm Traveling" + "Create Wishlist"
                <div className="flex gap-2">
                     <button
                        onClick={() => {
                            HapticsService.impact('LIGHT');
                            setShowTripSheet(true);
                        }}
                        className="flex-1 bg-moover-dark dark:bg-white text-white dark:text-moover-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-gray-200 dark:shadow-none text-xs"
                    >
                        <Briefcase className="w-4 h-4" />
                        {t('im_traveling')}
                    </button>
                    <button
                        onClick={() => {
                            HapticsService.impact('LIGHT');
                            setIsCreatingRequest(true);
                        }}
                        className="flex-1 bg-moover-blue/10 text-moover-blue font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform text-xs border border-moover-blue/20"
                    >
                        <Plus className="w-4 h-4" />
                        Create Request
                    </button>
                </div>
            ) : null}
        </div>

        {/* Autocomplete Overlay */}
        {activeField && suggestions.length > 0 && (
          <div className="absolute top-[85%] left-4 right-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-700 z-30 overflow-hidden max-h-72 overflow-y-auto animate-fade-in-down">
            {suggestions.map((loc) => (
              <div 
                key={loc.id}
                className="px-5 py-3 border-b border-gray-50 dark:border-zinc-700 active:bg-gray-50 dark:active:bg-zinc-700 flex items-center gap-3 cursor-pointer transition-colors"
                onClick={() => selectSuggestion(loc)}
              >
                <div className={`p-2 rounded-full shrink-0 ${loc.type === 'AIRPORT' ? 'bg-blue-50 dark:bg-blue-900/30 text-moover-blue' : 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'}`}>
                  {loc.type === 'AIRPORT' ? <Plane className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-moover-dark dark:text-white">{loc.name}</span>
                    <span className="text-xs text-gray-400 font-medium">{loc.subText}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESULTS LIST */}
      <div className="flex-1 p-5 overflow-y-auto pb-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
              {viewMode === 'TRIPS' ? t('results_travelers') : 'Active Requests'}
              <span className="text-xs bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                {viewMode === 'TRIPS' ? filteredTrips.length : filteredRequests.length}
              </span>
          </h2>
        </div>

        {/* Local Filter Bar */}
        <div className="flex gap-3 mb-6">
            <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                    type="text"
                    placeholder={viewMode === 'TRIPS' ? t('filter_placeholder') : "Filter requests..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-moover-dark dark:text-white text-sm rounded-xl py-3 pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-moover-blue focus:outline-none transition-all"
                />
            </div>
            {viewMode === 'TRIPS' && (
                <button 
                    onClick={() => setShowFilterSheet(true)}
                    className={`w-12 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all border ${filters.sortBy !== 'recommended' ? 'bg-moover-blue text-white' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400'}`}
                >
                    <Filter className="w-5 h-5" />
                </button>
            )}
        </div>
        
        {/* LIST RENDER */}
        {viewMode === 'TRIPS' ? (
            filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => (
                <TripCard 
                    key={trip.id} 
                    trip={trip} 
                    onPress={() => setSelectedTrip(trip)} 
                />
                ))
            ) : (
                <div className="text-center py-8 opacity-50"><p>{t('no_travelers')}</p></div>
            )
        ) : (
            // REQUESTS VIEW
            filteredRequests.length > 0 ? (
                filteredRequests.map(req => (
                    <div key={req.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden mb-4">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 font-bold">
                                    {req.requester_name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-moover-dark dark:text-white">{req.item_description}</h3>
                                    <p className="text-xs text-gray-400">Requested by {req.requester_name}</p>
                                </div>
                            </div>
                            <div className="bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-bold text-moover-dark dark:text-white">
                                {isImperial ? (req.item_weight_kg * 2.2).toFixed(1) : req.item_weight_kg} {displayUnit}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-black/50 p-3 rounded-xl">
                            <span className="font-bold text-moover-dark dark:text-white">{req.origin_location}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span className="font-bold text-moover-dark dark:text-white">{req.destination_location}</span>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button className="flex-1 py-2 bg-moover-dark dark:bg-white text-white dark:text-moover-dark font-bold rounded-xl text-sm active:scale-95 transition-transform">
                                Accept Gig
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 opacity-50"><p>No requests found.</p></div>
            )
        )}
      </div>

      {/* MODALS */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* ... Date Picker Content ... */}
        </div>
      )}

      {showFilterSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
             {/* ... Filter Sheet Content ... */}
          </div>
      )}

      {showTripSheet && (
          <PostTripWizard 
              initialOrigin={origin}
              initialDestination={destination}
              onClose={() => setShowTripSheet(false)}
          />
      )}

      {selectedTrip && (
          <TripDetailSheet 
             trip={selectedTrip} 
             onClose={() => setSelectedTrip(null)} 
          />
      )}

      {/* NEW: CREATE REQUEST WIZARD */}
      {isCreatingRequest && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCreatingRequest(false)} />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] relative z-10 animate-slide-up p-6 pb-safe-bottom">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
                
                <h2 className="text-xl font-bold text-moover-dark dark:text-white mb-6">Create Wishlist Request</h2>

                <div className="space-y-4">
                    {/* FROM */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">From (Vague allowed)</label>
                        <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="e.g. USA or Miami"
                                value={reqFrom}
                                onChange={e => setReqFrom(e.target.value)}
                                className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* TO */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">To</label>
                        <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-moover-blue" />
                            <input 
                                type="text" 
                                placeholder="e.g. Honduras"
                                value={reqTo}
                                onChange={e => setReqTo(e.target.value)}
                                className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">What do you need moved?</label>
                        <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3">
                            <Package className="w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="e.g. Car parts, Laptop"
                                value={reqDesc}
                                onChange={e => setReqDesc(e.target.value)}
                                className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* WEIGHT SLIDER */}
                    <div>
                        <div className="flex justify-between items-end mb-2 px-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Est. Weight</label>
                            <span className="text-xl font-bold text-moover-blue">{displayWeight} {displayUnit}</span>
                        </div>
                        <input 
                            type="range"
                            min="0.5"
                            max="25"
                            step="0.5"
                            value={reqWeight}
                            onChange={(e) => {
                                HapticsService.impact('LIGHT');
                                setReqWeight(parseFloat(e.target.value));
                            }}
                            className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-moover-blue"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleCreateRequest}
                    disabled={!reqFrom || !reqTo || !reqDesc}
                    className={`w-full py-4 rounded-2xl font-bold text-white mt-8 active:scale-95 transition-transform ${!reqFrom || !reqTo || !reqDesc ? 'bg-gray-300' : 'bg-moover-blue shadow-lg shadow-blue-500/30'}`}
                >
                    Post Request
                </button>
            </div>
        </div>
      )}

    </div>
  );
};