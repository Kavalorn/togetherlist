import React, { ReactNode } from 'react';
import { useLazyLoad } from '../hooks/useLazyLoad';
import { AnimatedItem } from './AnimatedItem';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface HasId {
  id?: string | number;
  [key: string]: any;
}

type LazyLoadListProps<T extends HasId> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  containerClassName?: string;
  lazyLoadOptions?: {
    initialCount?: number;
    batchSize?: number;
    loadingDelay?: number;
    rootMargin?: string;
  };
  showLoadMoreButton?: boolean;
  loadMoreText?: string;
  loadingText?: string;
  animationOptions?: {
    delayBase?: number;
    newBatchDelayBase?: number;
    batchSize?: number;
  };
}

export function LazyLoadList<T extends HasId>({
  items,
  renderItem,
  containerClassName = '',
  lazyLoadOptions = {},
  showLoadMoreButton = true,
  loadMoreText = 'Завантажити ще',
  loadingText = 'Завантаження...',
  animationOptions = {},
}: LazyLoadListProps<T>): JSX.Element {
  const {
    getVisibleItems,
    lastBatchCount,
    lastItemRef,
    isLoadingMore,
    loadMoreItems,
    hasMoreItems
  } = useLazyLoad<T>(lazyLoadOptions);

  const visibleItems: T[] = getVisibleItems(items);
  const moreItemsAvailable: boolean = hasMoreItems(items);

  return (
    <>
      <div className={containerClassName}>
        {visibleItems.map((item: T, index: number) => {
          const isLastItem: boolean = index === visibleItems.length - 1;
          const isNewBatch: boolean = index >= lastBatchCount;
          
          return (
            <div 
              key={item.id?.toString() || `item-${index}`}
              ref={isLastItem && moreItemsAvailable ? lastItemRef : undefined}
              className="h-full flex flex-col"
            >
              <AnimatedItem 
                index={index} 
                isNewBatch={isNewBatch}
                delayBase={animationOptions.delayBase}
                newBatchDelayBase={animationOptions.newBatchDelayBase}
                batchSize={animationOptions.batchSize}
              >
                {renderItem(item, index)}
              </AnimatedItem>
            </div>
          );
        })}
      </div>
      
      {showLoadMoreButton && moreItemsAvailable && (
        <div className="flex justify-center mt-8 mb-8">
          <Button 
            onClick={loadMoreItems} 
            variant="outline" 
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
              </>
            ) : (
              loadMoreText
            )}
          </Button>
        </div>
      )}
      
      {isLoadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </>
  );
}