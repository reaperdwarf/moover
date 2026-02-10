import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Plane, Building2, X, Briefcase, Plus, Scale, ArrowRight, Calendar, MapPin, Package, User, DollarSign, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { TripCard } from './TripCard';
import { TripDetailSheet } from './TripDetailSheet';
import { PostTripWizard } from './PostTripWizard';
import { ProfileDetailSheet } from './ProfileDetailSheet';
import { RequestDetailSheet } from './RequestDetailSheet';
import { useStore } from '../store';
import { HapticsService } from '../services/capacitorService';
import { Trip, WishlistRequest, User as UserType } from '../types';

type LocationType = 'AIRPORT' | 'CITY';

interface LocationItem {
  id: string;
  name: string;
  subText: string;
  type: LocationType;
  keywords: string[]; 
}

export const SearchAndBook: React.FC = () => {
  const { activeTrips, activeRequests, addWishlistRequest, acceptWishlistRequest, getPublicProfile, preferences, parseProductLink, currentUser } = useStore(); 
  const { t } = useTranslation();
  
  const [viewMode, setViewMode] = useState<'TRIPS' | 'REQUESTS'>('TRIPS');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);

  // WIZARD & MODAL STATES
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [isAcceptingRequest, setIsAcceptingRequest] = useState<WishlistRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<WishlistRequest | null>(null);
  const [viewingProfile, setViewingProfile] = useState<UserType | null>(null);
  
  // ADDED: Auth Guard State
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  // Create Request Form
  const [reqFrom, setReqFrom] = useState('');
  const [reqTo, setReqTo] = useState('');
  const [reqWeight, setReqWeight] = useState(1);
  const [reqDesc, setReqDesc] = useState('');
  const [reqDate, setReqDate] = useState('');
  const [reqValue, setReqValue] = useState('');
  const [reqUrl, setReqUrl] = useState('');
  
  // ADDED: URL Parsing State
  const [isParsingUrl, setIsParsingUrl] = useState(false);

  // Accept Request Form
  const [handoffDate, setHandoffDate] = useState('');
  const [handoffLocation, setHandoffLocation] = useState('');

  const autocompleteService = useRef<any>(null);

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
    const request = { input: input, types: ['(cities)'] };
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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTripSheet, setShowTripSheet] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState({ sortBy: 'recommended', minCapacity: 0, maxPrice: 100 });
  const [searchQuery, setSearchQuery] = useState('');

  const handleApplyFilters = () => {
      HapticsService.impact('MEDIUM');
      setShowFilterSheet(false);
  };

  // ADDED: URL Parser Trigger
  const handleUrlPaste = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      setReqUrl(url);
      if (url.includes('http')) {
          setIsParsingUrl(true);
          const data = await parseProductLink(url);
          if (data) {
              setReqDesc(data.title);
              setReqValue(data.price.toString());
              setReqWeight(data.weight);
              HapticsService.notification('SUCCESS');
          }
          setIsParsingUrl(false);
      }
  };

  const handleCreateRequest = () => {
      // ADDED: Auth Guard
      if (!currentUser) {
          setShowAuthWarning(true);
          setTimeout(() => setShowAuthWarning(false), 3000);
          return;
      }

      if (!reqFrom || !reqTo || !reqDesc || !reqDate) return;
      const newReq: WishlistRequest = {
          id: 'req_' + Date.now(),
          requester_uid: currentUser.uid,
          requester_name: currentUser.display_name, 
          origin_location: reqFrom,
          destination_location: reqTo,
          item_weight_kg: reqWeight,
          item_description: reqDesc,
          deadline_date: reqDate,
          item_value: reqValue ? parseFloat(reqValue) : undefined,
          product_url: reqUrl,
          status: 'OPEN',
          created_at: new Date().toISOString()
      };
      addWishlistRequest(newReq);
      setIsCreatingRequest(false);
      setReqFrom(''); setReqTo(''); setReqWeight(1); setReqDesc(''); setReqDate(''); setReqValue(''); setReqUrl('');
      HapticsService.notification('SUCCESS');
  };

  const handleConfirmAcceptance = () => {
      if (!isAcceptingRequest || !handoffDate || !handoffLocation) return;
      acceptWishlistRequest(isAcceptingRequest.id, { handoffDate, handoffLocation });
      setIsAcceptingRequest(null);
      setHandoffDate(''); setHandoffLocation('');
      HapticsService.notification('SUCCESS');
  };

  const handleProfileClick = (uid: string) => {
      HapticsService.impact('LIGHT');
      const profile = getPublicProfile(uid);
      setViewingProfile(profile);
  };

  const isImperial = preferences.unitSystem === 'IMPERIAL';
  const displayWeight = isImperial ? (reqWeight * 2.20462).toFixed(1) : reqWeight.toFixed(1);
  const displayUnit = isImperial ? 'lbs' : 'kg';

  const filteredTrips = activeTrips.filter(trip => {
    if (searchQuery) {
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(t => t.length > 0);
        const tripString = `${trip.origin_city} ${trip.destination_city} ${trip.traveler_name} ${trip.outbound_date}`.toLowerCase();
        if (!searchTerms.every(term => tripString.includes(term))) return false;
    }
    if (trip.available_weight_kg < filters.minCapacity) return false;
    if (trip.price_per_kg > filters.maxPrice) return false;
    return true;
  });

  const filteredRequests = activeRequests.filter(req => 
    req.status === 'OPEN' && (
        req.destination_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.origin_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.item_description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-zinc-900 p-5 pb-6 rounded-b-3xl shadow-sm z-20 sticky top-0 relative transition-colors">
        <h1 className="text-2xl font-bold mb-4 text-moover-dark dark:text-white">{t('search_title')}</h1>
        
        <div className="space-y-3 relative z-10">
          <div className="absolute left-[19px] top-10 bottom-10 w-[2px] bg-gray-200 dark:bg-zinc-700 z-0"></div>
          <div className="relative z-10">
            <input 
              type="text" placeholder={t('search_from')} value={origin} onChange={(e) => handleInput(e.target.value, 'origin')} onFocus={() => handleInput(origin, 'origin')}
              className="w-full bg-gray-100 dark:bg-zinc-800 dark:text-white p-4 pl-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-moover-blue focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-moover-blue border-[3px] border-white dark:border-zinc-800 shadow-sm pointer-events-none z-20"></div>
          </div>
          <div className="relative z-10">
            <input 
              type="text" placeholder={t('search_to')} value={destination} onChange={(e) => handleInput(e.target.value, 'destination')} onFocus={() => handleInput(destination, 'destination')}
              className="w-full bg-gray-100 dark:bg-zinc-800 dark:text-white p-4 pl-10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-moover-blue focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-black dark:bg-white border-[3px] border-white dark:border-zinc-800 shadow-sm pointer-events-none z-20"></div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 animate-fade-in space-y-3">
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

            {viewMode === 'TRIPS' && (
                <div className="flex gap-2">
                     <button
                        onClick={() => { HapticsService.impact('LIGHT'); setShowTripSheet(true); }}
                        className="flex-1 bg-moover-dark dark:bg-white text-white dark:text-moover-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-gray-200 dark:shadow-none text-xs"
                    >
                        <Briefcase className="w-4 h-4" />
                        {t('im_traveling')}
                    </button>
                    <button
                        onClick={() => { HapticsService.impact('LIGHT'); setIsCreatingRequest(true); }}
                        className="flex-1 bg-moover-blue/10 text-moover-blue font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform text-xs border border-moover-blue/20"
                    >
                        <Plus className="w-4 h-4" />
                        Create Request
                    </button>
                </div>
            )}
        </div>

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

        <div className="flex gap-3 mb-6">
            <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                    type="text" placeholder={viewMode === 'TRIPS' ? t('filter_placeholder') : "Filter requests..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-moover-dark dark:text-white text-sm rounded-xl py-3 pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-moover-blue focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                />
            </div>
            {viewMode === 'TRIPS' && (
                <button 
                    onClick={() => { HapticsService.impact('LIGHT'); setShowFilterSheet(true); }}
                    className={`w-12 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all border ${filters.sortBy !== 'recommended' || filters.minCapacity > 0 ? 'bg-moover-blue text-white border-transparent' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-zinc-800'}`}
                >
                    <Filter className="w-5 h-5" />
                </button>
            )}
        </div>
        
        {viewMode === 'TRIPS' ? (
            filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => (
                <TripCard 
                    key={trip.id} 
                    trip={trip} 
                    onPress={() => { HapticsService.impact('LIGHT'); setSelectedTrip(trip); }} 
                    onProfileClick={handleProfileClick}
                />
                ))
            ) : <div className="text-center py-8 opacity-50"><p>{t('no_travelers')} "{searchQuery}"</p></div>
        ) : (
            filteredRequests.length > 0 ? (
                filteredRequests.map(req => (
                    // Make the entire card clickable to open Request Details
                    <div 
                        key={req.id} 
                        className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden mb-4 active:scale-[0.98] transition-transform"
                        onClick={() => {
                            HapticsService.impact('LIGHT');
                            setSelectedRequest(req); // OPEN DETAIL SHEET
                        }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div 
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent opening detail sheet when clicking profile
                                    handleProfileClick(req.requester_uid);
                                }}
                            >
                                <div className="relative">
                                    <img src={req.requester_photo || 'https://picsum.photos/200'} className="w-10 h-10 rounded-full object-cover" />
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

                        {req.deadline_date && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg w-fit">
                                <Calendar className="w-3.5 h-3.5" />
                                Need by {req.deadline_date}
                            </div>
                        )}
                    </div>
                ))
            ) : <div className="text-center py-8 opacity-50"><p>No requests found.</p></div>
        )}
      </div>

      {/* --- MODALS --- */}
      {showFilterSheet && <div className="fixed inset-0 z-50 flex items-end justify-center">...</div>}
      {showTripSheet && <PostTripWizard initialOrigin={origin} initialDestination={destination} onClose={() => setShowTripSheet(false)} />}
      
      {/* ACCEPT GIG WIZARD */}
      {isAcceptingRequest && (
          <PostTripWizard 
              initialOrigin={isAcceptingRequest.origin_location} 
              initialDestination={isAcceptingRequest.destination_location} 
              linkedRequest={isAcceptingRequest} 
              onClose={() => setIsAcceptingRequest(null)} 
          />
      )}
      
      {/* NEW: REQUEST DETAIL SHEET */}
      {selectedRequest && (
          <RequestDetailSheet 
              request={selectedRequest} 
              onClose={() => setSelectedRequest(null)}
              onAccept={() => {
                  // ADDED: Guard
                  if (!currentUser) {
                      setShowAuthWarning(true);
                      setTimeout(() => setShowAuthWarning(false), 3000);
                      return;
                  }
                  setSelectedRequest(null);
                  setIsAcceptingRequest(selectedRequest); // Pass to Wizard
              }}
              onProfileClick={handleProfileClick}
          />
      )}

      {selectedTrip && <TripDetailSheet trip={selectedTrip} onClose={() => setSelectedTrip(null)} />}
      
      {/* CREATE REQUEST WIZARD (EXTENDED) */}
      {isCreatingRequest && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCreatingRequest(false)} />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] relative z-10 animate-slide-up p-6 pb-safe-bottom h-[85vh] flex flex-col">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6 shrink-0" />
                <h2 className="text-xl font-bold text-moover-dark dark:text-white mb-6 shrink-0">Create Wishlist Request</h2>
                
                {/* ADDED: Login Warning */}
                {showAuthWarning && (
                    <div className="absolute top-20 left-6 right-6 bg-red-500 text-white p-3 rounded-xl text-center text-sm font-bold animate-fade-in shadow-xl z-50 flex items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Please log in to post a request!
                    </div>
                )}

                <div className="space-y-4 flex-1 overflow-y-auto px-1">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">From (Vague allowed)</label>
                        <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="e.g. USA" value={reqFrom} onChange={e => setReqFrom(e.target.value)} className="bg-transparent w-full font-bold dark:text-white outline-none"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">To</label>
                        <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-moover-blue" />
                            <input type="text" placeholder="e.g. Honduras" value={reqTo} onChange={e => setReqTo(e.target.value)} className="bg-transparent w-full font-bold dark:text-white outline-none"/>
                        </div>
                    </div>
                    
                    {/* NEW: DEADLINE */}
                    <div>
                        <label className="text-xs font-bold text-red-500 uppercase ml-1">Required By (Deadline)</label>
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30">
                            <Calendar className="w-5 h-5 text-red-500" />
                            <input type="date" value={reqDate} onChange={e => setReqDate(e.target.value)} className="bg-transparent w-full font-bold dark:text-white outline-none"/>
                        </div>
                    </div>

                    {/* ADDED: URL PARSER */}
                    <div>
                        <label className="text-xs font-bold text-blue-500 uppercase ml-1">Auto-Fill from Link</label>
                        <div className={`bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center gap-3 border border-blue-100 dark:border-blue-800 ${isParsingUrl ? 'opacity-50' : ''}`}>
                            <LinkIcon className={`w-5 h-5 text-blue-500 ${isParsingUrl ? 'animate-spin' : ''}`} />
                            <input 
                                type="url" 
                                placeholder="Paste Amazon/Ebay Link..." 
                                value={reqUrl} 
                                onChange={handleUrlPaste}
                                className="bg-transparent w-full font-bold dark:text-white outline-none placeholder:text-blue-300"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Description</label>
                        <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3">
                            <Package className="w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="e.g. Laptop" value={reqDesc} onChange={e => setReqDesc(e.target.value)} className="bg-transparent w-full font-bold dark:text-white outline-none"/>
                        </div>
                    </div>

                    {/* NEW: VALUE & URL */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Est. Value ($)</label>
                            <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <input type="number" placeholder="100" value={reqValue} onChange={e => setReqValue(e.target.value)} className="bg-transparent w-full font-bold dark:text-white outline-none"/>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2 px-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Est. Weight</label>
                            <span className="text-xl font-bold text-moover-blue">{displayWeight} {displayUnit}</span>
                        </div>
                        <input type="range" min="0.5" max="25" step="0.5" value={reqWeight} onChange={(e) => setReqWeight(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-moover-blue"/>
                    </div>
                </div>
                <button onClick={handleCreateRequest} disabled={!reqFrom || !reqTo || !reqDesc || !reqDate} className={`w-full py-4 rounded-2xl font-bold text-white mt-4 active:scale-95 transition-transform shrink-0 ${!reqFrom || !reqTo || !reqDesc || !reqDate ? 'bg-gray-300' : 'bg-moover-blue shadow-lg'}`}>Post Request</button>
            </div>
        </div>
      )}
      
      {/* PROFILE SHEET */}
      {viewingProfile && <ProfileDetailSheet user={viewingProfile} onClose={() => setViewingProfile(null)} />}

    </div>
  );
};