import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Package, ShoppingBag, Truck, Calendar, DollarSign, CheckCircle, AlertTriangle, Scale, Camera, Info, MessageSquare, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Trip } from '../types';
import { useStore } from '../store';
import { HapticsService } from '../services/capacitorService';

interface OfferWizardProps {
  trip: Trip;
  onClose: () => void;
}

export const OfferWizard: React.FC<OfferWizardProps> = ({ trip, onClose }) => {
  const { t } = useTranslation();
  const { preferences } = useStore(); 
  const isImperial = preferences.unitSystem === 'IMPERIAL';
  const [step, setStep] = useState(1);

  // --- LOGISTICS STATE ---
  const [requestType, setRequestType] = useState<'SHIP' | 'BUY' | 'PICKUP' | null>(null);

  // --- ITEM STATE ---
  const [itemName, setItemName] = useState('');
  const [weightKg, setWeightKg] = useState(1); // Internal KG
  const [itemValue, setItemValue] = useState(''); // Value/Cost
  
  // --- OFFER STATE ---
  const [offerPrice, setOfferPrice] = useState<number>(25); 
  const [allowCounter, setAllowCounter] = useState(true);

  // --- HELPERS ---
  const displayWeight = isImperial ? (weightKg * 2.20462).toFixed(1) : weightKg.toFixed(1);
  const displayUnit = isImperial ? 'lbs' : 'kg';
  const travelerRate = isImperial ? (trip.price_per_kg / 2.20462) : trip.price_per_kg;
  const maxWeight = trip.available_weight_kg;

  // Auto-Calculate initial offer based on weight
  useEffect(() => {
    const basePrice = Math.round(weightKg * trip.price_per_kg);
    setOfferPrice(Math.max(10, basePrice));
  }, [weightKg, trip.price_per_kg]);

  // Price Comparison Logic
  const getPriceComparison = () => {
      const currentRate = offerPrice / weightKg; // Price per KG
      const targetRate = trip.price_per_kg;
      
      const diff = ((currentRate - targetRate) / targetRate) * 100;

      if (Math.abs(diff) < 5) return { text: "Matches Traveler's Rate", color: "text-green-600 bg-green-100" };
      if (diff > 0) return { text: `${Math.round(diff)}% Above Asking Rate`, color: "text-blue-600 bg-blue-100" };
      return { text: `${Math.round(Math.abs(diff))}% Below Asking Rate`, color: "text-orange-600 bg-orange-100" };
  };

  const handleNext = () => {
    HapticsService.impact('LIGHT');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    HapticsService.impact('LIGHT');
    setStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    HapticsService.notification('SUCCESS');
    onClose();
  };

  const renderProgressBar = () => (
    <div className="flex gap-1 mb-6">
        {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-moover-blue' : 'bg-gray-200 dark:bg-zinc-700'}`} />
        ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] p-6 relative z-10 animate-slide-up pb-safe-bottom shadow-2xl h-[85vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6 shrink-0" />
        <div className="flex items-center justify-between mb-4 shrink-0">
            {step > 1 ? (
                <button onClick={handleBack} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 active:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
            ) : <div className="w-9" />}
            
            <h2 className="text-xl font-bold text-moover-dark dark:text-white">
                {step === 1 && "Choose Request Type"}
                {step === 2 && "Item Details"}
                {step === 3 && "Propose Price"}
            </h2>
            
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700">
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>

        {renderProgressBar()}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-1 py-2 no-scrollbar">
            
            {/* STEP 1: REQUEST TYPE */}
            {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                    <p className="text-sm text-gray-500 mb-2">How can {trip.traveler_name} help you?</p>
                    
                    {/* OPTION A: SHIP (Always Available) */}
                    <button 
                        onClick={() => { setRequestType('SHIP'); handleNext(); }}
                        className={`w-full p-5 rounded-2xl border flex items-start gap-4 transition-all active:scale-95 group text-left ${requestType === 'SHIP' ? 'border-moover-blue bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'}`}
                    >
                        <div className={`p-3 rounded-xl ${requestType === 'SHIP' ? 'bg-moover-blue text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-zinc-600 transition-colors'}`}>
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="font-bold text-moover-dark dark:text-white text-lg">Ship to Traveler</div>
                            <div className="text-sm text-gray-500 mt-1">You send the item to them.</div>
                        </div>
                    </button>

                    {/* OPTION B: BUY (Conditional) */}
                    <button 
                        onClick={() => { if(trip.willing_to_buy) { setRequestType('BUY'); handleNext(); } }}
                        disabled={!trip.willing_to_buy}
                        className={`w-full p-5 rounded-2xl border flex items-start gap-4 transition-all active:scale-95 group text-left ${!trip.willing_to_buy ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-zinc-800' : requestType === 'BUY' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'}`}
                    >
                        <div className={`p-3 rounded-xl ${requestType === 'BUY' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-400 group-hover:bg-green-100 transition-colors'}`}>
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="font-bold text-moover-dark dark:text-white text-lg">Buy & Reimburse</div>
                            <div className="text-sm text-gray-500 mt-1">
                                {trip.willing_to_buy ? "They buy, you reimburse." : "Traveler is not willing to buy."}
                            </div>
                        </div>
                    </button>

                    {/* OPTION C: PICKUP (Conditional) */}
                    <button 
                        onClick={() => { if(trip.willing_to_pickup) { setRequestType('PICKUP'); handleNext(); } }}
                        disabled={!trip.willing_to_pickup}
                        className={`w-full p-5 rounded-2xl border flex items-start gap-4 transition-all active:scale-95 group text-left ${!trip.willing_to_pickup ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-zinc-800' : requestType === 'PICKUP' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'}`}
                    >
                        <div className={`p-3 rounded-xl ${requestType === 'PICKUP' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-400 group-hover:bg-purple-100 transition-colors'}`}>
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="font-bold text-moover-dark dark:text-white text-lg">Traveler Picks Up</div>
                            <div className="text-sm text-gray-500 mt-1">
                                {trip.willing_to_pickup ? "They collect it locally." : "Traveler is not willing to pickup."}
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* STEP 2: ITEM DETAILS */}
            {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Item Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Name</label>
                        <div className="flex items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-moover-blue transition-all">
                            <Package className="w-5 h-5 text-gray-400 mr-3" />
                            <input 
                                type="text" 
                                value={itemName} 
                                onChange={(e) => setItemName(e.target.value)} 
                                placeholder="e.g. Laptop, Documents" 
                                className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* Weight Slider */}
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
                                max={maxWeight} 
                                step="0.5"
                                value={weightKg}
                                onChange={(e) => { HapticsService.impact('LIGHT'); setWeightKg(parseFloat(e.target.value)); }}
                                className="w-full h-3 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-moover-blue touch-none"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-3 uppercase tracking-wider">
                                <span>Light</span>
                                <span>Max Capacity: {isImperial ? (maxWeight * 2.2).toFixed(1) : maxWeight} {displayUnit}</span>
                            </div>
                        </div>
                    </div>

                    {/* COST REIMBURSEMENT (Only for Buy Mode) */}
                    {requestType === 'BUY' && (
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Cost (Reimbursement)</label>
                            <div className="flex items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-moover-blue transition-all">
                                <span className="text-gray-400 mr-1 font-bold">$</span>
                                <input 
                                    type="number"
                                    value={itemValue} 
                                    onChange={(e) => setItemValue(e.target.value)} 
                                    placeholder="0.00" 
                                    className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 px-1">
                                <Info className="w-3 h-3" />
                                You will pay this + the shipping fee.
                            </div>
                        </div>
                    )}

                    {/* Regular Value (For Insurance) - Only if NOT buying */}
                    {requestType !== 'BUY' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Value (For Insurance)</label>
                            <div className="flex items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-moover-blue transition-all">
                                <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                                <input 
                                    type="number"
                                    value={itemValue} 
                                    onChange={(e) => setItemValue(e.target.value)} 
                                    placeholder="100" 
                                    className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className="border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer active:bg-gray-50 dark:active:bg-zinc-800 transition-colors">
                        <Camera className="w-8 h-8" />
                        <span className="text-xs font-bold">Add Photo (Optional)</span>
                    </div>
                </div>
            )}

            {/* STEP 3: THE PROPOSAL */}
            {step === 3 && (
                <div className="space-y-8 animate-fade-in pt-4">
                    
                    <div className="text-center">
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Your Shipping Offer</div>
                        <div className="text-5xl font-bold text-green-600 tracking-tight flex justify-center items-center gap-1">
                            ${offerPrice}
                        </div>
                        
                        {/* PRICE COMPARISON BADGE */}
                        <div className={`text-xs font-bold rounded-full px-3 py-1 inline-block mt-3 ${getPriceComparison().color}`}>
                            {getPriceComparison().text}
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Adjust Price
                            </span>
                        </div>
                        
                        <input 
                            type="range" 
                            min={Math.max(10, Math.round(weightKg * trip.price_per_kg * 0.5))} 
                            max={Math.round(weightKg * trip.price_per_kg * 3.0)} 
                            step={5}
                            value={offerPrice}
                            onChange={(e) => { HapticsService.impact('LIGHT'); setOfferPrice(parseInt(e.target.value)); }}
                            className="w-full h-4 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="flex justify-between text-xs font-bold text-gray-400 mt-4">
                            <span>Min</span>
                            <span>Max</span>
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
        <div className="pt-4 mt-auto shrink-0 relative">
            {step < 3 ? (
                <button 
                    onClick={handleNext}
                    disabled={step === 1 && !requestType || step === 2 && (!itemName)}
                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 ${step === 1 && !requestType || step === 2 && (!itemName) ? 'bg-gray-300 dark:bg-zinc-700 shadow-none cursor-not-allowed' : 'bg-moover-blue'}`}
                >
                    Next Step <ChevronRight className="w-5 h-5" />
                </button>
            ) : (
                <button 
                    onClick={handleSubmit} 
                    className="w-full py-4 rounded-2xl font-bold text-white bg-green-500 shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    Send Offer <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </div>

      </div>
    </div>
  );
};