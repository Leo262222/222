// 🔴 核心修复：必须使用 export enum，否则 Vercel 永远无法构建成功！
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
  name_zh?: string;     // 中文名
  title: string;
  title_zh?: string;    // 中文头衔
  imageUrl: string;
  category: string;
  pricePerMinute: number;
  isOnline: boolean;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  bio: string;
  bio_zh?: string;      // 中文简介
  specialties: string[];
  specialties_zh?: string[]; // 中文擅长 (数组)
  reviews: Review[];
  certificates?: string[];
  bookingQrUrl?: string; // 扫码图片链接
}
