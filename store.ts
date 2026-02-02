import { create } from 'zustand';
import { User, UserRole, Trip, Order, OrderStatus, WorkflowType, Chat, Message } from './types';


interface UserPreferences {
  currency: 'USD' | 'EUR' | 'HNL';
  unitSystem: 'METRIC' | 'IMPERIAL';
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  language: 'EN' | 'ES'; // <--- NEW: Language Preference
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
  
  // Active Chats
  activeChats: Chat[];

  toggleRole: () => void;
  setUser: (user: User) => void;
  createProfile: (name: string) => void;
  deleteAccount: () => void;
  addTrip: (trip: Trip) => void;
  updateOrderStatus: (status: OrderStatus, evidence?: Partial<Order>) => void;
  startDemoHandoff: () => void;
  
  // Chat Actions
  getOrCreateChat: (tripId: string, otherUserName: string, otherUserPhoto?: string) => Chat;
  sendMessage: (chatId: string, text: string, sender: 'ME' | 'THEM') => void;

  // Preferences Actions
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  toggleNotification: (key: keyof UserPreferences['notifications']) => void;
}

// ... (KEEP MOCK CONSTANTS THE SAME AS BEFORE - MOCK_USER_TEMPLATE, MOCK_TRIPS, MOCK_ORDER) ...
// NOTE: Ensure you don't delete the constants MOCK_USER_TEMPLATE, MOCK_TRIPS, MOCK_ORDER from your file.
// For the sake of space, I am focusing on the store implementation below.

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
    is_round_trip: false,
    available_weight_kg: 5,
    price_per_kg: 22,
    status: 'OPEN'
  }
];

// Mock Order (Preserved)
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

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentRole: UserRole.SENDER,
  activeTrips: MOCK_TRIPS,
  activeOrder: null,
  activeChats: [], 
  
  preferences: {
    currency: 'USD',
    unitSystem: 'METRIC',
    theme: 'SYSTEM',
    language: 'EN', // <--- DEFAULT LANGUAGE
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
      // Re-using the logic, ensuring unique ID
      uid: 'user_' + Date.now(),
      display_name: name,
      photo_url: 'https://picsum.photos/200',
      is_id_verified: true,
      fcm_token: 'token_xyz',
      created_at: new Date(),
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
  })
}));