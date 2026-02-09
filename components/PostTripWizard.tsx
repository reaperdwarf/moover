import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronRight, Plane, Car, Train, Briefcase, Package, ShoppingBag, CheckCircle, Calendar, MapPin, DollarSign, ChevronLeft, Scale, Lock, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { HapticsService } from '../services/capacitorService';
import { Trip, WishlistRequest } from '../types';

interface PostTripWizardProps {
  initialOrigin: string;
  initialDestination: string;
  linkedRequest?: WishlistRequest | null;
  onClose: () => void;
}

export const PostTripWizard: React.FC<PostTripWizardProps> = ({ initialOrigin, initialDestination, linkedRequest, onClose }) => {
  const { currentUser, addTrip, acceptWishlistRequest, preferences } = useStore(); 
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  // --- INTELLIGENT DEFAULT SETTINGS ---
  const defaultIsMetric = preferences.unitSystem === 'METRIC';

  // Form State
  const [origin, setOrigin] = useState(linkedRequest ? linkedRequest.origin_location : initialOrigin);
  const [destination, setDestination] = useState(linkedRequest ? linkedRequest.destination_location : initialDestination);
  const [departureDate, setDepartureDate] = useState('');
  
  // DATES & LOGISTICS
  const [deadlineDate, setDeadlineDate] = useState('');
  const [willingToBuy, setWillingToBuy] = useState(false);
  const [willingToPickup, setWillingToPickup] = useState(false); // Preserved Feature
  
  const [returnDate, setReturnDate] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);

  // --- CAPACITY STATE (LOCKED IF GIG) ---
  const getInitialWeight = () => {
      if (linkedRequest) {
          // Locked to request weight
          return defaultIsMetric 
            ? linkedRequest.item_weight_kg 
            : Math.round(linkedRequest.item_weight_kg * 2.20462);
      }
      return defaultIsMetric ? 10 : 22; 
  };

  const [weight, setWeight] = useState(getInitialWeight());
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LBS'>(defaultIsMetric ? 'KG' : 'LBS');
  
  const [transportMode, setTransportMode] = useState<'FLIGHT' | 'CAR' | 'TRAIN'>('FLIGHT');
  const [pricePerUnit, setPricePerUnit] = useState(defaultIsMetric ? 15 : 7);

  const weightInKg = weightUnit === 'KG' ? weight : weight / 2.20462;
  const estimatedEarnings = Math.round(weight * pricePerUnit);

  const handleDepartureDateChange = (val: string) => {
      setDepartureDate(val);
      if (val) {
          const d = new Date(val);
          d.setDate(d.getDate() - 2);
          setDeadlineDate(d.toISOString().split('T')[0]);
      }
  };

  const toggleWeightUnit = () => {
    // If locked, we still allow unit toggle for viewing convenience, but value remains derived from request
    HapticsService.impact('LIGHT');
    if (weightUnit === 'KG') {
        setWeight(Math.round(weight * 2.20462));
        setPricePerUnit(Math.max(2, Math.round(pricePerUnit / 2.20462)));
        setWeightUnit('LBS');
    } else {
        setWeight(Math.round(weight / 2.20462));
        setPricePerUnit(Math.round(pricePerUnit * 2.20462));
        setWeightUnit('KG');
    }
  };

  const isStepValid = () => {
    if (step === 1) {
        if (!origin.trim() || !destination.trim() || !departureDate) return false;
        if (!deadlineDate) return false;
        if (isRoundTrip && !returnDate) return false;
        return true;
    }
    if (step === 2) return weight > 0;
    if (step === 3) return !!transportMode;
    if (step === 4) return pricePerUnit > 0;
    return true;
  };

  const handleNext = () => {
    if (!isStepValid()) {
        HapticsService.notification('ERROR');
        return;
    }
    HapticsService.impact('LIGHT');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    HapticsService.impact('LIGHT');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handlePublish = () => {
    if (!currentUser) {
        HapticsService.notification('ERROR');
        setShowLoginWarning(true);
        setTimeout(() => setShowLoginWarning(false), 3000);
        return; 
    }

    const pricePerKgNormalized = weightUnit === 'KG' ? pricePerUnit : (pricePerUnit * 2.20462);

    const newTrip: Trip = {
        id: `trip_${Date.now()}`,
        traveler_uid: currentUser.uid,
        traveler_name: currentUser.display_name,
        traveler_photo: currentUser.photo_url,
        origin_city: origin || "New York, NY",
        origin_geohash: 'xxxxxx',
        destination_city: destination || "London, UK",
        destination_geohash: 'yyyyyy',
        outbound_date: departureDate || new Date().toISOString().split('T')[0],
        latest_handoff_date: deadlineDate,
        willing_to_buy: willingToBuy,
        willing_to_pickup: willingToPickup, // Saved
        linked_request_id: linkedRequest ? linkedRequest.id : undefined,
        return_date: isRoundTrip ? returnDate : undefined,
        is_round_trip: isRoundTrip,
        available_weight_kg: Math.round(weightInKg),
        price_per_kg: Math.round(pricePerKgNormalized),
        transport_mode: transportMode,
        status: 'OPEN'
    };

    addTrip(newTrip);

    if (linkedRequest) {
        acceptWishlistRequest(linkedRequest.id, {
            handoffDate: deadlineDate,
            handoffLocation: origin 
        });
    }

    HapticsService.impact('HEAVY');
    HapticsService.notification('SUCCESS');
    onClose();
  };

  const renderProgressBar = () => (
    <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-moover-blue' : 'bg-gray-200 dark:bg-zinc-700'}`} />
        ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] p-6 relative z-10 animate-slide-up pb-safe-bottom shadow-2xl h-[85vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6 shrink-0" />
        <div className="flex items-center justify-between mb-2 shrink-0">
            {step > 1 ? (
                <button onClick={handleBack} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 active:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
            ) : <div className="w-9" />}
            
            <h2 className="text-lg font-bold text-moover-dark dark:text-white">
                {linkedRequest ? "Accept Gig & Create Trip" : t('wizard_step1')}
            </h2>
            
            <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 active:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>
        
        {renderProgressBar()}

        <div className="flex-1 overflow-y-auto px-1 py-2 no-scrollbar">
            
            {/* STEP 1: ROUTE */}
            {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                    {/* Pre-fill Notice */}
                    {linkedRequest && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-orange-600" />
                            <div className="text-xs text-orange-800 dark:text-orange-200 font-medium">
                                Pre-filled from request. Verify your dates.
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('from')}</label>
                        <div className={`flex items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border ${!origin.trim() ? 'border-gray-200 dark:border-zinc-700' : 'border-moover-blue/30'} focus-within:ring-2 focus-within:ring-moover-blue transition-all`}>
                            <MapPin className={`w-5 h-5 mr-3 shrink-0 ${!origin.trim() ? 'text-gray-400' : 'text-moover-blue'}`} />
                            <input 
                                type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Origin City"
                                className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-zinc-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('to')}</label>
                        <div className={`flex items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border ${!destination.trim() ? 'border-gray-200 dark:border-zinc-700' : 'border-moover-dark/30 dark:border-white/30'} focus-within:ring-2 focus-within:ring-moover-blue transition-all`}>
                            <MapPin className="w-5 h-5 text-moover-dark dark:text-white mr-3 shrink-0" />
                            <input 
                                type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination City"
                                className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-zinc-500"
                            />
                        </div>
                    </div>

                    {!linkedRequest && (
                        <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                            <span className="font-bold text-moover-dark dark:text-white text-sm">{t('round_trip')}?</span>
                            <button 
                                onClick={() => setIsRoundTrip(!isRoundTrip)}
                                className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${isRoundTrip ? 'bg-moover-blue' : 'bg-gray-300 dark:bg-zinc-600'}`}
                            >
                                <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${isRoundTrip ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('departure')}</label>
                            <input 
                                type="date" value={departureDate} onChange={(e) => handleDepartureDateChange(e.target.value)}
                                className={`w-full bg-gray-50 dark:bg-zinc-800 dark:text-white p-3 rounded-xl font-bold text-sm outline-none border ${!departureDate ? 'border-gray-200 dark:border-zinc-700' : 'border-moover-blue/30'} focus:ring-2 focus:ring-moover-blue transition-all`}
                            />
                        </div>
                        {isRoundTrip && (
                            <div className="space-y-2 animate-fade-in">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('return')}</label>
                                <input 
                                    type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                                    className={`w-full bg-gray-50 dark:bg-zinc-800 dark:text-white p-3 rounded-xl font-bold text-sm outline-none border ${!returnDate ? 'border-gray-200 dark:border-zinc-700' : 'border-moover-blue/30'} focus:ring-2 focus:ring-moover-blue transition-all`}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 pt-2 animate-fade-in">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-moover-blue uppercase tracking-wider">Latest Drop-off Deadline</label>
                            <span className="bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded">CRITICAL</span>
                        </div>
                        <div className={`flex items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 focus-within:ring-2 focus-within:ring-moover-blue transition-all`}>
                            <Calendar className="w-5 h-5 text-moover-blue mr-3 shrink-0" />
                            <input 
                                type="date" value={deadlineDate} max={departureDate} onChange={(e) => setDeadlineDate(e.target.value)}
                                className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 px-1">
                            This is the last day you will accept packages. We recommend 24-48 hours before your flight to allow for packing.
                        </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800 animate-fade-in">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-moover-dark dark:text-white text-sm">Willing to buy items?</span>
                                <ShoppingBag className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">You buy, they reimburse cost + fee.</p>
                        </div>
                        <button
                            onClick={() => { HapticsService.impact('LIGHT'); setWillingToBuy(!willingToBuy); }}
                            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${willingToBuy ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`}
                        >
                            <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${willingToBuy ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800 animate-fade-in">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-moover-dark dark:text-white text-sm">Willing to pick up items?</span>
                                <Car className="w-4 h-4 text-purple-600" />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">You travel to them to collect the package.</p>
                        </div>
                        <button
                            onClick={() => { HapticsService.impact('LIGHT'); setWillingToPickup(!willingToPickup); }}
                            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${willingToPickup ? 'bg-purple-500' : 'bg-gray-300 dark:bg-zinc-600'}`}
                        >
                            <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${willingToPickup ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                </div>
            )}

            {/* STEP 2: CAPACITY */}
            {step === 2 && (
                <div className="space-y-8 animate-fade-in">
                    
                    {/* Unit Toggle */}
                    <div className="flex items-center justify-between px-2">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('select_capacity')}</span>
                        <div className="bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl flex items-center">
                            <button 
                                onClick={() => weightUnit !== 'KG' && toggleWeightUnit()}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${weightUnit === 'KG' ? 'bg-white dark:bg-zinc-700 shadow-sm text-moover-dark dark:text-white scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                KG
                            </button>
                            <button 
                                onClick={() => weightUnit !== 'LBS' && toggleWeightUnit()}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${weightUnit === 'LBS' ? 'bg-white dark:bg-zinc-700 shadow-sm text-moover-dark dark:text-white scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                LBS
                            </button>
                        </div>
                    </div>

                    {/* Presets (Disabled if Locked) */}
                    <div className={`grid grid-cols-2 gap-4 ${linkedRequest ? 'opacity-50 pointer-events-none' : ''}`}>
                        {[
                            { label: t('pouch'), weightVal: weightUnit === 'KG' ? 1 : 2, icon: ShoppingBag, desc: t('pouch_desc') },
                            { label: t('box'), weightVal: weightUnit === 'KG' ? 3 : 7, icon: Package, desc: t('box_desc') },
                            { label: t('half_suitcase'), weightVal: weightUnit === 'KG' ? 10 : 22, icon: Briefcase, desc: t('half_suitcase_desc') },
                            { label: t('full_luggage'), weightVal: weightUnit === 'KG' ? 23 : 50, icon: CheckCircle, desc: t('full_luggage_desc') },
                        ].map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => {
                                    setWeight(opt.weightVal);
                                    HapticsService.impact('LIGHT');
                                }}
                                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden active:scale-95 ${weight === opt.weightVal ? 'border-moover-blue bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                            >
                                <opt.icon className={`w-8 h-8 mb-3 ${weight === opt.weightVal ? 'text-moover-blue' : 'text-gray-400'}`} />
                                <div className="font-bold text-moover-dark dark:text-white">{opt.label}</div>
                                <div className="text-xs font-bold text-moover-blue mt-1">{opt.weightVal} {weightUnit.toLowerCase()}</div>
                                <div className="text-[10px] text-gray-400 mt-1">{opt.desc}</div>
                                
                                {weight === opt.weightVal && (
                                    <div className="absolute top-3 right-3 w-4 h-4 bg-moover-blue rounded-full flex items-center justify-center animate-fade-in">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Custom Capacity Slider (Disabled if Locked) */}
                    <div className={`bg-gray-50 dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 ${linkedRequest ? 'opacity-75 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                {linkedRequest ? <Lock className="w-4 h-4 text-orange-500" /> : <Scale className="w-4 h-4" />}
                                {linkedRequest ? "Capacity Locked" : t('custom_capacity')}
                            </span>
                            <span className="text-2xl font-bold text-moover-dark dark:text-white">
                                {weight} <span className="text-sm font-medium text-gray-400">{weightUnit.toLowerCase()}</span>
                            </span>
                        </div>
                        
                        <input 
                            type="range" 
                            min="1" 
                            max={weightUnit === 'KG' ? 50 : 110} 
                            step="1"
                            value={weight}
                            onChange={(e) => setWeight(parseInt(e.target.value))}
                            className="w-full h-4 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-moover-blue"
                        />
                        {linkedRequest ? (
                            <div className="text-xs text-orange-500 font-bold mt-4 text-center">
                                Weight is locked to the requested gig.
                            </div>
                        ) : (
                            <div className="flex justify-between text-xs font-bold text-gray-400 mt-4">
                                <span>1 {weightUnit.toLowerCase()}</span>
                                <span>{weightUnit === 'KG' ? '50 kg+' : '110 lbs+'}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 3: TRANSPORT MODE */}
            {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                    <p className="text-sm text-gray-500 mb-4 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700">
                        {t('transport_mode_desc')}
                    </p>
                    {[
                        { id: 'FLIGHT', label: t('flight'), icon: Plane },
                        { id: 'CAR', label: t('car'), icon: Car },
                        { id: 'TRAIN', label: t('train'), icon: Train },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => {
                                setTransportMode(mode.id as any);
                                HapticsService.impact('LIGHT');
                            }}
                            className={`w-full p-5 rounded-2xl border flex items-center gap-4 transition-all active:scale-95 ${transportMode === mode.id ? 'border-moover-blue bg-moover-blue text-white shadow-lg shadow-blue-500/30' : 'border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                        >
                            <mode.icon className="w-6 h-6" />
                            <span className="font-bold text-lg">{mode.label}</span>
                            {transportMode === mode.id && <CheckCircle className="ml-auto w-6 h-6 animate-fade-in" />}
                        </button>
                    ))}
                </div>
            )}

            {/* STEP 4: PRICING */}
            {step === 4 && (
                <div className="space-y-8 animate-fade-in pt-4">
                    <div className="text-center">
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{t('estimated_earnings')}</div>
                        <div className="text-5xl font-bold text-moover-dark dark:text-white tracking-tight">
                            ${estimatedEarnings}
                        </div>
                        <div className="text-sm text-gray-500 mt-2 font-medium">
                            Based on {weight} {weightUnit.toLowerCase()} capacity
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> {t('price_per')} {weightUnit}
                            </span>
                            <span className="text-2xl font-bold text-moover-blue">${pricePerUnit}</span>
                        </div>
                        
                        <input 
                            type="range" min={weightUnit === 'KG' ? 5 : 2} max={weightUnit === 'KG' ? 60 : 30} step="1" value={pricePerUnit} onChange={(e) => setPricePerUnit(parseInt(e.target.value))}
                            className="w-full h-4 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-moover-blue"
                        />
                        <div className="flex justify-between text-xs font-bold text-gray-400 mt-4">
                            <span>${weightUnit === 'KG' ? 5 : 2} (Cheap)</span>
                            <span>${weightUnit === 'KG' ? 60 : 30} (Premium)</span>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl text-xs text-blue-800 dark:text-blue-200 leading-relaxed border border-blue-100 dark:border-blue-800">
                        <strong>{t('pro_tip')}:</strong> {t('pro_tip_desc')}
                    </div>
                </div>
            )}

            {/* STEP 5: REVIEW */}
            {step === 5 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-3xl p-6 border border-gray-100 dark:border-zinc-700 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-moover-blue" />
                        
                        <div className="flex justify-between items-start mb-6 pt-2">
                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('from')}</div>
                                <div className="text-xl font-bold text-moover-dark dark:text-white leading-tight">{origin}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('to')}</div>
                                <div className="text-xl font-bold text-moover-dark dark:text-white leading-tight">{destination}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-moover-dark dark:text-white">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-gray-400">{t('departure')}</div>
                                <div className="text-sm font-bold text-moover-dark dark:text-white">{departureDate}</div>
                            </div>
                            {deadlineDate && (
                                <div className="flex-1 border-l border-gray-100 dark:border-zinc-800 pl-3">
                                    <div className="text-xs font-bold text-moover-blue">Deadline</div>
                                    <div className="text-sm font-bold text-moover-dark dark:text-white">{deadlineDate}</div>
                                </div>
                            )}
                        </div>

                        {willingToBuy && (
                            <div className="flex items-center gap-2 mb-2 bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400 font-bold text-xs">
                                <ShoppingBag className="w-4 h-4" />
                                Accepting Buy & Ship Requests
                            </div>
                        )}

                        {willingToPickup && (
                            <div className="flex items-center gap-2 mb-6 bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-400 font-bold text-xs">
                                <Car className="w-4 h-4" />
                                Willing to Pick Up Items
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                                <div className="text-xs font-bold text-gray-400 mb-1">Capacity</div>
                                <div className="text-base font-bold text-moover-dark dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-moover-blue" />
                                    {weight}{weightUnit.toLowerCase()}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                                <div className="text-xs font-bold text-gray-400 mb-1">Earnings</div>
                                <div className="text-base font-bold text-green-600 flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    ~${estimatedEarnings}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/50">
                        <CheckCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                        <div className="text-xs text-yellow-800 dark:text-yellow-200">
                            {t('agree_terms')}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-auto shrink-0 relative">
            
            {showLoginWarning && (
                <div className="absolute bottom-20 left-4 right-4 bg-red-500 text-white p-3 rounded-xl text-center text-sm font-bold animate-fade-in shadow-xl z-50 flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Please log in to publish a trip!
                </div>
            )}

            {step < 5 ? (
                <button 
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 ${isStepValid() ? 'bg-moover-blue opacity-100' : 'bg-gray-300 dark:bg-zinc-700 shadow-none cursor-not-allowed opacity-50'}`}
                >
                    {t('next_step')} <ChevronRight className="w-5 h-5" />
                </button>
            ) : (
                <button 
                    onClick={handlePublish}
                    className="w-full py-4 rounded-2xl font-bold text-white bg-moover-dark dark:bg-white dark:text-moover-dark shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {linkedRequest ? "Accept & Create Trip" : t('publish_trip')}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};