import { useState, useEffect, useRef } from 'react';
import { BREAKPOINTS } from './constants';

/**
 * Hook to detect if the viewport is mobile-sized.
 * Returns true when window width is <= 768px.
 * Includes resize listener for responsive updates.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= BREAKPOINTS.mobile
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= BREAKPOINTS.mobile);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

/**
 * Hook to debounce effect execution.
 * Useful for expensive operations like localStorage writes.
 *
 * @param effect - The effect function to debounce
 * @param deps - Dependencies array
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 */
export function useDebouncedEffect(
  effect: () => void,
  deps: React.DependencyList,
  delay = 300
): void {
  const timeoutRef = useRef<number>();

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      effect();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);
}
