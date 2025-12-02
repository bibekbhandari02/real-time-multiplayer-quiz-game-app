import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

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
        }
      }
    }),
    { name: 'auth-storage' }
  )
);
