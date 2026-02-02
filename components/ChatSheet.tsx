import React, { useState, useRef, useEffect } from 'react';
import { X, Send, AlertTriangle, ShieldCheck } from 'lucide-react';
import { HapticsService } from '../services/capacitorService';
import { useStore } from '../store';
import { Chat } from '../types';

interface ChatSheetProps {
  tripId: string;
  travelerName: string;
  onClose: () => void;
}

export const ChatSheet: React.FC<ChatSheetProps> = ({ tripId, travelerName, onClose }) => {
  const { getOrCreateChat, sendMessage, activeChats } = useStore();
  const [inputText, setInputText] = useState('');
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize or Fetch Chat
  const chatRef = useRef<Chat | null>(null);
  const activeChat = activeChats.find(c => c.tripId === tripId) || chatRef.current;

  useEffect(() => {
    if (!chatRef.current) {
        chatRef.current = getOrCreateChat(tripId, travelerName);
    }
  }, [tripId, travelerName, getOrCreateChat]);

  // 2. Safely get messages (Empty array if chat isn't ready yet)
  const messages = activeChat ? activeChat.messages : [];

  // 3. Security Engine
  const containsRestrictedInfo = (text: string): string | null => {
    const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
    if (phoneRegex.test(text)) return "Phone numbers are not allowed.";
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    if (emailRegex.test(text)) return "Email addresses are blocked.";
    const paymentKeywords = /venmo|cashapp|zelle|paypal|revolut|wire transfer/i;
    if (paymentKeywords.test(text)) return "Please keep payments inside Moover.";
    return null;
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeChat) return;

    const warning = containsRestrictedInfo(inputText);
    if (warning) {
        HapticsService.notification('ERROR');
        setSecurityWarning(warning);
        setTimeout(() => setSecurityWarning(null), 4000);
        return;
    }

    sendMessage(activeChat.id, inputText, 'ME');
    setInputText('');
    HapticsService.impact('LIGHT');
  };

  // 4. Scroll Hook (MUST be called unconditionally)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. NOW we can safely return null if still loading
  if (!activeChat) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] relative z-10 animate-slide-up shadow-2xl h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-moover-dark dark:text-white flex items-center gap-2">
                            {travelerName}
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                        </h2>
                        <p className="text-xs text-green-600 font-medium">Online now</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'ME' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.sender === 'ME' 
                                ? 'bg-moover-blue text-white rounded-br-none' 
                                : 'bg-white dark:bg-zinc-800 text-moover-dark dark:text-white border border-gray-100 dark:border-zinc-700 rounded-bl-none shadow-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Warning Toast */}
            {securityWarning && (
                <div className="absolute bottom-24 left-4 right-4 bg-red-500 text-white p-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-bold">{securityWarning}</span>
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 pb-safe-bottom">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 dark:bg-zinc-800 text-moover-dark dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-moover-blue transition-all"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className={`p-3 rounded-xl transition-all ${inputText.trim() ? 'bg-moover-blue text-white shadow-lg active:scale-95' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};