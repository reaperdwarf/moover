import { create } from 'zustand';
import { User, UserRole, Trip, Order, OrderStatus, WorkflowType, Chat, Message, WishlistRequest, Review, OnboardingStage } from './types';
import Tesseract from 'tesseract.js'; 
import { BrowserMultiFormatReader } from '@zxing/library'; 
// @ts-ignore
import { airports } from 'airports-json'; 

// --- CONFIGURATION ---
// IMPORTANT: You must replace this with your actual Google Cloud API Key
// Ensure "Cloud Vision API" is enabled in your Google Cloud Console
const GOOGLE_CLOUD_VISION_API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY; 

// GLOBAL AIRPORT TO CITY MAPPING
const GLOBAL_AIRPORT_MAP = new Map<string, string>();

// Initialize Airport Map (Handle potential import structure variations)
const airportList = airports || []; 
if (Array.isArray(airportList)) {
    airportList.forEach((a: any) => {
        const code = a.iata || a.iata_code;
        if (code && code.length === 3) {
            const locationName = `${a.city}, ${a.country}`;
            GLOBAL_AIRPORT_MAP.set(code, locationName);
        }
    });
}

// NOISE BLOCKLIST
const NOISE_BLOCKLIST = new Set([
    'THE', 'AND', 'FOR', 'NOT', 'YES', 'AIR', 'BAG', 'SEQ', 'PCS', 'WGT', 'KGS', 'LBS', 
    'DOM', 'INT', 'GATE', 'SEAT', 'ZONE', 'TKT', 'PNR', 'ETKT', 'FLT', 'DATE', 'TIME',
    'GRP', 'BN', 'M', 'F', 'C', 'Y', 'P', 'J', 'CLASS', 'NAME', 'FROM', 'TO', 'VIA',
    'ARR', 'DEP', 'BOARD', 'BOARDING', 'PASS', 'TKNE', 'API', 'REF', 'SIT', 'PSGR',
    'ECO', 'BUS', 'FIRST', 'SEC', 'OPR', 'FLY', 'STD', 'STA', 'ETD', 'ETA', 'DOC', 'INF',
    'MSC', 'MR', 'MRS', 'MS'
]);

interface UserPreferences {
  currency: 'USD' | 'EUR' | 'HNL';
  unitSystem: 'METRIC' | 'IMPERIAL';
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  language: 'EN' | 'ES';
  notifications: {
    push_matches: boolean;
    push_chat: boolean;
    push_updates: boolean;
    email_marketing: boolean;
    email_summaries: boolean;
  };
}

interface AppState {
  currentUser: User | null;
  currentRole: UserRole;
  activeTrips: Trip[];
  activeOrder: Order | null;
  preferences: UserPreferences;
  activeChats: Chat[];
  activeRequests: WishlistRequest[];

  toggleRole: () => void;
  setUser: (user: User) => void;
  createProfile: (name: string) => void;
  deleteAccount: () => void;
  addTrip: (trip: Trip) => void;
  updateOrderStatus: (status: OrderStatus, evidence?: Partial<Order>) => void;
  startDemoHandoff: () => void;
  
  getOrCreateChat: (tripId: string, otherUserName: string, otherUserPhoto?: string) => Chat;
  sendMessage: (chatId: string, text: string, sender: 'ME' | 'THEM') => void;

  addWishlistRequest: (request: WishlistRequest) => void;
  acceptWishlistRequest: (requestId: string, terms: { handoffDate: string; handoffLocation: string }) => void;

  getPublicProfile: (uid: string) => User;

  detectUserLocation: () => void; 
  loginWithProvider: (provider: 'google' | 'apple') => Promise<void>; 
  parseBoardingPass: (file: any) => Promise<{ origin: string, destination: string, date: string }>; 
  parseProductLink: (url: string) => Promise<{ title: string, price: number, weight: number, image: string }>; 

  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  toggleNotification: (key: keyof UserPreferences['notifications']) => void;
}

const MOCK_TRIPS: Trip[] = [
  {
    id: 'trip_001',
    traveler_uid: 'traveler_999',
    traveler_name: 'Sarah Jenkins',
    traveler_photo: 'https://picsum.photos/201',
    origin_city: 'New York, NY',
    origin_geohash: 'dr5reg',
    destination_city: 'London, UK',
    destination_geohash: 'gcpvj0',
    outbound_date: '2023-11-15',
    latest_handoff_date: '2023-11-13',
    willing_to_buy: true,
    willing_to_pickup: true, 
    return_date: '2023-11-22',
    is_round_trip: true,
    available_weight_kg: 12,
    price_per_kg: 15,
    status: 'OPEN'
  },
  {
    id: 'trip_002',
    traveler_uid: 'traveler_888',
    traveler_name: 'David Chen',
    traveler_photo: 'https://picsum.photos/202',
    origin_city: 'New York, NY',
    origin_geohash: 'dr5reg',
    destination_city: 'Tokyo, JP',
    destination_geohash: 'xn76ur',
    outbound_date: '2023-11-18',
    latest_handoff_date: '2023-11-16',
    willing_to_buy: false, 
    willing_to_pickup: false, 
    is_round_trip: false,
    available_weight_kg: 5,
    price_per_kg: 22,
    status: 'OPEN'
  }
];

const MOCK_ORDER: Order = {
  id: 'order_555',
  trip_id: 'trip_001',
  sender_uid: 'user_123',
  traveler_uid: 'traveler_999',
  workflow_type: WorkflowType.COURIER,
  item_description: 'Vintage Camera Lens',
  item_weight_kg: 1.5,
  agreed_liability_value: 800,
  shipping_fee: 45,
  platform_fee: 5,
  escrow_amount: 0,
  traveler_liability_accepted: true,
  traveler_legal_attestation: false,
  status: OrderStatus.AWAITING_HANDOFF,
  status_history: [{ status: OrderStatus.PENDING_ACCEPTANCE, timestamp: new Date().toISOString() }]
};

const MOCK_REQUESTS: WishlistRequest[] = [
    {
        id: 'req_1',
        requester_uid: 'user_99',
        requester_name: 'Maria Garcia',
        requester_photo: 'https://picsum.photos/205',
        origin_location: 'Miami',
        destination_location: 'Honduras',
        item_weight_kg: 5,
        item_description: 'Heavy Duty Seals',
        deadline_date: '2023-11-20',
        item_value: 120,
        status: 'OPEN',
        created_at: new Date().toISOString()
    }
];

const MOCK_REVIEWS: Review[] = [
    { id: 'r1', author_uid: 'u1', author_name: 'Alex D.', author_photo: 'https://picsum.photos/100', rating: 5, date: 'Oct 2023', text: 'Fast delivery to Tegucigalpa!', role: 'SENDER' },
    { id: 'r2', author_uid: 'u2', author_name: 'Elena R.', author_photo: 'https://picsum.photos/101', rating: 5, date: 'Sep 2023', text: 'Highly recommended.', role: 'SENDER' },
    { id: 'r3', author_uid: 'u3', author_name: 'Mike T.', author_photo: 'https://picsum.photos/102', rating: 4, date: 'Aug 2023', text: 'Good experience.', role: 'TRAVELER' }
];

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentRole: UserRole.SENDER,
  activeTrips: MOCK_TRIPS,
  activeOrder: null,
  activeChats: [], 
  activeRequests: MOCK_REQUESTS,
  preferences: {
    currency: 'USD',
    unitSystem: 'METRIC',
    theme: 'SYSTEM',
    language: 'EN',
    notifications: {
      push_matches: true,
      push_chat: true,
      push_updates: true,
      email_marketing: false,
      email_summaries: true
    }
  },

  toggleRole: () => set((state) => ({
    currentRole: state.currentRole === UserRole.SENDER ? UserRole.TRAVELER : UserRole.SENDER
  })),

  setUser: (user) => set({ currentUser: user }),

  createProfile: (name: string) => set({
    currentUser: {
      uid: 'user_' + Date.now(),
      display_name: name,
      photo_url: 'https://picsum.photos/200',
      is_id_verified: true,
      fcm_token: 'token_xyz',
      created_at: new Date(),
      onboarding_stage: OnboardingStage.STAGE_2_BASIC_AUTH,
      profile_completion_score: 30,
      sender_stats: { items_sent: 0, endorsements: [] },
      traveler_stats: { total_trips: 0, successful_trips: 0, rating: 5.0, on_time_percentage: 100 }
    }
  }),
  
  deleteAccount: () => set({ currentUser: null }),

  addTrip: (trip) => set((state) => ({ activeTrips: [trip, ...state.activeTrips] })),

  updateOrderStatus: (status, evidence) => set((state) => {
    if (!state.activeOrder) return {};
    return {
      activeOrder: {
        ...state.activeOrder,
        ...evidence,
        status: status,
        status_history: [...state.activeOrder.status_history, { status, timestamp: new Date().toISOString() }]
      }
    };
  }),

  startDemoHandoff: () => set({ activeOrder: MOCK_ORDER }),

  updatePreference: (key, value) => set((state) => ({
    preferences: { ...state.preferences, [key]: value }
  })),

  toggleNotification: (key) => set((state) => ({
    preferences: {
      ...state.preferences,
      notifications: {
        ...state.preferences.notifications,
        [key]: !state.preferences.notifications[key]
      }
    }
  })),

  getOrCreateChat: (tripId, otherUserName, otherUserPhoto) => {
    const state = get();
    const existing = state.activeChats.find(c => c.tripId === tripId);
    if (existing) return existing;

    const newChat: Chat = {
        id: 'chat_' + Date.now(),
        tripId,
        otherUserUid: 'traveler_xyz',
        otherUserName,
        otherUserPhoto,
        lastMessage: 'Chat started',
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: 0,
        messages: [
             { id: 'msg_0', text: `Hi! I'm traveling to London. Questions?`, sender: 'THEM', timestamp: new Date().toISOString() }
        ]
    };

    set(s => ({ activeChats: [newChat, ...s.activeChats] }));
    return newChat;
  },

  sendMessage: (chatId, text, sender) => set((state) => {
    return {
        activeChats: state.activeChats.map(chat => {
            if (chat.id !== chatId) return chat;
            const newMessage: Message = {
                id: 'msg_' + Date.now(),
                text,
                sender,
                timestamp: new Date().toISOString()
            };
            return {
                ...chat,
                lastMessage: text,
                lastMessageTimestamp: newMessage.timestamp,
                messages: [...chat.messages, newMessage]
            };
        })
    };
  }),

  addWishlistRequest: (request) => set((state) => ({ 
      activeRequests: [request, ...state.activeRequests] 
  })),

  acceptWishlistRequest: (requestId, terms) => set((state) => {
    const request = state.activeRequests.find(r => r.id === requestId);
    if (!request) return {};

    const newOrder: Order = {
        id: 'order_' + Date.now(),
        request_id: request.id,
        sender_uid: request.requester_uid,
        traveler_uid: 'me',
        workflow_type: WorkflowType.COURIER,
        item_description: request.item_description,
        item_weight_kg: request.item_weight_kg,
        agreed_liability_value: request.item_value || 0,
        shipping_fee: 0,
        platform_fee: 0,
        escrow_amount: 0,
        traveler_liability_accepted: true,
        traveler_legal_attestation: false,
        status: OrderStatus.PENDING_ACCEPTANCE,
        status_history: [{ status: OrderStatus.PENDING_ACCEPTANCE, timestamp: new Date().toISOString() }],
        requested_handoff_date: terms.handoffDate,
        requested_handoff_location: terms.handoffLocation
    };

    const newChat: Chat = {
        id: 'chat_' + Date.now(),
        tripId: newOrder.id,
        otherUserUid: request.requester_uid,
        otherUserName: request.requester_name,
        otherUserPhoto: request.requester_photo,
        lastMessage: `I can help! I need it by ${terms.handoffDate}`,
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: 0,
        messages: [{
            id: 'msg_0',
            text: `I can help! I need it by ${terms.handoffDate} at ${terms.handoffLocation}`,
            sender: 'ME',
            timestamp: new Date().toISOString()
        }]
    };

    return {
        activeOrder: newOrder,
        activeChats: [newChat, ...state.activeChats],
        activeRequests: state.activeRequests.map(r => 
            r.id === requestId ? { ...r, status: 'ACCEPTED' } : r
        )
    };
  }),

  getPublicProfile: (uid) => {
      return {
          uid: uid,
          display_name: uid === 'traveler_999' ? 'Sarah Jenkins' : (uid === 'user_99' ? 'Maria Garcia' : 'David Chen'),
          photo_url: uid === 'traveler_999' ? 'https://picsum.photos/201' : (uid === 'user_99' ? 'https://picsum.photos/205' : 'https://picsum.photos/202'),
          is_id_verified: true,
          fcm_token: null,
          created_at: new Date('2023-01-15'),
          joined_date: 'Jan 2023',
          languages: ['English', 'Spanish'],
          onboarding_stage: OnboardingStage.STAGE_4_VERIFIED,
          profile_completion_score: 95,
          sender_stats: { items_sent: 12, endorsements: ['Reliable', 'Friendly'] },
          traveler_stats: { 
              total_trips: 34, 
              successful_trips: 33, 
              rating: 4.9, 
              on_time_percentage: 98 
          },
          reviews: MOCK_REVIEWS
      };
  },

  loginWithProvider: async (provider) => {
      set({
          currentUser: {
              uid: 'user_' + Date.now(),
              display_name: 'Dennis Barjum',
              email: 'dennis@example.com',
              photo_url: 'https://picsum.photos/200',
              is_id_verified: false,
              fcm_token: 'mock',
              created_at: new Date(),
              onboarding_stage: OnboardingStage.STAGE_2_BASIC_AUTH,
              profile_completion_score: 30,
              sender_stats: { items_sent: 0, endorsements: [] },
              traveler_stats: { total_trips: 0, successful_trips: 0, rating: 5.0, on_time_percentage: 100 }
          }
      });
  },

  detectUserLocation: () => {
      console.log("Detecting Location... Honduras found.");
      set(state => ({
          preferences: {
              ...state.preferences,
              currency: 'HNL',
              unitSystem: 'IMPERIAL' 
          }
      }));
  },

  // INTELLIGENT TICKET PARSER with Global City Mapping
  parseBoardingPass: async (file) => {
      if (!file) return { origin: '', destination: '', date: '' };

      // 1. Try Barcode First
      try {
          const codeReader = new BrowserMultiFormatReader();
          const imageUrl = URL.createObjectURL(file);
          const result = await codeReader.decodeFromImageUrl(imageUrl);
          const rawText = result.getText();
          console.log("Barcode Found:", rawText);

          const airportCodes = rawText.match(/[A-Z]{3}/g);
          if (airportCodes && airportCodes.length >= 2) {
              // Convert Code -> City Name
              const originCode = airportCodes[0];
              const destCode = airportCodes[1];
              
              return {
                  origin: GLOBAL_AIRPORT_MAP.get(originCode) || originCode,
                  destination: GLOBAL_AIRPORT_MAP.get(destCode) || destCode,
                  date: new Date().toISOString().split('T')[0]
              };
          }
      } catch (err) {
          console.log("Barcode failed, trying Cloud/OCR...");
      }

      // 2. Try Google Cloud Vision
      let textToProcess = '';
      if (GOOGLE_CLOUD_VISION_API_KEY && GOOGLE_CLOUD_VISION_API_KEY.length > 30) {
          try {
              const reader = new FileReader();
              const base64Promise = new Promise<string>((resolve) => {
                  reader.onload = (e) => resolve(e.target?.result as string);
                  reader.readAsDataURL(file);
              });
              const base64Data = (await base64Promise).split(',')[1];

              const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`, {
                  method: 'POST',
                  body: JSON.stringify({
                      requests: [{
                          image: { content: base64Data },
                          features: [{ type: 'TEXT_DETECTION' }]
                      }]
                  })
              });
              
              const result = await response.json();
              textToProcess = result.responses[0]?.fullTextAnnotation?.text || '';
          } catch (err) {
              console.error("Cloud Vision failed:", err);
          }
      }

      // 3. Fallback to Tesseract
      if (!textToProcess) {
          try {
              const result = await Tesseract.recognize(file, 'eng');
              textToProcess = result.data.text;
          } catch (error) {
              console.error("Tesseract failed", error);
          }
      }

      return extractFlightDetails(textToProcess);
  },

  parseProductLink: async (url) => {
      return new Promise(resolve => {
          setTimeout(() => {
              resolve({
                  title: 'Sony WH-1000XM5 Wireless Headphones',
                  price: 348.00,
                  weight: 0.5,
                  image: 'https://picsum.photos/400'
              });
          }, 1500);
      });
  }
}));

// Helper: Smart Filtering & Mapping
function extractFlightDetails(text: string) {
    if (!text) return { origin: '', destination: '', date: '' };
    
    const cleanText = text.toUpperCase();
    const codeRegex = /\b[A-Z]{3}\b/g;
    
    // Check against the GLOBAL_AIRPORT_MAP keys
    const foundCodes = (cleanText.match(codeRegex) || []).filter(code => 
        !NOISE_BLOCKLIST.has(code) && 
        GLOBAL_AIRPORT_MAP.has(code) // Only accept real airports
    );

    const uniqueCodes = [...new Set(foundCodes)];
    
    let origin = '';
    let destination = '';

    // LOGIC: CONNECTING FLIGHTS
    // First Valid Airport = Origin
    // Last Valid Airport = Destination
    if (uniqueCodes.length >= 2) {
        origin = uniqueCodes[0];
        destination = uniqueCodes[uniqueCodes.length - 1];
        
        if (origin === destination && uniqueCodes.length > 2) {
            destination = uniqueCodes[uniqueCodes.length - 2];
        }
    }

    // Convert to City Names if found
    const originName = GLOBAL_AIRPORT_MAP.get(origin) || origin;
    const destName = GLOBAL_AIRPORT_MAP.get(destination) || destination;

    // Attempt Date
    let parsedDate = new Date().toISOString().split('T')[0];
    const dateMatch = cleanText.match(/(\d{1,2})[\/\-\s]([A-Z]{3}|\d{1,2})[\/\-\s,.]+(\d{2,4})/);
    if (dateMatch) {
        const d = new Date(dateMatch[0]);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2020) {
            parsedDate = d.toISOString().split('T')[0];
        }
    }

    return { origin: originName, destination: destName, date: parsedDate };
}