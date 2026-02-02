import React, { useState, useRef } from 'react';
// Added ArrowRight to imports to fix "Cannot find name 'ArrowRight'"
import { Camera, Lock, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { CameraService, HapticsService } from '../services/capacitorService';
import { useStore } from '../store';
import { OrderStatus } from '../types';

export const CourierHandoffSheet: React.FC = () => {
  const { activeOrder, updateOrderStatus } = useStore();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);
  const [isSwiped, setIsSwiped] = useState(false);
  
  // Swipe State
  const [dragX, setDragX] = useState(0);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  if (!activeOrder) return null;

  const handleTakePhoto = async () => {
    try {
      const url = await CameraService.takePhoto();
      setPhotoUrl(url);
      HapticsService.notification('SUCCESS');
    } catch (e) {
      console.error(e);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSwiped || !photoUrl || !liabilityAccepted) return;
    
    const container = swipeContainerRef.current;
    if (!container) return;
    
    const touch = e.touches[0];
    const rect = container.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    
    // Clamp
    if (offsetX > 0 && offsetX < rect.width - 56) {
      setDragX(offsetX);
    } else if (offsetX >= rect.width - 56) {
      setDragX(rect.width - 56);
      completeSwipe();
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiped) setDragX(0);
  };

  const completeSwipe = () => {
    setIsSwiped(true);
    HapticsService.impact('HEAVY');
    HapticsService.notification('SUCCESS');
    
    // Mock API Call update
    setTimeout(() => {
        updateOrderStatus(OrderStatus.IN_TRANSIT, { 
            pickup_photo_url: photoUrl!, 
            traveler_legal_attestation: true,
            pickup_timestamp: new Date().toISOString()
        });
    }, 500);
  };

  if (activeOrder.status !== OrderStatus.AWAITING_HANDOFF && activeOrder.status !== OrderStatus.PENDING_ACCEPTANCE) {
      return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm" />
      
      {/* Sheet Content */}
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pointer-events-auto relative shadow-2xl animate-slide-up pb-safe-bottom">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-bold text-moover-dark mb-1">Confirm Pickup</h2>
        <p className="text-sm text-gray-500 mb-6">Order #{activeOrder.id.split('_')[1]}</p>

        {/* Step 1: Open Box Photo */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">
            Step 1: Anti-Theft Verification
          </label>
          {photoUrl ? (
             <div className="relative rounded-xl overflow-hidden aspect-video border-2 border-green-500">
                <img src={photoUrl} className="w-full h-full object-cover" alt="Evidence" />
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Evidence Secured
                </div>
             </div>
          ) : (
            <button 
                onClick={handleTakePhoto}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 active:bg-gray-100 transition-colors"
            >
                <Camera className="w-8 h-8 text-moover-blue mb-2" />
                <span className="text-sm font-semibold text-moover-blue">Take Photo of OPEN Package</span>
                <span className="text-xs text-gray-400 mt-1">Must show contents clearly</span>
            </button>
          )}
        </div>

        {/* Step 2: Legal Checkbox */}
        <div className="mb-8">
             <label className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                <input 
                    type="checkbox" 
                    className="mt-1 w-5 h-5 accent-moover-blue"
                    checked={liabilityAccepted}
                    onChange={(e) => setLiabilityAccepted(e.target.checked)}
                />
                <div className="text-xs text-moover-dark">
                    <span className="font-bold text-red-600 block mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3"/> LEGAL ATTESTATION
                    </span>
                    I certify that this package contains no illicit materials, matches the description, and I assume custody. I accept the <b>${activeOrder.agreed_liability_value}</b> liability value.
                </div>
             </label>
        </div>

        {/* Step 3: Swipe to Confirm */}
        <div 
            ref={swipeContainerRef}
            className={`relative h-[60px] bg-gray-100 rounded-full overflow-hidden select-none ${(!photoUrl || !liabilityAccepted) ? 'opacity-50 grayscale' : ''}`}
        >
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-400 z-0">
                {isSwiped ? 'PICKUP CONFIRMED' : 'SWIPE TO START TRIP'}
            </div>
            
            <div 
                className="absolute top-1 bottom-1 w-[52px] bg-moover-blue rounded-full shadow-lg flex items-center justify-center z-10 transition-transform duration-75"
                style={{ transform: `translateX(${dragX}px)` }}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {isSwiped ? <CheckCircle className="text-white w-6 h-6" /> : <ArrowRight className="text-white w-6 h-6" />}
            </div>
            
            {/* Visual fill track */}
            <div 
                className="absolute top-0 left-0 bottom-0 bg-moover-blue/20 z-0"
                style={{ width: `${dragX + 26}px` }}
            />
        </div>
      </div>
    </div>
  );
};