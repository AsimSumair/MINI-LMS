import { create } from 'zustand';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  avatar?: { url: string };
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  
  setAuth: (user: User | null, token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  
  setAuth: (user, token) => set({ 
    user, 
    accessToken: token,
    isAuthenticated: !!user && !!token 
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  logout: () => set({ 
    user: null, 
    accessToken: null, 
    isAuthenticated: false 
  }),
}));