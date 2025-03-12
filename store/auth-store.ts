'use client';

import { create } from 'zustand';
import { createSupabaseClient } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // Методи
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          const supabase = createSupabaseClient();
          
          // Перевірка наявної сесії
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            set({ 
              user: session.user, 
              session: session,
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ 
            error: 'Failed to initialize auth',
            isLoading: false,
            user: null,
            session: null
          });
          console.error('Auth initialization error:', error);
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const supabase = createSupabaseClient();
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          set({ 
            user: data.user, 
            session: data.session,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to login',
            isLoading: false 
          });
          console.error('Login error:', error);
        }
      },

      signup: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const supabase = createSupabaseClient();
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}`
            }
          });
          
          if (error) throw error;
          
          // Якщо увімкнена підтвердження електронної пошти, 
          // користувач не буде автоматично авторизований
          if (data.session) {
            set({ 
              user: data.user, 
              session: data.session,
              isLoading: false 
            });
          } else {
            set({ 
              isLoading: false,
              // В цьому випадку користувач повинен підтвердити електронну пошту 
              error: 'Please check your email to confirm your account'
            });
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to signup',
            isLoading: false 
          });
          console.error('Signup error:', error);
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          const supabase = createSupabaseClient();
          
          const { error } = await supabase.auth.signOut();
          
          if (error) throw error;
          
          set({ 
            user: null, 
            session: null,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to logout',
            isLoading: false 
          });
          console.error('Logout error:', error);
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage', // Ім'я в localStorage
      partialize: (state) => ({ 
        user: state.user,
        session: state.session 
      }),
    }
  )
);