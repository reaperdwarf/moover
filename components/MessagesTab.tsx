import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { ChatSheet } from './ChatSheet';

export const MessagesTab: React.FC = () => {
  const { t } = useTranslation();
  const { activeChats } = useStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const selectedChat = activeChats.find(c => c.id === selectedChatId);

  return (
    <div className="h-full bg-gray-50 dark:bg-black pt-safe-top transition-colors">
        {/* Header */}
        <div className="px-6 py-6 bg-white dark:bg-zinc-900 shadow-sm sticky top-0 z-10">
             <h1 className="text-2xl font-bold text-moover-dark dark:text-white">{t('messages_title')}</h1>
        </div>

        {/* Chat List */}
        <div className="p-4 space-y-2 pb-32">
            {activeChats.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                    <p>{t('inbox_empty')}</p>
                    <p className="text-xs mt-2">Book a trip to start chatting</p>
                </div>
            ) : (
                activeChats.map(chat => (
                    <button 
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-zinc-800 active:scale-98 transition-transform"
                    >
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                            {chat.otherUserPhoto ? (
                                <img src={chat.otherUserPhoto} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-xl">
                                    {chat.otherUserName[0]}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left overflow-hidden">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-moover-dark dark:text-white truncate">{chat.otherUserName}</h3>
                                <span className="text-xs text-gray-400">
                                    {new Date(chat.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {chat.messages[chat.messages.length - 1]?.sender === 'ME' && 'You: '}
                                {chat.lastMessage}
                            </p>
                        </div>
                    </button>
                ))
            )}
        </div>

        {/* Render Chat Sheet if selected */}
        {selectedChat && (
            <div className="relative z-[100]">
                <ChatSheet 
                    tripId={selectedChat.tripId} 
                    travelerName={selectedChat.otherUserName} 
                    onClose={() => setSelectedChatId(null)} 
                />
            </div>
        )}
    </div>
  );
};