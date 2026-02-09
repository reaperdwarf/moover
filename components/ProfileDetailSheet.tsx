import React from 'react';
import { X, ShieldCheck, Star, Calendar, Globe, Package, Plane, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface ProfileDetailSheetProps {
  user: User;
  onClose: () => void;
}

export const ProfileDetailSheet: React.FC<ProfileDetailSheetProps> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] relative z-10 animate-slide-up shadow-2xl h-[90vh] flex flex-col overflow-hidden transition-colors">
        
        <div className="px-6 pt-6 pb-2 bg-white dark:bg-zinc-900 shrink-0 flex justify-between items-start">
             <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full absolute left-1/2 -translate-x-1/2 top-3" />
             <button onClick={onClose} className="ml-auto p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
             </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-safe-bottom">
            
            <div className="flex flex-col items-center mb-8">
                <div className="relative">
                    <img src={user.photo_url} className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-800 shadow-xl object-cover" />
                    {user.is_id_verified && (
                        <div className="absolute bottom-0 right-0 bg-white dark:bg-zinc-900 p-1 rounded-full">
                            <ShieldCheck className="w-6 h-6 text-green-500 fill-green-500/10" />
                        </div>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-moover-dark dark:text-white mt-4">{user.display_name}</h2>
                <div className="text-sm text-gray-500 font-medium flex items-center gap-2 mt-1">
                    <span>Joined {user.joined_date || '2023'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-yellow-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {user.traveler_stats.rating}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <Plane className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Trips</span>
                    </div>
                    <div className="text-2xl font-bold text-moover-dark dark:text-white">
                        {user.traveler_stats.successful_trips}
                    </div>
                    <div className="text-xs text-green-500 font-medium mt-1">
                        {user.traveler_stats.on_time_percentage}% On-Time
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <Package className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Sent</span>
                    </div>
                    <div className="text-2xl font-bold text-moover-dark dark:text-white">
                        {user.sender_stats.items_sent}
                    </div>
                    <div className="text-xs text-gray-500 font-medium mt-1">
                        Items Shipped
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-bold text-moover-dark dark:text-white mb-3">About</h3>
                <div className="flex flex-wrap gap-2">
                    {user.languages?.map(lang => (
                        <div key={lang} className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-300 flex items-center gap-1.5">
                            <Globe className="w-3 h-3" /> {lang}
                        </div>
                    ))}
                    {user.is_id_verified && (
                        <div className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3" /> Identity Verified
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-moover-dark dark:text-white mb-4">Reviews ({user.reviews?.length || 0})</h3>
                <div className="space-y-4">
                    {user.reviews && user.reviews.length > 0 ? (
                        user.reviews.map(review => (
                            <div key={review.id} className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <img src={review.author_photo} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                                        <div>
                                            <div className="text-sm font-bold text-moover-dark dark:text-white">{review.author_name}</div>
                                            <div className="text-[10px] text-gray-400">{review.date} • {review.role === 'SENDER' ? 'Sender' : 'Traveler'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg">
                                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                        <span className="text-xs font-bold text-moover-dark dark:text-white">{review.rating}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">"{review.text}"</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm">No reviews yet.</p>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};