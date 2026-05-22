// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Auth Actions (for useReducer) ────────────────────────────────────────────

export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

// ─── Courses ──────────────────────────────────────────────────────────────────

export interface Instructor {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  category: string;
  instructor: Instructor;
  isBookmarked: boolean;
  isEnrolled: boolean;
  rating: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  previousPage: boolean;   
  nextPage: boolean; 
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  fullName: string;
}