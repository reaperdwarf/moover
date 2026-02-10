export enum UserRole {
  SENDER = 'SENDER',
  TRAVELER = 'TRAVELER'
}

export interface UserStats {
  total_trips: number;
  successful_trips: number;
  rating: number; 
  on_time_percentage: number;
}

export interface Review {
  id: string;
  author_uid: string;
  author_name: string;
  author_photo: string;
  rating: number;
  date: string;
  text: string;
  role: 'SENDER' | 'TRAVELER';
}

// Onboarding Stages
export enum OnboardingStage {
  STAGE_1_VISITOR = 0,
  STAGE_2_BASIC_AUTH = 1,
  STAGE_3_TRAVELER_READY = 2,
  STAGE_4_VERIFIED = 3
}

export interface User {
  uid: string;
  display_name: string;
  photo_url: string;
  is_id_verified: boolean;
  fcm_token: string | null;
  created_at: Date;
  
  // Profile Fields
  email?: string; 
  joined_date?: string; 
  languages?: string[];
  reviews?: Review[]; 

  // Gamification
  profile_completion_score: number; 
  onboarding_stage: OnboardingStage;

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
  outbound_date: string; 
  
  latest_handoff_date?: string; 
  
  // LOGISTICS FLAGS
  willing_to_buy?: boolean;    
  willing_to_pickup?: boolean; 
  
  linked_request_id?: string; 
  
  return_date?: string; 
  is_round_trip: boolean;
  available_weight_kg: number;
  price_per_kg: number;
  transport_mode?: 'FLIGHT' | 'CAR' | 'TRAIN';
  status: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';
}

export enum WorkflowType {
  COURIER = 'COURIER', 
  RETAIL = 'RETAIL'    
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
  trip_id?: string;
  request_id?: string; 
  sender_uid: string;
  traveler_uid: string;
  workflow_type: WorkflowType;
  item_description: string;
  item_weight_kg: number;
  
  agreed_liability_value: number;
  shipping_fee: number;
  platform_fee: number;
  escrow_amount: number;

  requested_handoff_date?: string;
  requested_handoff_location?: string;

  pickup_photo_url?: string;
  pickup_timestamp?: string;
  delivery_photo_url?: string;
  delivery_timestamp?: string;

  traveler_liability_accepted: boolean;
  traveler_legal_attestation: boolean;

  status: OrderStatus;
  status_history: { status: OrderStatus; timestamp: string }[];
}

export interface Message {
  id: string;
  text: string;
  sender: 'ME' | 'THEM';
  timestamp: string; 
}

export interface Chat {
  id: string;
  tripId: string;
  otherUserUid: string;
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
}

export interface WishlistRequest {
  id: string;
  requester_uid: string;
  requester_name: string;
  requester_photo?: string;
  origin_location: string;      
  destination_location: string; 
  item_weight_kg: number;
  item_description: string;
  deadline_date?: string; 
  item_value?: number; 
  product_url?: string; 
  // Automation field
  item_image_url?: string; 
  status: 'OPEN' | 'ACCEPTED' | 'COMPLETED';
  created_at: string;
}

// ADDED: GLOBAL WINDOW AUGMENTATION
// This tells TypeScript that 'window.google' is valid.
declare global {
  interface Window {
    google: any;
  }
}