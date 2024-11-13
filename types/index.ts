// types/index.ts

export type MessageType = 'success' | 'error' | 'info';

export interface Message {
  type?: MessageType;
  message?: string;
  success?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  image_credits: number;
  video_credits: number;
  created_at: string;
}

export interface EmailVerificationReminder {
  user_id: string;
  email: string;
  expires_at: string;
  reminded: boolean;
}

export interface SignUpFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}