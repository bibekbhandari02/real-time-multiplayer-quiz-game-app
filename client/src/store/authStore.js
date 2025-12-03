import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from '../api/axios';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      refreshUser: async () => {
        try {
          const token = get().token;
          if (!token) return;
          
          const { data } = await axios.get('/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          set({ user: data.user });
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // If token is invalid or expired, clear auth state
          if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 500) {
            console.log('Invalid token detected, logging out...');
            set({ token: null, user: null });
          }
        }
      }
    }),
    { name: 'auth-storage' }
  )
);
