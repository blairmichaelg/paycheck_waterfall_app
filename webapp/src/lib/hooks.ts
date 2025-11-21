import { useState, useEffect } from 'react';
import { BREAKPOINTS } from './constants';

/**
 * Hook to detect if the viewport is mobile-sized.
 * Returns true when window width is <= 768px.
 * Includes resize listener for responsive updates.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= BREAKPOINTS.mobile
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= BREAKPOINTS.mobile);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
