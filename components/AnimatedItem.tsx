import React, { useState, useEffect, useRef, ReactNode } from 'react';

type AnimatedItemProps = {
  children: ReactNode;
  index: number;
  isNewBatch?: boolean;
  delayBase?: number;
  newBatchDelayBase?: number;
  batchSize?: number;
  className?: string;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({ 
  children, 
  index, 
  isNewBatch = false,
  delayBase = 100,
  newBatchDelayBase = 50,
  batchSize = 9,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const delay: number = isNewBatch 
      ? (index % batchSize) * newBatchDelayBase 
      : index * delayBase;
    
    const timer: NodeJS.Timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [index, isNewBatch, delayBase, newBatchDelayBase, batchSize]);
  
  return (
    <div 
      ref={itemRef} 
      className={`transition-all duration-500 ease-in-out h-full ${className} ${
        isVisible 
          ? 'opacity-100 transform translate-y-0' 
          : 'opacity-0 transform translate-y-8'
      }`}
    >
      {children}
    </div>
  );
};