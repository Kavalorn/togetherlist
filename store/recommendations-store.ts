// store/recommendations-store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecommendationsState {
  excludeWatched: boolean;
  excludeWatchlisted: boolean;
  setExcludeWatched: (value: boolean) => void;
  setExcludeWatchlisted: (value: boolean) => void;
}

export const useRecommendationsStore = create<RecommendationsState>()(
  persist(
    (set) => ({
      excludeWatched: true,
      excludeWatchlisted: true,
      setExcludeWatched: (value) => set({ excludeWatched: value }),
      setExcludeWatchlisted: (value) => set({ excludeWatchlisted: value }),
    }),
    {
      name: 'movie-recommendations-settings',
    }
  )
);