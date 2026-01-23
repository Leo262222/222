export enum ConnectionType {
  CHAT = 'chat',
  VOICE = 'voice',
  VIDEO = 'video'
}

export type CategoryId = string;
export type Language = 'en' | 'zh';

export interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Category {
  id: string;
  name: string;
  name_zh: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Advisor {
  id: string;
  name: string;
  name_zh?: string;
  title: string;
  title_zh?: string;
  imageUrl: string;
  category: string;
  pricePerMinute: number;
  isOnline: boolean;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  bio: string;
  bio_zh?: string;
  specialties: string[];
  specialties_zh?: string[];
  reviews: Review[];
  certificates?: string[];
  bookingQrUrl?: string;
}
