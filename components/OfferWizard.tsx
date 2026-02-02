import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Package, CreditCard, Calendar, Truck, AlertCircle, MessageSquare, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HapticsService } from '../services/capacitorService';
import { Trip } from '../types';
import { useStore } from '../store';

interface OfferWizardProps {
  trip: Trip;
  onClose: () => void;
}

export const OfferWizard: React.FC<OfferWizardProps> = ({ trip, onClose }) => {
  const { preferences } = useStore(); // <--- GET USER PREFERENCES (METRIC/IMPERIAL)
  const isImperial = preferences.unitSystem === 'IMPERIAL';

  const [step, setStep] = useState(1);

  // --- LOGIC: Two Paths ---
  const [mode, setMode] = useState<'BUY_FOR_ME' | 'SHIP_TO_YOU' | null>(null);

  // Form State
  const [itemName, setItemName] = useState('');
  
  // Weight is always stored internally as KG for consistency, but displayed based on pref
  const [weightKg, setWeightKg] = useState(1); 
  
  const [itemValue, setItemValue] = useState('');
  
  // Offer State
  const [offerPrice, setOfferPrice] = useState<number>(0); 
  const [allowCounter, setAllowCounter] = useState(true); 

  // --- CONVERSION HELPERS ---
  const displayWeight = isImperial ? (weightKg * 2.20462).toFixed(1) : weightKg.toFixed(1);
  const displayUnit = isImperial ? 'lbs' : 'kg';
  const displayRate = isImperial ? (trip.price_per_kg / 2.20462).toFixed(2) : trip.price_per_kg;

  // Auto-Calculate Default Offer based on Traveler's Rate
  useEffect(() => {
    // Base calculation is always weight(kg) * price(kg)
    const basePrice = Math.round(weightKg * trip.price_per_kg);
    setOfferPrice(basePrice);
  }, [weightKg, trip.price_per_kg]);

  const handleNext = () => {
    HapticsService.impact('LIGHT');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    HapticsService.impact('LIGHT');
    setStep(prev => prev - 1);
  };

  const handleSendOffer = () => {
    HapticsService.notification('SUCCESS');
    console.log("Proposal Sent:", { 
        tripId: trip.id, 
        mode, 
        item: itemName, 
        weightKg,
        offer: offerPrice,
        status: 'PENDING_TRAVELER_APPROVAL'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
        
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] p-6 relative z-10 animate-slide-up pb-safe-bottom shadow-2xl h-[80vh] flex flex-col">
            
            {/* Global Styles for removing spinners on this component */}
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>

            {/* Header */}
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6 shrink-0" />
            <div className="flex items-center justify-between mb-6">
                 {step > 1 ? (
                    <button onClick={handleBack} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full">
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                 ) : <div className="w-9" />}
                 
                 <h2 className="text-lg font-bold text-moover-dark dark:text-white">
                    {step === 1 && "Choose Request Type"}
                    {step === 2 && "Item Details"}
                    {step === 3 && "Propose Price"}
                 </h2>

                 <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto px-1 no-scrollbar">

                {/* STEP 1: CHOOSE MODE */}
                {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <button
                            onClick={() => { setMode('BUY_FOR_ME'); handleNext(); }}
                            className="w-full p-5 rounded-2xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-95 transition-all text-left group"
                        >
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-moover-blue group-hover:bg-blue-100 transition-colors">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-moover-dark dark:text-white text-lg">Buy & Reimburse</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Traveler buys the item. You reimburse + fee upon delivery.
                                </p>
                            </div>
                        </button>

                        <button
                            onClick={() => { setMode('SHIP_TO_YOU'); handleNext(); }}
                            className="w-full p-5 rounded-2xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-95 transition-all text-left group"
                        >
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500 group-hover:bg-orange-100 transition-colors">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-moover-dark dark:text-white text-lg">Ship to Traveler</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    You ship the item to the Traveler. They pack it and fly.
                                </p>
                            </div>
                        </button>
                    </div>
                )}

                {/* STEP 2: ITEM DETAILS */}
                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        
                        {/* Delivery Constraint (READ ONLY) */}
                        <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 flex items-center gap-3 opacity-80">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Arrives By (Traveler Schedule)</div>
                                <div className="font-bold text-moover-dark dark:text-white">
                                    {trip.return_date || trip.outbound_date}
                                </div>
                            </div>
                        </div>

                        {/* Item Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Name</label>
                            <div className="flex items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-moover-blue transition-all">
                                <Package className="w-5 h-5 text-gray-400 mr-3" />
                                <input 
                                    type="text" 
                                    value={itemName} 
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder="e.g. iPhone 16 Pro Max"
                                    className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                                />
                            </div>
                        </div>

                        {/* Weight Slider (FIXED: Slider + Store Logic) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end px-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Weight</label>
                                <div className="text-xl font-bold text-moover-blue">
                                    {displayWeight} <span className="text-sm font-medium text-gray-500">{displayUnit}</span>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-xl border border-gray-200 dark:border-zinc-700">
                                <input 
                                    type="range"
                                    min="0.5"
                                    max="25" // Max 25kg / ~55lbs
                                    step="0.5"
                                    value={weightKg} 
                                    onChange={(e) => {
                                        HapticsService.impact('LIGHT');
                                        setWeightKg(parseFloat(e.target.value));
                                    }}
                                    className="w-full h-3 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-moover-blue touch-none"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-3 uppercase tracking-wider">
                                    <span>Light ({isImperial ? '1 lb' : '0.5 kg'})</span>
                                    <span>Heavy ({isImperial ? '55 lbs' : '25 kg'})</span>
                                </div>
                            </div>
                        </div>

                        {/* Item Value (FIXED: No Spinners) */}
                        {mode === 'BUY_FOR_ME' && (
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Cost (Reimbursement)</label>
                                <div className="flex items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-moover-blue transition-all">
                                    <span className="text-gray-400 mr-1 font-bold">$</span>
                                    <input 
                                        type="number"
                                        inputMode="decimal"
                                        value={itemValue} 
                                        onChange={(e) => setItemValue(e.target.value)}
                                        placeholder="0.00"
                                        className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: THE PROPOSAL */}
                {step === 3 && (
                    <div className="space-y-8 animate-fade-in">
                        
                        <div className="text-center py-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Propose Price</h3>
                            
                            {/* LARGE PRICE DISPLAY */}
                            <div className="flex items-start justify-center gap-1 mb-2">
                                <span className="text-4xl text-moover-dark dark:text-white font-bold mt-2">$</span>
                                <span className="text-8xl font-bold text-moover-blue tracking-tighter">
                                    {offerPrice}
                                </span>
                            </div>
                            
                            {/* Per Unit Calculation Display (Dynamic Unit) */}
                            <div className={`text-sm font-bold rounded-full px-3 py-1 inline-block ${
                                offerPrice / weightKg < trip.price_per_kg 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                                {/* Calculate display rate based on unit system */}
                                ${isImperial 
                                    ? (offerPrice / (weightKg * 2.20462)).toFixed(2) 
                                    : (offerPrice / weightKg).toFixed(2)
                                } / {displayUnit}
                            </div>

                            {/* SLIDER CONTROLS */}
                            <div className="px-4 mt-8">
                                <input 
                                    type="range" 
                                    min={Math.round(weightKg * trip.price_per_kg * 0.5)} // Min 50% of asking
                                    max={Math.round(weightKg * trip.price_per_kg * 2.0)} // Max 200% of asking
                                    step={1}
                                    value={offerPrice}
                                    onChange={(e) => {
                                        HapticsService.impact('LIGHT');
                                        setOfferPrice(parseInt(e.target.value));
                                    }}
                                    className="w-full h-3 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-moover-blue touch-none"
                                />
                                <div className="flex justify-between text-xs text-gray-400 font-bold mt-4 uppercase tracking-wider">
                                    <span>Lower</span>
                                    <span>Traveler Rate: ${displayRate}/{displayUnit}</span>
                                    <span>Higher</span>
                                </div>
                            </div>
                        </div>

                        {/* Counter Offer Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-zinc-700 rounded-full text-moover-blue">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-moover-dark dark:text-white text-sm">Allow Counter Offers</div>
                                    <div className="text-xs text-gray-400">Traveler can negotiate</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setAllowCounter(!allowCounter)}
                                className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${allowCounter ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`}
                            >
                                <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${allowCounter ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="pt-4 mt-auto shrink-0">
                {step < 3 ? (
                     <button 
                        onClick={handleNext}
                        disabled={step === 1 && !mode || step === 2 && (!itemName || !weightKg)}
                        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all ${step === 1 && !mode || step === 2 && (!itemName || !weightKg) ? 'bg-gray-300 cursor-not-allowed' : 'bg-moover-blue'}`}
                    >
                        Next Step
                    </button>
                ) : (
                    <button 
                        onClick={handleSendOffer}
                        className="w-full py-4 rounded-2xl font-bold text-white shadow-lg bg-moover-dark dark:bg-white dark:text-moover-dark active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Send Proposal <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};