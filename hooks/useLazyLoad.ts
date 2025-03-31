import { useState, useRef, useCallback, useEffect } from 'react';

type UseLazyLoadOptions = {
  initialCount?: number;
  batchSize?: number;
  loadingDelay?: number;
  rootMargin?: string;
}

type UseLazyLoadReturn<T> = {
  visibleCount: number;
  isLoadingMore: boolean;
  lastBatchCount: number;
  lastItemRef: (node: HTMLElement | null) => void;
  loadMoreItems: () => void;
  resetList: () => void;
  getVisibleItems: (items: T[]) => T[];
  hasMoreItems: (items: T[]) => boolean;
}

export function useLazyLoad<T>(options: UseLazyLoadOptions = {}): UseLazyLoadReturn<T> {
  const {
    initialCount = 8,
    batchSize = 8,
    loadingDelay = 800,
    rootMargin = '200px',
  } = options;

  const [visibleCount, setVisibleCount] = useState<number>(initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [lastBatchCount, setLastBatchCount] = useState<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Function to load more items
  const loadMoreItems = useCallback((): void => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    setLastBatchCount(visibleCount);
    
    setTimeout(() => {
      setVisibleCount(prev => prev + batchSize);
      setIsLoadingMore(false);
    }, loadingDelay);
  }, [isLoadingMore, visibleCount, batchSize, loadingDelay]);

  // Reset visible count when filters change
  const resetList = useCallback((): void => {
    setVisibleCount(initialCount);
    setLastBatchCount(0);
  }, [initialCount]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Ref callback for the last visible item
  const lastItemRef = useCallback(
    (node: HTMLElement | null): void => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // If no node, do nothing
      if (!node) return;
      
      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          if (entries[0].isIntersecting) {
            loadMoreItems();
          }
        },
        { rootMargin, threshold: 0.1 }
      );
      
      // Start observing
      observerRef.current.observe(node);
    },
    [loadMoreItems, rootMargin]
  );

  // Slice array to get visible items
  const getVisibleItems = useCallback(
    (items: T[]): T[] => {
      return items.slice(0, visibleCount);
    },
    [visibleCount]
  );

  // Check if there are more items to load
  const hasMoreItems = useCallback(
    (items: T[]): boolean => {
      return items.length > visibleCount;
    },
    [visibleCount]
  );

  return {
    visibleCount,
    isLoadingMore,
    lastBatchCount,
    lastItemRef,
    loadMoreItems,
    resetList,
    getVisibleItems,
    hasMoreItems,
  };
}