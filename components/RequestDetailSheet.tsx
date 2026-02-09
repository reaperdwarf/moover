import React from 'react';
import { WishlistRequest } from '../types';
import { X, ShieldCheck, Star, Package, ArrowRight, Heart, AlertTriangle, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { useStore } from '../store';

interface RequestDetailSheetProps {
  request: WishlistRequest;
  onClose: () => void;
  onAccept: () => void;
  onProfileClick: (uid: string) => void;
}

export const RequestDetailSheet: React.FC<RequestDetailSheetProps> = ({ request, onClose, onAccept, onProfileClick }) => {
  const { preferences } = useStore();
  const isImperial = preferences.unitSystem === 'IMPERIAL';
  
  const displayWeight = isImperial 
    ? Math.round(request.item_weight_kg * 2.20462) 
    : request.item_weight_kg;
  const unitLabel = isImperial ? 'lbs' : 'kg';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] relative z-10 animate-slide-up shadow-2xl h-[90vh] flex flex-col overflow-hidden transition-colors">
        
        {/* Sticky Header */}
        <div className="px-6 pt-6 pb-4 bg-white dark:bg-zinc-900 z-20 shrink-0">
             <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
             <div className="flex items-start justify-between">
                <div 
                    className="flex items-center gap-4 cursor-pointer active:opacity-70 transition-opacity" 
                    onClick={() => onProfileClick(request.requester_uid)}
                >
                    <img src={request.requester_photo} className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-800 shadow-md object-cover" />
                    <div>
                        <h2 className="text-xl font-bold text-moover-dark dark:text-white">{request.requester_name}</h2>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                             <ShieldCheck className="w-4 h-4 text-green-500" />
                             <span className="font-medium text-green-600">Verified Sender</span>
                             <span className="mx-1">•</span>
                             <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                             <span className="text-moover-dark dark:text-white font-bold">5.0</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                        <Heart className="w-5 h-5 text-moover-dark dark:text-white" />
                    </button>
                    <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ml-2">
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
             </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
            
            {/* Route Map Visual */}
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-3xl p-6 mb-6 border border-gray-100 dark:border-zinc-700 relative overflow-hidden">
                 <div className="flex justify-between items-center relative z-10">
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Origin</div>
                        <div className="text-xl font-bold text-moover-dark dark:text-white leading-tight">{request.origin_location}</div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center px-4 opacity-50">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Destination</div>
                        <div className="text-xl font-bold text-moover-dark dark:text-white leading-tight">{request.destination_location}</div>
                    </div>
                 </div>
            </div>

            {/* Deadline Alert */}
            {request.deadline_date && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-800 mb-6">
                    <Calendar className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-0.5">Required By</div>
                        <div className="font-bold text-moover-dark dark:text-white">{request.deadline_date}</div>
                        <div className="text-xs text-gray-500 mt-1">Item needs to arrive before this date.</div>
                    </div>
                </div>
            )}

            {/* Item Details */}
            <h3 className="font-bold text-moover-dark dark:text-white mb-3">Item Details</h3>
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-700 mb-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-bold text-lg text-moover-dark dark:text-white">{request.item_description}</div>
                        <div className="text-sm text-gray-500">{displayWeight} {unitLabel}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-zinc-800">
                    <div>
                        <div className="text-xs text-gray-400 uppercase font-bold mb-1">Est. Value</div>
                        <div className="font-bold text-green-600 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {request.item_value || '--'}
                        </div>
                    </div>
                    {request.product_url && (
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Link</div>
                            <a href={request.product_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs font-bold flex items-center gap-1">
                                View Item <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </div>
            </div>

             <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl flex gap-3 border border-yellow-100 dark:border-yellow-900/30">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                <div className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                    <strong>Business Tip:</strong> Verify the item value matches the invoice for customs declaration.
                </div>
             </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 z-30 pb-safe-bottom">
            <button 
                onClick={onAccept}
                className="w-full py-4 bg-moover-dark dark:bg-white text-white dark:text-moover-dark font-bold rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
                Accept Gig <ArrowRight className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};