import { useCallback, useEffect, useRef, useState } from "react";

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// Cache configuration
interface CacheConfig {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number; // Maximum number of cache entries (default: 100)
}

// Request deduplication map
const requestPromises = new Map<string, Promise<unknown>>();

/**
 * Smart caching hook with request deduplication and automatic cleanup
 */
export const useSmartCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = {}
) => {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = config;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use useRef to persist cache across re-renders
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup function to remove expired entries
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiry) {
        cache.delete(key);
      }
    }

    // Limit cache size
    if (cache.size > maxSize) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, cache.size - maxSize);
      toDelete.forEach(([k]) => cache.delete(k));
    }
  }, [maxSize]);

  // Setup periodic cleanup
  useEffect(() => {
    cleanupTimerRef.current = setInterval(cleanupCache, 60000); // Cleanup every minute

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanupCache]);

  // Check cache and fetch data
  const fetchData = useCallback(async () => {
    const cache = cacheRef.current;
    const now = Date.now();

    // Check if data exists and is not expired
    const cachedEntry = cache.get(key);
    if (cachedEntry && now < cachedEntry.expiry) {
      setData(cachedEntry.data);
      return cachedEntry.data;
    }

    // Check if request is already in progress
    if (requestPromises.has(key)) {
      try {
        const pending = requestPromises.get(key);
        const result = pending ? ((await pending) as T) : null;
        if (result !== null) {
          setData(result);
          return result;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      }
    }

    // Make new request
    setLoading(true);
    setError(null);

    const requestPromise = fetcher()
      .then((result) => {
        // Cache the result
        cache.set(key, {
          data: result,
          timestamp: now,
          expiry: now + ttl,
        });
        
        setData(result);
        return result;
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      })
      .finally(() => {
        setLoading(false);
        requestPromises.delete(key);
      });

    requestPromises.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } catch (err) {
      throw err;
    }
  }, [key, fetcher, ttl]);

  // Clear specific cache entry
  const clearCache = useCallback(() => {
    cacheRef.current.delete(key);
    setData(null);
  }, [key]);

  // Clear all cache entries
  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
    setData(null);
  }, []);

  // Prefetch data
  const prefetch = useCallback(async () => {
    try {
      await fetchData();
    } catch (err) {
      console.warn("Prefetch failed:", err);
    }
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache,
    clearAllCache,
    prefetch,
  };
};

/**
 * Hook for request deduplication without caching
 */
export const useRequestDeduplication = <T>(
  key: string,
  fetcher: () => Promise<T>
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Check if request is already in progress
    if (requestPromises.has(key)) {
      try {
        const pending = requestPromises.get(key);
        const result = pending ? ((await pending) as T) : null;
        if (result !== null) {
          setData(result);
          return result;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      }
    }

    setLoading(true);
    setError(null);

    const requestPromise = fetcher()
      .then((result) => {
        setData(result);
        return result;
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      })
      .finally(() => {
        setLoading(false);
        requestPromises.delete(key);
      });

    requestPromises.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } catch (err) {
      throw err;
    }
  }, [key, fetcher]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};

/**
 * Hook for batch API requests with deduplication
 */
export const useBatchRequests = <T>(
  requests: Array<{ key: string; fetcher: () => Promise<T> }>
) => {
  const [results, setResults] = useState<(T | null)[]>(new Array(requests.length).fill(null));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<(string | null)[]>(new Array(requests.length).fill(null));

  const executeBatch = useCallback(async () => {
    setLoading(true);
    setErrors(new Array(requests.length).fill(null));

    const promises = requests.map(async (request, index) => {
      try {
        // Check if request is already in progress
        if (requestPromises.has(request.key)) {
          const pending = requestPromises.get(request.key);
          const result = pending ? ((await pending) as T) : null;
          if (result !== null) {
            setResults(prev => {
              const newResults = [...prev];
              newResults[index] = result;
              return newResults;
            });
            return result;
          }
        }

        const requestPromise = request.fetcher()
          .then((result) => {
            setResults(prev => {
              const newResults = [...prev];
              newResults[index] = result;
              return newResults;
            });
            return result;
          })
          .catch((err) => {
            const errorMessage = err instanceof Error ? err.message : "An error occurred";
            setErrors(prev => {
              const newErrors = [...prev];
              newErrors[index] = errorMessage;
              return newErrors;
            });
            throw err;
          })
          .finally(() => {
            requestPromises.delete(request.key);
          });

        requestPromises.set(request.key, requestPromise);
        return await requestPromise;
      } catch (err) {
        throw err;
      }
    });

    try {
      await Promise.allSettled(promises);
    } finally {
      setLoading(false);
    }
  }, [requests]);

  return {
    results,
    loading,
    errors,
    executeBatch,
  };
};

/**
 * Hook for polling with smart caching
 */
export const usePolling = <T>(
  key: string,
  fetcher: () => Promise<T>,
  interval: number,
  config: CacheConfig & { enabled?: boolean } = {}
) => {
  const { enabled = true, ...cacheConfig } = config;
  const { data, refetch, clearCache } = useSmartCache(key, fetcher, cacheConfig);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    refetch();

    // Setup polling
    intervalRef.current = setInterval(() => {
      refetch();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, refetch]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!enabled || intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      refetch();
    }, interval);
  }, [enabled, interval, refetch]);

  return {
    data,
    stopPolling,
    startPolling,
    clearCache,
  };
};