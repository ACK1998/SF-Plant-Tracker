import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const InfiniteScroll = ({ 
  children, 
  onLoadMore, 
  hasMore, 
  loading, 
  threshold = 100,
  className = ""
}) => {

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, onLoadMore, threshold]);

  return (
    <div className={className}>
      {children}
      
      {/* Sentinel element for intersection observer */}
      <div ref={sentinelRef} className="h-4" />
      
      {/* Loading indicator */}
      {loading && hasMore && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-plant-green-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading more plants...</span>
          </div>
        </div>
      )}
      
      {/* End of content indicator */}
      {!hasMore && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 text-sm">
            🌱 You've reached the end of your plant collection
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteScroll;
