export enum UserRole {
  SENDER = 'SENDER',
  TRAVELER = 'TRAVELER'
}

export interface UserStats {
  total_trips: number;
  successful_trips: number;
  rating: number; // Weighted average (last 5 trips = 70%)
  on_time_percentage: number;
}

export interface User {
  uid: string;
  display_name: string;
  photo_url: string;
  is_id_verified: boolean;
  fcm_token: string | null;
  created_at: Date;
  sender_stats: {
    items_sent: number;
    endorsements: string[];
  };
  traveler_stats: UserStats;
}

export interface Trip {
  id: string;
  traveler_uid: string;
  traveler_name: string;
  traveler_photo: string;
  origin_city: string;
  origin_geohash: string;
  destination_city: string;
  destination_geohash: string;
  outbound_date: string; // ISO Date
  return_date?: string; // ISO Date
  is_round_trip: boolean;
  available_weight_kg: number;
  price_per_kg: number;
  transport_mode?: 'FLIGHT' | 'CAR' | 'TRAIN';
  status: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';
}

export enum WorkflowType {
  COURIER = 'COURIER', // Personal items
  RETAIL = 'RETAIL'    // Buy & Reimburse
}

export enum OrderStatus {
  PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE',
  AWAITING_HANDOFF = 'AWAITING_HANDOFF',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_DESTINATION = 'ARRIVED_DESTINATION',
  DELIVERED = 'DELIVERED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED'
}

export interface Order {
  id: string;
  trip_id: string;
  sender_uid: string;
  traveler_uid: string;
  workflow_type: WorkflowType;
  item_description: string; // regex validation against "Cash/Currency"
  item_weight_kg: number;
  
  // Financials
  agreed_liability_value: number; // Anti-theft contract
  shipping_fee: number;
  platform_fee: number;
  escrow_amount: number; // For Retail mode

  // Evidence
  pickup_photo_url?: string; // Open box photo
  pickup_timestamp?: string;
  delivery_photo_url?: string;
  delivery_timestamp?: string;

  // Legal
  traveler_liability_accepted: boolean;
  traveler_legal_attestation: boolean; // "I certify..."

  status: OrderStatus;
  status_history: { status: OrderStatus; timestamp: string }[];
}
// --- CHAT TYPES ---

export interface Message {
  id: string;
  text: string;
  sender: 'ME' | 'THEM';
  timestamp: string; // ISO String
}

export interface Chat {
  id: string;
  tripId: string;
  otherUserUid: string; // The traveler or sender's ID
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
}

// NEW: Wishlist Request
export interface WishlistRequest {
  id: string;
  requester_uid: string;
  requester_name: string;
  requester_photo?: string;
  origin_location: string;      // e.g. "USA" (Vague allowed)
  destination_location: string; // e.g. "Honduras" (Vague allowed)
  item_weight_kg: number;
  item_description: string;
  status: 'OPEN' | 'ACCEPTED' | 'COMPLETED';
  created_at: string;
}