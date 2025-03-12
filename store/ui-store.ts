'use client';

import { create } from 'zustand';
import { MovieDetails, Person, PersonDetails } from '@/lib/tmdb';

interface UIState {
  // Модальні вікна
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;
  isMovieDetailsModalOpen: boolean;
  isActorModalOpen: boolean;
  
  // Стан вкладок
  activeTab: 'search' | 'watchlist' | 'actor';
  
  // Дані для модальних вікон
  selectedMovie: MovieDetails | null;
  selectedActor: PersonDetails | null;
  
  // Пошук
  searchQuery: string;
  
  // Методи
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openSignupModal: () => void;
  closeSignupModal: () => void;
  
  openMovieDetailsModal: (movie: MovieDetails) => void;
  closeMovieDetailsModal: () => void;
  
  openActorModal: (actor: PersonDetails) => void;
  closeActorModal: () => void;
  
  setActiveTab: (tab: 'search' | 'watchlist' | 'actor') => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Початковий стан
  isLoginModalOpen: false,
  isSignupModalOpen: false,
  isMovieDetailsModalOpen: false,
  isActorModalOpen: false,
  
  activeTab: 'search',
  
  selectedMovie: null,
  selectedActor: null,
  
  searchQuery: '',
  
  // Методи для модальних вікон
  openLoginModal: () => set({ isLoginModalOpen: true, isSignupModalOpen: false }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  
  openSignupModal: () => set({ isSignupModalOpen: true, isLoginModalOpen: false }),
  closeSignupModal: () => set({ isSignupModalOpen: false }),
  
  openMovieDetailsModal: (movie) => set({ 
    selectedMovie: movie, 
    isMovieDetailsModalOpen: true 
  }),
  closeMovieDetailsModal: () => set({ 
    isMovieDetailsModalOpen: false,
    selectedMovie: null
  }),
  
  openActorModal: (actor) => set({ 
    selectedActor: actor, 
    isActorModalOpen: true 
  }),
  closeActorModal: () => set({ 
    isActorModalOpen: false
  }),
  
  // Методи для навігації
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));