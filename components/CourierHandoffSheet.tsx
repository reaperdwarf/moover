import React, { useState } from 'react';
import { Camera, CheckCircle, ShieldAlert, FileText, PackageOpen } from 'lucide-react';
import { Button } from './ui/Button';
import { CameraService, HapticsService } from '../services/capacitorService';
import { useStore } from '../store';
import { OrderStatus } from '../types';

export const CourierHandoffSheet: React.FC = () => {
  const { activeOrder, updateOrderStatus } = useStore();
  const [step, setStep] = useState(1); // 1=Manifest, 2=Photo, 3=Legal
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);

  if (!activeOrder) return null;
  
  // Only show this sheet if the order is in the Handover phase
  if (activeOrder.status !== OrderStatus.AWAITING_HANDOFF && activeOrder.status !== OrderStatus.PENDING_ACCEPTANCE) {
      return null;
  }

  const handleManifestConfirm = () => {
      HapticsService.impact('LIGHT');
      setStep(2);
  };

  const handleTakePhoto = async () => {
    try {
      const url = await CameraService.takePhoto();
      setPhotoUrl(url);
      HapticsService.notification('SUCCESS');
      setStep(3);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartTrip = () => {
    if (!liabilityAccepted || !photoUrl) return;
    
    HapticsService.impact('HEAVY');
    HapticsService.notification('SUCCESS');
    
    // Update State to IN_TRANSIT
    setTimeout(() => {
        updateOrderStatus(OrderStatus.IN_TRANSIT, { 
            pickup_photo_url: photoUrl, 
            traveler_legal_attestation: true,
            pickup_timestamp: new Date().toISOString()
        });
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm" />
      
      {/* Sheet Content */}
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pointer-events-auto relative shadow-2xl animate-slide-up pb-safe-bottom">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-xl font-bold text-moover-dark">Confirm Pickup</h2>
                <p className="text-sm text-gray-500">Order #{activeOrder.id.split('_')[1]}</p>
            </div>
            <div className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">
                Step {step} of 3
            </div>
        </div>

        {/* STEP 1: MANIFEST REVIEW (New Requirement) */}
        {step === 1 && (
            <div className="space-y-5 animate-fade-in">
                <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-yellow-700" />
                        <h3 className="font-bold text-yellow-900 text-sm uppercase tracking-wide">Sender's Declaration</h3>
                    </div>
                    <p className="text-lg font-serif text-yellow-900 italic leading-relaxed">
                        "{activeOrder.item_description}"
                    </p>
                </div>
                
                <div className="px-2">
                    <p className="text-sm text-gray-500 text-center leading-relaxed">
                        Look at the item. Does it match this description exactly? 
                        <br/><span className="font-bold text-red-500">Do not proceed if there are discrepancies.</span>
                    </p>
                </div>

                <Button fullWidth onClick={handleManifestConfirm}>
                    Yes, Item Matches Description
                </Button>
            </div>
        )}

        {/* STEP 2: PHOTO OF CONTENTS (Open Box Protocol) */}
        {step === 2 && (
            <div className="space-y-5 animate-fade-in">
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <PackageOpen className="w-5 h-5 text-blue-700" />
                        <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wide">Open Box Protocol</h3>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">
                        For your safety, you must inspect the <b>actual contents</b> inside the package. 
                        Do not accept sealed boxes from strangers.
                    </p>
                </div>
                
                <button 
                    onClick={handleTakePhoto}
                    className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 active:bg-gray-100 transition-colors group"
                >
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-active:scale-95 transition-transform">
                        <Camera className="w-8 h-8 text-moover-blue" />
                    </div>
                    <span className="text-sm font-bold text-moover-dark">Take Photo of Contents</span>
                    <span className="text-xs text-gray-400 mt-1">Make sure items are clearly visible</span>
                </button>
            </div>
        )}

        {/* STEP 3: LEGAL & CONFIRM (Replaces Slider) */}
        {step === 3 && (
            <div className="space-y-6 animate-fade-in">
                {/* Photo Preview */}
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <img src={photoUrl!} className="w-16 h-16 rounded-lg object-cover bg-gray-200" />
                    <div className="flex-1">
                        <div className="text-sm font-bold text-green-600 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Evidence Secured
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Timestamp: {new Date().toLocaleTimeString()}</div>
                    </div>
                </div>

                <label className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100 cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="mt-1 w-5 h-5 accent-moover-blue shrink-0"
                        checked={liabilityAccepted}
                        onChange={(e) => setLiabilityAccepted(e.target.checked)}
                    />
                    <div className="text-xs text-moover-dark leading-relaxed">
                        <span className="font-bold text-red-600 block mb-1 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3"/> LEGAL ATTESTATION
                        </span>
                        I certify that I have visually inspected the contents, they match the manifest description, and I am assuming legal custody of this package.
                    </div>
                </label>

                {/* THE BUTTON (Replaces the Slider) */}
                <Button 
                    fullWidth 
                    onClick={handleStartTrip}
                    disabled={!liabilityAccepted}
                    className={!liabilityAccepted ? "opacity-50 grayscale" : "shadow-xl shadow-moover-blue/20"}
                >
                    Confirm Pickup & Start Trip
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};