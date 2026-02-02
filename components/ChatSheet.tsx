import React, { useState, useRef, useEffect } from 'react';
import { X, Send, AlertTriangle, ShieldCheck, Languages, ChevronDown, Check } from 'lucide-react';
import { HapticsService } from '../services/capacitorService';
import { useStore } from '../store';
import { Chat } from '../types';

interface ChatSheetProps {
  tripId: string;
  travelerName: string;
  onClose: () => void;
}

// EXPANDED LANGUAGE LIST
const LANGUAGES = [
    { code: 'ORIGINAL', label: 'Original' },
    { code: 'EN', label: 'English' },
    { code: 'ES', label: 'Español' },
    { code: 'FR', label: 'Français' },
    { code: 'DE', label: 'Deutsch' },
    { code: 'IT', label: 'Italiano' },      // Added Italian
    { code: 'PT', label: 'Português' },
    { code: 'ZH', label: '中文 (Chinese)' }, // Added Chinese
    { code: 'JA', label: '日本語 (Japanese)' }, // Added Japanese
    { code: 'RU', label: 'Русский (Russian)' }, // Added Russian
    { code: 'KO', label: '한국어 (Korean)' }    // Added Korean
];

export const ChatSheet: React.FC<ChatSheetProps> = ({ tripId, travelerName, onClose }) => {
  const { getOrCreateChat, sendMessage, activeChats } = useStore();
  const [inputText, setInputText] = useState('');
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  
  // TRANSLATION STATE
  const [targetLanguage, setTargetLanguage] = useState<string>('ORIGINAL');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Chat
  const chatRef = useRef<Chat | null>(null);
  const activeChat = activeChats.find(c => c.tripId === tripId) || chatRef.current;

  useEffect(() => {
    if (!chatRef.current) {
        chatRef.current = getOrCreateChat(tripId, travelerName);
    }
  }, [tripId, travelerName, getOrCreateChat]);

  const messages = activeChat ? activeChat.messages : [];

  // --- MOCK TRANSLATION ENGINE (Expanded) ---
  const getTranslatedText = (text: string, lang: string) => {
      // In a real app, this calls Google Translate API.
      // Here, we simulate responses for demonstration.
      if (lang === 'ORIGINAL') return text;
      
      const prefix = `[${lang}]:`;
      
      // Simple Greeting Simulations
      if (text.includes('Hi') || text.includes('Hello')) {
          if (lang === 'ES') return "¡Hola! ¿Cómo estás?";
          if (lang === 'FR') return "Salut! Ça va?";
          if (lang === 'DE') return "Hallo! Wie geht's?";
          if (lang === 'IT') return "Ciao! Come stai?";
          if (lang === 'PT') return "Olá! Tudo bem?";
          if (lang === 'ZH') return "你好！你好吗？";
          if (lang === 'JA') return "こんにちは！お元気ですか？";
          if (lang === 'RU') return "Привет! Как дела?";
          if (lang === 'KO') return "안녕하세요! 잘 지내세요?";
      }
      
      // Default Mock Fallback
      return `${prefix} ${text}`;
  };

  // --- SECURITY ENGINE (GLOBAL FINANCIAL & PHONE BLOCKER) ---
  const containsRestrictedInfo = (text: string): string | null => {
    
    // A. PHONE NUMBERS
    const globalPhoneRegex = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:(?:\(\d+\)|[\d]){1,}[\s.-]?){7,}/;
    const strippedText = text.replace(/[^0-9+]/g, '');
    if (globalPhoneRegex.test(text) || (strippedText.length >= 7 && strippedText.length <= 15 && /\d{7,}/.test(strippedText))) {
        return "Phone numbers are not allowed. Please keep chat in-app.";
    }

    // B. EMAILS
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return "Email addresses are blocked.";

    // C. PAYMENT APPS
    if (/\b(venmo|cashapp|zelle|paypal|revolut|western union|remitly|moneygram|worldremit|wise|xoom|skrill|payoneer)\b/i.test(text)) {
        return "Please keep payments inside Moover.";
    }

    // D. STRICT BANK BLOCKLIST
    const strictBanks = new RegExp('\\b(' + [
        'bac', 'citi', 'scotia', 'bbva', 'hsbc', 'ubs', 'pnc', 'td bank',
        'ficohsa', 'atlantida', 'banpais', 'banpaís', 'davivienda', 'lafise', 'promerica', 
        'banrural', 'azteca', 'ficensa', 'bancolan', 'cuscatlan', 'bi-bank', 'banhcafe',
        'itau', 'bradesco', 'bancolombia', 'interbank', 'bcp', 'banco de chile',
        'jpmorgan', 'wellsfargo', 'wells fargo', 'citigroup', 'goldman sachs', 'santander', 
        'barclays', 'lloyds', 'natwest', 'deutsche bank', 'commerzbank', 'rabobank', 'credit suisse', 'nordea'
    ].join('|') + ')\\b', 'i');

    if (strictBanks.test(text)) return "Bank names are blocked. Pay securely via Moover.";

    // E. CONTEXTUAL BANKS
    if (/(?:use|using|have|tengo|bank|banco|account|cuenta|app|deposit|deposito|transfer|transferir|card|tarjeta)\s+(?:chase|citi|square|discovery|popular|occidente)/i.test(text)) {
        return "Financial institution names are blocked.";
    }
    if (/\bchase\s+bank\b/i.test(text)) return "Bank names are blocked.";

    // F. TRANSACTION WORDS
    const hardFinancials = /\b(wire transfer|transferencia\s+bancaria|bank transfer|deposito|depósito|cuenta\s+bancaria|bank account|iban|swift code|routing number|clabe|sinpe)\b/i;
    if (hardFinancials.test(text)) return "Transaction details are blocked.";

    const softFinancials = /\b(transfer|transferir|transfiero|transferencia)\b/i;
    const moneyWords = /\b(money|cash|dinero|plata|efectivo|lempira|dollar|dolar|usd|hnl|eur|funds|pago|pay)\b/i;
    const safeContext = /\b(de (avion|avión|vuelo|archivo|datos|bus)|to (flight|plane|file|data|bus))\b/i;

    if (softFinancials.test(text)) {
        if (moneyWords.test(text) || !safeContext.test(text)) {
             const isEnglishTransfer = /\b(transfer)\b/i.test(text);
             if (isEnglishTransfer && !moneyWords.test(text)) return null;
             return "Financial discussions are restricted. Please use the 'Make Offer' button.";
        }
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setInputText(text);
      const warning = containsRestrictedInfo(text);
      setSecurityWarning(warning);
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
    setSecurityWarning(null);
    HapticsService.impact('LIGHT');
  };

  const handleLanguageSelect = (code: string) => {
      HapticsService.impact('MEDIUM');
      setTargetLanguage(code);
      setShowLangMenu(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] relative z-10 animate-slide-up shadow-2xl h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20 relative">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-moover-dark dark:text-white flex items-center gap-2">
                            {travelerName}
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-green-600 font-medium">Online now</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* LANGUAGE DROPDOWN TRIGGER */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    targetLanguage !== 'ORIGINAL'
                                    ? 'bg-moover-blue text-white shadow-md' 
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                                }`}
                            >
                                <Languages className="w-3 h-3" />
                                {LANGUAGES.find(l => l.code === targetLanguage)?.label}
                                <ChevronDown className="w-3 h-3 ml-1" />
                            </button>

                            {/* DROPDOWN MENU */}
                            {showLangMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 overflow-hidden z-50 animate-fade-in max-h-60 overflow-y-auto">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageSelect(lang.code)}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-moover-dark dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 flex justify-between items-center"
                                        >
                                            {lang.label}
                                            {targetLanguage === lang.code && <Check className="w-3 h-3 text-moover-blue" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black">
                {/* Translation Banner */}
                {targetLanguage !== 'ORIGINAL' && (
                    <div className="text-center py-2 animate-fade-in">
                        <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full uppercase tracking-wider">
                            Viewing in {LANGUAGES.find(l => l.code === targetLanguage)?.label}
                        </span>
                    </div>
                )}

                {messages.map((msg) => {
                    // Logic: Only translate OTHER user's messages, and only if target is NOT original
                    const shouldTranslate = targetLanguage !== 'ORIGINAL' && msg.sender === 'THEM';
                    
                    const displayedText = shouldTranslate
                        ? getTranslatedText(msg.text, targetLanguage)
                        : msg.text;

                    return (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'ME' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed transition-all duration-300 ${
                                msg.sender === 'ME' 
                                    ? 'bg-moover-blue text-white rounded-br-none' 
                                    : shouldTranslate
                                        ? 'bg-blue-50 dark:bg-blue-900/10 text-moover-dark dark:text-white border border-blue-100 dark:border-blue-800/30 rounded-bl-none shadow-sm'
                                        : 'bg-white dark:bg-zinc-800 text-moover-dark dark:text-white border border-gray-100 dark:border-zinc-700 rounded-bl-none shadow-sm'
                            }`}>
                                {displayedText}
                            </div>
                            
                            {/* "Translated" Badge */}
                            {shouldTranslate && (
                                <span className="text-[9px] text-gray-400 mt-1 ml-1 flex items-center gap-1">
                                    <Languages className="w-2.5 h-2.5" /> Translated
                                </span>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Security Warning Toast */}
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
                        onChange={handleInputChange} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 dark:bg-zinc-800 text-moover-dark dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-moover-blue transition-all"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!inputText.trim() || !!securityWarning} 
                        className={`p-3 rounded-xl transition-all ${inputText.trim() && !securityWarning ? 'bg-moover-blue text-white shadow-lg active:scale-95' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};