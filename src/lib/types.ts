// Types para o LiveVIP
export interface User {
  id: string;
  email: string;
  premium_until?: Date;
  free_seconds_today: number;
  created_at: Date;
  updated_at: Date;
}

export interface Live {
  id: string;
  title: string;
  streamer: string;
  category: string;
  thumbnail: string;
  video_url: string;
  base_viewers: number;
  variance_percent: number;
  current_viewers?: number;
  status: 'live' | 'recorded' | 'scheduled';
  created_at: Date;
  updated_at: Date;
}

export interface ViewSession {
  id: string;
  user_id: string;
  live_id: string;
  started_at: Date;
  ended_at?: Date;
  seconds_watched: number;
}

export interface Payment {
  id: string;
  user_id: string;
  provider: string;
  amount: number;
  plan: 'weekly' | 'monthly' | 'annual';
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LivesResponse {
  lives: Live[];
  total: number;
  page: number;
  limit: number;
}

export interface LiveStream {
  id: string;
  title: string;
  thumbnail: string;
  video_url: string;
  viewer_count: number;
  is_live: boolean;
  streamer_name: string;
  streamer_avatar: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface StreamFormData {
  title: string;
  thumbnail: string;
  video_url: string;
  viewer_count: number;
  streamer_name: string;
  streamer_avatar: string;
  category: string;
}

export enum StorageKeys {
  LIVE_STREAMS = 'livevip_streams',
  LAST_API_UPDATE = 'livevip_last_update',
  USER_DATA = 'livevip_user'
}
