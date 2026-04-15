import { useState, useEffect } from 'react';
import { 
  getBreakpoint, 
  getResponsiveConfig, 
  isBreakpointUp, 
  isBreakpointDown,
  debounce,
  MEDIA_QUERIES 
} from '../utils/breakpoints';

/**
 * Custom hook for responsive breakpoint management
 * Provides current breakpoint, responsive config, and utility functions
 */
export const useBreakpoint = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const [breakpoint, setBreakpoint] = useState(() => 
    getBreakpoint(windowSize.width)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = debounce(() => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const newBreakpoint = getBreakpoint(newWidth);

      setWindowSize({ width: newWidth, height: newHeight });
      
      if (newBreakpoint !== breakpoint) {
        setBreakpoint(newBreakpoint);
      }
    }, 150);

    window.addEventListener('resize', handleResize);
    
    // Call once to set initial values
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  // Get responsive configuration for current breakpoint
  const config = getResponsiveConfig(breakpoint);

  // Utility functions
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isLaptop = breakpoint === 'laptop';
  const isDesktop = breakpoint === 'desktop';

  // Breakpoint comparison utilities
  const isTabletUp = isBreakpointUp(windowSize.width, 'tablet');
  const isLaptopUp = isBreakpointUp(windowSize.width, 'laptop');
  const isDesktopUp = isBreakpointUp(windowSize.width, 'desktop');

  const isMobileDown = isBreakpointDown(windowSize.width, 'tablet');
  const isTabletDown = isBreakpointDown(windowSize.width, 'laptop');
  const isLaptopDown = isBreakpointDown(windowSize.width, 'desktop');

  return {
    // Current state
    windowSize,
    breakpoint,
    config,

    // Exact breakpoint checks
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,

    // Range checks (mobile-first)
    isTabletUp,
    isLaptopUp,
    isDesktopUp,

    // Range checks (desktop-first)
    isMobileDown,
    isTabletDown,
    isLaptopDown,

    // Responsive behavior flags
    showSidebar: config.showSidebar,
    sidebarWidth: config.sidebarWidth,
    gridColumns: config.columns,
    containerPadding: config.padding
  };
};

/**
 * Hook for listening to specific media queries
 * @param {string} query - Media query string or predefined key
 * @returns {boolean} Whether the media query matches
 */
export const useMediaQuery = (query) => {
  // Use predefined query if it exists
  const mediaQuery = MEDIA_QUERIES[query] || query;
  
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(mediaQuery).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(mediaQuery);
    
    const handleChange = (e) => setMatches(e.matches);
    
    // Set initial value
    setMatches(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleChange);
      return () => mediaQueryList.removeListener(handleChange);
    }
  }, [mediaQuery]);

  return matches;
};

/**
 * Hook for responsive values based on breakpoints
 * @param {object} values - Object with breakpoint keys and values
 * @returns {any} Value for current breakpoint
 */
export const useResponsiveValue = (values) => {
  const { breakpoint } = useBreakpoint();
  
  // Fallback order: current -> laptop -> tablet -> mobile
  return values[breakpoint] || 
         values.laptop || 
         values.tablet || 
         values.mobile || 
         Object.values(values)[0];
};

export default useBreakpoint;