// Оновлення для store/ui-store.ts
// Додаємо підтримку модального вікна з деталями актора

import { create } from 'zustand';
import { MovieDetails, Person, PersonDetails } from '@/lib/tmdb';

interface UIState {
  // Модальні вікна
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;
  isMovieDetailsModalOpen: boolean;
  isActorDetailsModalOpen: boolean;
  
  // Стан вкладок
  activeTab: 'search' | 'watchlist' | 'actor' | 'actors';
  
  // Дані для модальних вікон
  selectedMovie: MovieDetails | null;
  selectedActor: PersonDetails | null;
  
  // Пошук
  searchQuery: string;
  actorSearchQuery: string;
  
  // Методи
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openSignupModal: () => void;
  closeSignupModal: () => void;
  
  openMovieDetailsModal: (movie: MovieDetails) => void;
  closeMovieDetailsModal: () => void;
  
  openActorDetailsModal: (actor: PersonDetails) => void;
  closeActorDetailsModal: () => void;
  
  setActiveTab: (tab: 'search' | 'watchlist' | 'actor' | 'actors') => void;
  setSearchQuery: (query: string) => void;
  setActorSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Початковий стан
  isLoginModalOpen: false,
  isSignupModalOpen: false,
  isMovieDetailsModalOpen: false,
  isActorDetailsModalOpen: false,
  
  activeTab: 'search',
  
  selectedMovie: null,
  selectedActor: null,
  
  searchQuery: '',
  actorSearchQuery: '',
  
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
  
  openActorDetailsModal: (actor) => set({ 
    selectedActor: actor, 
    isActorDetailsModalOpen: true 
  }),
  closeActorDetailsModal: () => set({ 
    isActorDetailsModalOpen: false,
    selectedActor: null
  }),
  
  // Методи для навігації
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActorSearchQuery: (query) => set({ actorSearchQuery: query }),
}));