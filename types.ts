export type Language = 'en' | 'zh';

export interface Category {
  id: string;
  name: string; // English Name (used as key)
  name_zh: string; // Chinese Name
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  balance: number;
  // New fields for billing logic
  dailyMessagesCount: number;
  lastMessageDate: string; // ISO Date string for checking "today"
  hasPaymentMethod: boolean;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Advisor {
  id: string;
  name: string;
  name_zh?: string;
  title: string;
  title_zh?: string;
  category: string; // Stored as English Key (Category.name)
  imageUrl: string;
  rating: number;
  reviewCount: number;
  pricePerMinute: number;
  isOnline: boolean;
  specialties: string[];
  specialties_zh?: string[];
  bio: string;
  bio_zh?: string;
  reviews: Review[];
  yearsExperience: number;
  certificates: string[]; // List of image URLs for certificates
  bookingQrUrl?: string; // New: CS/Booking QR Code URL
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ConnectionType {
  CHAT = 'CHAT',
  VOICE = 'VOICE',
  VIDEO = 'VIDEO'
}
