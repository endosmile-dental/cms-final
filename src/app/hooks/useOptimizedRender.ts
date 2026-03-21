import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Hook to optimize component rendering by memoizing expensive calculations
 * and preventing unnecessary re-renders
 */
export const useOptimizedRender = <T>(
  dependencies: unknown[],
  calculate: () => T,
  isEqual?: (a: T, b: T) => boolean
): T => {
  const prevResultRef = useRef<T | null>(null);
  const prevDepsRef = useRef<unknown[] | null>(null);

  const hasChanged =
    !prevDepsRef.current ||
    dependencies.length != prevDepsRef.current.length ||
    dependencies.some((dep, index) => dep !== prevDepsRef.current![index]);

  if (!hasChanged && prevResultRef.current !== null) {
    return prevResultRef.current;
  }

  const result = calculate();

  if (isEqual && prevResultRef.current !== null) {
    if (isEqual(prevResultRef.current, result)) {
      return prevResultRef.current;
    }
  }

  prevResultRef.current = result;
  prevDepsRef.current = dependencies;
  return result;
};

/**
 * Hook to create stable callback references that only change when dependencies change
 */
export const useStableCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  dependencies: unknown[]
): T => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, dependencies]);

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
};

/**
 * Hook to debounce function calls
 */
export const useDebounce = <Args extends unknown[], R>(
  callback: (...args: Args) => R,
  delay: number
): ((...args: Args) => void) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounced = useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debounced;
};

/**
 * Hook to throttle function calls
 */
export const useThrottle = <Args extends unknown[], R>(
  callback: (...args: Args) => R,
  delay: number
): ((...args: Args) => void) => {
  const lastCallRef = useRef<number>(0);

  const throttled = useCallback(
    (...args: Args) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  );

  return throttled;
};

/**
 * Hook to create virtualized data for long lists
 */
export const useVirtualization = <T>(
  data: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, data.length]);

  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [data, visibleRange]);

  const totalHeight = data.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange,
  };
};

/**
 * Hook to optimize search functionality with debouncing
 */
export const useSearchOptimization = <T>(
  data: T[],
  searchFields: (keyof T)[],
  debounceDelay: number = 300
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState<T[]>(data);

  const debouncedSearch = useDebounce(
    (query: string) => {
      if (!query.trim()) {
        setFilteredData(data);
        return;
      }

      const filtered = data.filter((item) => {
        const searchStr = searchFields
          .map((field) => String(item[field]).toLowerCase())
          .join(" ");
        return searchStr.includes(query.toLowerCase());
      });

      setFilteredData(filtered);
    },
    debounceDelay
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  return {
    searchQuery,
    filteredData,
    handleSearch,
  };
};

/**
 * Hook to optimize expensive calculations with lazy evaluation
 */
export const useLazyCalculation = <T>(
  calculate: () => T,
  dependencies: unknown[],
  shouldCalculate: boolean = true
): T | null => {
  const [result, setResult] = useState<T | null>(null);
  const hasCalculatedRef = useRef(false);

  useEffect(() => {
    hasCalculatedRef.current = false;
    if (!shouldCalculate) {
      setResult(null);
    }
  }, [shouldCalculate, dependencies]);

  useEffect(() => {
    if (shouldCalculate && !hasCalculatedRef.current) {
      const calculatedResult = calculate();
      setResult(calculatedResult);
      hasCalculatedRef.current = true;
    }
  }, [shouldCalculate, calculate, dependencies]);

  return result;
};

/**
 * Hook to create memoized selectors for complex data transformations
 */
export const useSelector = <T, R>(
  data: T,
  selector: (data: T) => R,
  dependencies: unknown[] = []
): R => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => selector(data), [data, selector, dependencies]);
};

/**
 * Hook to optimize state updates with batching
 */
export const useBatchedState = <T>(
  initialState: T
): [T, (updates: Partial<T>) => void] => {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdatesRef = useRef<Partial<T>>({});

  const batchedSetState = useCallback((updates: Partial<T>) => {
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
    
    // Use setTimeout to batch multiple updates in the same event loop
    setTimeout(() => {
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        setState(prevState => ({ ...prevState, ...pendingUpdatesRef.current }));
        pendingUpdatesRef.current = {};
      }
    }, 0);
  }, []);

  return [state, batchedSetState];
};