// Stream Types
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

// User Access Types
export interface UserAccess {
  email: string;
  name: string;
  plan_type: 'weekly' | 'monthly' | 'lifetime';
  expires_at: string | null;
  transaction_id: string;
  created_at: string;
}

export interface UserAccessResponse {
  hasAccess: boolean;
  planType?: string;
  expiresAt?: string | null;
  message?: string;
}

// Kirvano Webhook Types
export interface KirvanoWebhookData {
  transaction_id: string;
  customer_email: string;
  customer_name: string;
  product_id: string;
  plan_type: 'weekly' | 'monthly' | 'lifetime';
  amount: number;
  status: 'paid' | 'pending' | 'cancelled';
  expires_at?: string;
}

export interface KirvanoWebhook {
  event: string;
  data: KirvanoWebhookData;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  code?: number;
}

// Auth Types
export interface AuthState {
  isAuthenticated: boolean;
  userEmail?: string;
  planType?: string;
  expiresAt?: string | null;
}

// Component Props Types
export interface LivePlayerProps {
  stream: LiveStream;
  onClose: () => void;
}

export interface AuthGuardProps {
  children: React.ReactNode;
}

// Form Types
export interface AdminLoginForm {
  password: string;
}

export interface AccessCheckForm {
  email: string;
}

// Categories and Avatars
export type StreamCategory = 
  | 'Jogos' 
  | 'Música' 
  | 'Esportes' 
  | 'Tecnologia' 
  | 'Culinária' 
  | 'Arte' 
  | 'Educação' 
  | 'Entretenimento' 
  | 'Fitness' 
  | 'Viagem';

export type PlanType = 'weekly' | 'monthly' | 'lifetime';

// Environment Variables
export interface EnvVars {
  NEXT_PUBLIC_API_URL: string;
  KIRVANO_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_KIRVANO_CHECKOUT_URL: string;
  ADMIN_PASSWORD: string;
}

// Local Storage Keys
export enum StorageKeys {
  LIVE_STREAMS = 'liveStreams',
  USER_EMAIL = 'user_email',
  USER_ACCESS = 'user_access',
  ADMIN_AUTH = 'admin_authenticated',
  LAST_API_UPDATE = 'lastApiUpdate',
  LAST_API_SYNC = 'lastApiSync'
}

// API Endpoints
export enum ApiEndpoints {
  STREAMS = '/api/streams',
  USER_ACCESS = '/api/user-access',
  CHECK_ACCESS = '/api/check-access',
  KIRVANO_WEBHOOK = '/api/webhook/kirvano',
  HEALTH = '/health',
  TEST_DB = '/api/test-db'
}

// HTTP Methods
export enum HttpMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface NetworkError {
  type: 'network';
  message: string;
  status?: number;
}

export interface ServerError {
  type: 'server';
  message: string;
  code: string;
}

export type AppError = ValidationError | NetworkError | ServerError;

// Utility Types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = { [P in keyof T]?: T[P] };
export type Required<T> = { [P in keyof T]-?: T[P] };

// State Management Types
export interface AppState {
  streams: LiveStream[];
  loading: boolean;
  error: string | null;
  success: string | null;
  lastUpdate: string;
  auth: AuthState;
}

export interface AdminState extends AppState {
  showForm: boolean;
  editingStream: LiveStream | null;
  syncing: boolean;
  lastSync: string;
}

// Hook Return Types
export interface UseStreamsReturn {
  streams: LiveStream[];
  loading: boolean;
  error: string | null;
  loadStreams: () => Promise<void>;
  createStream: (data: StreamFormData) => Promise<LiveStream>;
  updateStream: (id: string, data: Partial<StreamFormData>) => Promise<LiveStream>;
  deleteStream: (id: string) => Promise<void>;
  refreshStreams: () => Promise<void>;
}

export interface UseAuthReturn {
  isAuthenticated: boolean;
  userEmail?: string;
  planType?: string;
  expiresAt?: string | null;
  login: (email: string) => Promise<UserAccessResponse>;
  logout: () => void;
  checkAccess: (email: string) => Promise<UserAccessResponse>;
}

export interface UseAdminReturn {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}
