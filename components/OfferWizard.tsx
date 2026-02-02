import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Package, CreditCard, Calendar, Truck, AlertCircle, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HapticsService } from '../services/capacitorService';
import { Trip } from '../types';

interface OfferWizardProps {
  trip: Trip;
  onClose: () => void;
}

// NOTICE: It must be 'export const', NOT 'export default'
export const OfferWizard: React.FC<OfferWizardProps> = ({ trip, onClose }) => {
  const [step, setStep] = useState(1);

  // --- LOGIC: Two Paths ---
  const [mode, setMode] = useState<'BUY_FOR_ME' | 'SHIP_TO_YOU' | null>(null);

  // Form State
  const [itemName, setItemName] = useState('');
  const [itemValue, setItemValue] = useState('');
  const [offerPrice, setOfferPrice] = useState(''); 
  const [arrivalDeadline, setArrivalDeadline] = useState(''); 
  const [allowCounter, setAllowCounter] = useState(true); 

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
    console.log("Offer Sent:", { tripId: trip.id, mode, item: itemName, offer: offerPrice });
    onClose();
    // In a real app, this would show a Toast notification
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
        
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] p-6 relative z-10 animate-slide-up pb-safe-bottom shadow-2xl h-[80vh] flex flex-col">
            
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
                    {step === 3 && "Make Your Offer"}
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
                        
                        {mode === 'BUY_FOR_ME' && (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 flex gap-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <div>
                                    <strong>Process:</strong> Traveler buys item → You verify receipt → Funds released.
                                </div>
                            </div>
                        )}

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

                        {mode === 'BUY_FOR_ME' && (
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Cost (Reimbursement)</label>
                                <div className="flex items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-moover-blue transition-all">
                                    <span className="text-gray-400 mr-1 font-bold">$</span>
                                    <input 
                                        type="number" 
                                        value={itemValue} 
                                        onChange={(e) => setItemValue(e.target.value)}
                                        placeholder="0.00"
                                        className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {mode === 'SHIP_TO_YOU' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Must Arrive By</label>
                                <div className="flex items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-moover-blue transition-all">
                                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                                    <input 
                                        type="date" 
                                        value={arrivalDeadline} 
                                        onChange={(e) => setArrivalDeadline(e.target.value)}
                                        className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: THE OFFER */}
                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center py-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Your Reward Offer</h3>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-3xl text-moover-dark dark:text-white font-bold">$</span>
                                <input 
                                    type="number" 
                                    value={offerPrice}
                                    onChange={(e) => setOfferPrice(e.target.value)}
                                    placeholder="50"
                                    className="text-5xl font-bold text-moover-blue bg-transparent w-32 text-center outline-none placeholder:text-blue-200"
                                />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Suggested: ${Math.round(trip.price_per_kg * 2)}</p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-zinc-700 rounded-full text-moover-blue">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-moover-dark dark:text-white text-sm">Allow Counter Offers</div>
                                    <div className="text-xs text-gray-400">Traveler can propose a different price</div>
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
                        disabled={step === 1 && !mode || step === 2 && !itemName}
                        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all ${step === 1 && !mode || step === 2 && !itemName ? 'bg-gray-300 cursor-not-allowed' : 'bg-moover-blue'}`}
                    >
                        Next Step
                    </button>
                ) : (
                    <button 
                        onClick={handleSendOffer}
                        disabled={!offerPrice}
                        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${!offerPrice ? 'bg-gray-300 cursor-not-allowed' : 'bg-moover-dark dark:bg-white dark:text-moover-dark'}`}
                    >
                        Send Offer <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};