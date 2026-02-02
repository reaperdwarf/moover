import React, { useState } from 'react';
import { X, MapPin, Clock, Camera, ShieldAlert, CheckCircle, Navigation, Lock, Star, MessageSquare, FileText, Edit3, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HapticsService } from '../services/capacitorService';

// --- TYPES ---
// NEW: Added 'MANIFEST' stage
type DeliveryStage = 'SCHEDULING' | 'MANIFEST' | 'INSPECTION' | 'IN_TRANSIT' | 'HANDSHAKE' | 'RATING' | 'COMPLETED';
type UserRole = 'TRAVELER' | 'RECEIVER';

interface DeliveryCoordinationSheetProps {
  onClose: () => void;
  tripId: string;
}

export const DeliveryCoordinationSheet: React.FC<DeliveryCoordinationSheetProps> = ({ onClose, tripId }) => {
  const { t } = useTranslation();
  
  // --- STATE MACHINE ---
  const [stage, setStage] = useState<DeliveryStage>('SCHEDULING');
  const [activeRole, setActiveRole] = useState<UserRole>('RECEIVER'); 

  // Scheduling State
  const [meetTime, setMeetTime] = useState('14:00');
  const [meetDate, setMeetDate] = useState('2026-02-15');
  const [meetLocation, setMeetLocation] = useState('Central Station, Main Entrance');
  const [duration, setDuration] = useState(15); // Replaced Slider with Buttons
  
  // Manifest State (NEW)
  const [manifestText, setManifestText] = useState('');

  // Inspection State
  const [photoTaken, setPhotoTaken] = useState(false);
  
  // Handshake State
  const [secretPin] = useState('8492'); 
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Rating State
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  // --- ACTIONS ---

  const handleConfirmSchedule = () => {
    HapticsService.impact('HEAVY');
    setStage('MANIFEST'); // Move to Manifest first
  };

  const handleSubmitManifest = () => {
    if (!manifestText.trim()) return;
    HapticsService.impact('MEDIUM');
    setStage('INSPECTION'); // Move to Inspection after declaration
  };

  const handleTakePhoto = () => {
    HapticsService.impact('MEDIUM');
    setTimeout(() => {
        setPhotoTaken(true);
        HapticsService.notification('SUCCESS');
    }, 1000);
  };

  const handleConfirmPickup = () => {
     if (!photoTaken) return;
     HapticsService.impact('HEAVY');
     setStage('IN_TRANSIT');
  };

  const handleArrived = () => {
    HapticsService.notification('SUCCESS');
    setStage('HANDSHAKE');
  };

  const handlePinEntry = (num: string) => {
    HapticsService.impact('LIGHT');
    if (enteredPin.length < 4) {
        setEnteredPin(prev => prev + num);
        setPinError(false);
    }
  };

  const handleDeletePin = () => {
    HapticsService.impact('LIGHT');
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleSubmitPin = () => {
    if (enteredPin === secretPin) {
        HapticsService.notification('SUCCESS');
        setStage('RATING');
    } else {
        HapticsService.notification('ERROR');
        setPinError(true);
        setEnteredPin('');
    }
  };

  const handleSubmitRating = () => {
    HapticsService.impact('MEDIUM');
    setStage('COMPLETED');
  };

  // --- RENDER HELPERS ---

  const renderRoleToggle = () => (
    <div className="flex justify-center mb-4">
        <div className="bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg flex gap-1">
            <button 
                onClick={() => setActiveRole('RECEIVER')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeRole === 'RECEIVER' ? 'bg-white dark:bg-zinc-700 shadow-sm text-moover-dark dark:text-white' : 'text-gray-400'}`}
            >
                Role: Booker (Sender)
            </button>
            <button 
                onClick={() => setActiveRole('TRAVELER')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeRole === 'TRAVELER' ? 'bg-white dark:bg-zinc-700 shadow-sm text-moover-dark dark:text-white' : 'text-gray-400'}`}
            >
                Role: Traveler
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
        
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] relative z-10 animate-slide-up shadow-2xl h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-6 pt-6 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-moover-dark dark:text-white">Delivery Dashboard</h2>
                        <div className="text-sm text-gray-400 font-medium">Order #TR-{tripId.slice(0,6)}</div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Dev Mode Toggle */}
            {stage !== 'COMPLETED' && renderRoleToggle()}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">

                {/* --- STAGE 1: SCHEDULING --- */}
                {stage === 'SCHEDULING' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3">
                            <Clock className="w-6 h-6 text-blue-600 shrink-0" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Step 1:</strong> Confirm the meeting time and location for the handoff.
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</label>
                                <div className="flex gap-3 mt-2">
                                    <div className="flex-1 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3 border border-gray-100 dark:border-zinc-700">
                                        <Clock className="w-5 h-5 text-gray-400" />
                                        <input 
                                            type="time" 
                                            value={meetTime} 
                                            onChange={(e) => setMeetTime(e.target.value)}
                                            className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                                        />
                                    </div>
                                    <div className="flex-1 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3 border border-gray-100 dark:border-zinc-700">
                                        <input 
                                            type="date" 
                                            value={meetDate} 
                                            onChange={(e) => setMeetDate(e.target.value)}
                                            className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* NEW: Button Group for Duration (Replaces Slider) */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Duration</label>
                                <div className="flex gap-2 mt-2">
                                    {[15, 30, 45, 60].map((mins) => (
                                        <button
                                            key={mins}
                                            onClick={() => {
                                                HapticsService.impact('LIGHT');
                                                setDuration(mins);
                                            }}
                                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${duration === mins ? 'bg-moover-blue text-white border-moover-blue shadow-md' : 'bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-zinc-700'}`}
                                        >
                                            {mins}m
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Meeting Point</label>
                                <div className="mt-2 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3 border border-gray-100 dark:border-zinc-700">
                                    <MapPin className="w-5 h-5 text-moover-blue" />
                                    <input 
                                        type="text" 
                                        value={meetLocation} 
                                        onChange={(e) => setMeetLocation(e.target.value)}
                                        className="bg-transparent w-full font-bold text-moover-dark dark:text-white outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STAGE 2: MANIFEST DECLARATION (NEW) --- */}
                {stage === 'MANIFEST' && (
                    <div className="space-y-6 animate-fade-in">
                        {activeRole === 'RECEIVER' ? (
                            // Booker View: Enter Data
                            <>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-3xl border border-yellow-100 dark:border-yellow-900/50">
                                    <div className="flex items-start gap-3 mb-3">
                                        <FileText className="w-8 h-8 text-yellow-600 shrink-0" />
                                        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 text-lg">Declaration Required</h3>
                                    </div>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                                        You must explicitly declare exactly what you are handing over. This statement is legally binding.
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Description</label>
                                    <textarea 
                                        value={manifestText}
                                        onChange={(e) => setManifestText(e.target.value)}
                                        placeholder="e.g. Red Nike Shoebox containing Size 10 Jordan 1s. Seal is intact."
                                        className="w-full h-32 mt-2 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl font-medium text-moover-dark dark:text-white outline-none border focus:border-moover-blue focus:ring-1 focus:ring-moover-blue transition-all"
                                    />
                                </div>
                            </>
                        ) : (
                            // Traveler View: Waiting
                            <div className="text-center py-10 opacity-50">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <Edit3 className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="font-bold text-lg text-moover-dark dark:text-white">Waiting for Declaration...</h3>
                                <p className="text-gray-500 mt-2 max-w-xs mx-auto">The sender is currently writing the official item manifest.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- STAGE 3: INSPECTION (UPDATED) --- */}
                {stage === 'INSPECTION' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Display the Manifest for Verification */}
                        <div className="bg-white dark:bg-zinc-800 p-5 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sender Declared:</div>
                            <p className="font-serif italic text-lg text-moover-dark dark:text-white leading-relaxed">
                                "{manifestText}"
                            </p>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-3xl border border-red-100 dark:border-red-900/50">
                            <div className="flex items-start gap-3 mb-3">
                                <ShieldAlert className="w-8 h-8 text-red-600 shrink-0" />
                                <h3 className="font-bold text-red-800 dark:text-red-200 text-lg">Verify Contents</h3>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                                Does the item match the description above? <strong>Do not proceed</strong> if there are discrepancies. Open the package and inspect.
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 text-center">
                            {!photoTaken ? (
                                <>
                                    <button 
                                        onClick={handleTakePhoto}
                                        className="w-full py-4 bg-moover-dark dark:bg-white text-white dark:text-moover-dark font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                    >
                                        <Camera className="w-5 h-5" /> Photograph Contents
                                    </button>
                                </>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="relative w-full h-48 bg-gray-200 dark:bg-zinc-700 rounded-2xl overflow-hidden mb-4">
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold">
                                            [PHOTO CAPTURED]
                                        </div>
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> VERIFIED
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setPhotoTaken(false)}
                                        className="text-xs text-gray-400 underline"
                                    >
                                        Retake Photo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- STAGE 4: IN TRANSIT --- */}
                {stage === 'IN_TRANSIT' && (
                    <div className="space-y-6 animate-fade-in text-center pt-8">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-moover-dark dark:text-white">Item Secured</h3>
                        <p className="text-gray-500">You have officially picked up the item. Proceed to destination.</p>
                        
                        <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 text-left mt-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white dark:bg-zinc-700 rounded-full shadow-sm">
                                    <Navigation className="w-6 h-6 text-moover-blue" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Destination</div>
                                    <div className="font-bold text-moover-dark dark:text-white text-lg">London Heathrow, Terminal 5</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STAGE 5: HANDSHAKE --- */}
                {stage === 'HANDSHAKE' && (
                    <div className="space-y-6 animate-fade-in">
                        {activeRole === 'RECEIVER' ? (
                            <div className="text-center pt-6">
                                <h3 className="text-lg font-bold text-moover-dark dark:text-white mb-2">Receive Your Package</h3>
                                <p className="text-sm text-gray-500 mb-8">
                                    Provide this 4-digit PIN to the traveler to confirm you have received the item.
                                </p>
                                
                                <div className="bg-gray-100 dark:bg-zinc-800 p-8 rounded-3xl inline-block border-2 border-dashed border-gray-300 dark:border-zinc-600">
                                    <div className="text-6xl font-mono font-bold text-moover-dark dark:text-white tracking-[1rem]">
                                        {secretPin}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center pt-2">
                                <h3 className="text-lg font-bold text-moover-dark dark:text-white mb-6">Enter Receiver PIN</h3>
                                <div className="flex justify-center gap-4 mb-8">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className={`w-4 h-4 rounded-full transition-all ${enteredPin.length > i ? 'bg-moover-blue scale-110' : 'bg-gray-200 dark:bg-zinc-700'}`} />
                                    ))}
                                </div>
                                {pinError && <div className="text-red-500 font-bold mb-4 animate-shake">Incorrect PIN. Try again.</div>}
                                <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <button key={num} onClick={() => handlePinEntry(num.toString())} className="h-16 rounded-2xl bg-gray-50 dark:bg-zinc-800 text-2xl font-bold text-moover-dark dark:text-white active:bg-gray-200 dark:active:bg-zinc-700 transition-colors">{num}</button>
                                    ))}
                                    <div /> 
                                    <button onClick={() => handlePinEntry('0')} className="h-16 rounded-2xl bg-gray-50 dark:bg-zinc-800 text-2xl font-bold text-moover-dark dark:text-white active:bg-gray-200 dark:active:bg-zinc-700 transition-colors">0</button>
                                    <button onClick={handleDeletePin} className="h-16 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-moover-dark dark:text-white active:bg-gray-200 dark:active:bg-zinc-700 transition-colors"><X className="w-6 h-6" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- STAGE 6: RATING --- */}
                {stage === 'RATING' && (
                    <div className="space-y-6 animate-fade-in text-center pt-4">
                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-moover-dark dark:text-white">Rate Experience</h3>
                        <div className="flex justify-center gap-2 py-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setRating(star)} className="p-1 transition-transform active:scale-90">
                                    <Star className={`w-10 h-10 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-zinc-700'}`} />
                                </button>
                            ))}
                        </div>
                        <textarea 
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="How did it go?"
                            className="w-full bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl outline-none text-moover-dark dark:text-white h-32 resize-none border border-gray-100 dark:border-zinc-700 focus:ring-2 focus:ring-moover-blue"
                        />
                    </div>
                )}

                {/* --- STAGE 7: COMPLETED --- */}
                {stage === 'COMPLETED' && (
                    <div className="flex flex-col items-center justify-center h-full pb-20 animate-fade-in">
                        <div className="w-24 h-24 bg-moover-dark dark:bg-white rounded-full flex items-center justify-center mb-6 shadow-xl">
                            <CheckCircle className="w-12 h-12 text-white dark:text-moover-dark" />
                        </div>
                        <h2 className="text-3xl font-bold text-moover-dark dark:text-white mb-2">Success!</h2>
                        <p className="text-gray-500 text-center max-w-xs mb-8">Funds released.</p>
                        <button onClick={onClose} className="px-8 py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl font-bold text-moover-dark dark:text-white active:scale-95 transition-transform">Close Dashboard</button>
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20 pb-safe-bottom">
                
                {stage === 'SCHEDULING' && (
                    <button onClick={handleConfirmSchedule} className="w-full py-4 bg-moover-blue text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform">
                        Confirm Schedule
                    </button>
                )}

                {stage === 'MANIFEST' && activeRole === 'RECEIVER' && (
                    <button 
                        onClick={handleSubmitManifest}
                        disabled={!manifestText.trim()}
                        className={`w-full py-4 font-bold rounded-2xl shadow-lg active:scale-95 transition-transform ${manifestText.trim() ? 'bg-moover-blue text-white' : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'}`}
                    >
                        Sign & Submit Declaration
                    </button>
                )}

                {stage === 'INSPECTION' && (
                    <button 
                        onClick={handleConfirmPickup}
                        disabled={!photoTaken}
                        className={`w-full py-4 font-bold rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 ${photoTaken ? 'bg-moover-blue text-white' : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'}`}
                    >
                        {photoTaken ? 'Confirm Pickup & Seal' : 'Take Photo First'}
                    </button>
                )}

                {stage === 'IN_TRANSIT' && (
                    <div className="flex gap-3">
                        <button className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 text-moover-dark dark:text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                            <MessageSquare className="w-5 h-5" /> Chat
                        </button>
                        <button onClick={handleArrived} className="flex-[2] py-4 bg-moover-dark dark:bg-white text-white dark:text-moover-dark font-bold rounded-2xl shadow-lg active:scale-95 transition-transform">
                            I Have Arrived
                        </button>
                    </div>
                )}

                {stage === 'HANDSHAKE' && activeRole === 'TRAVELER' && (
                    <button onClick={handleSubmitPin} disabled={enteredPin.length !== 4} className={`w-full py-4 font-bold rounded-2xl shadow-lg active:scale-95 transition-transform ${enteredPin.length === 4 ? 'bg-moover-dark dark:bg-white text-white dark:text-moover-dark' : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'}`}>
                        Verify & Complete
                    </button>
                )}

                 {stage === 'RATING' && (
                    <button onClick={handleSubmitRating} disabled={rating === 0} className={`w-full py-4 font-bold rounded-2xl shadow-lg active:scale-95 transition-transform ${rating > 0 ? 'bg-moover-blue text-white' : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'}`}>
                        Submit Review
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};