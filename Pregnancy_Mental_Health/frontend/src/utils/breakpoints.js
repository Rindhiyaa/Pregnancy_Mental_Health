/**
 * Breakpoint Configuration and Utilities
 * Mobile-first responsive design system
 */

// Breakpoint definitions (must match CSS variables)
export const BREAKPOINTS = {
  mobile: 320,
  tablet: 600,
  laptop: 900,
  desktop: 1200,
  xl: 1440
};

// Media query strings for JavaScript
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.laptop - 1}px)`,
  laptop: `(min-width: ${BREAKPOINTS.laptop}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  
  // Min-width queries (mobile-first)
  tabletUp: `(min-width: ${BREAKPOINTS.tablet}px)`,
  laptopUp: `(min-width: ${BREAKPOINTS.laptop}px)`,
  desktopUp: `(min-width: ${BREAKPOINTS.desktop}px)`,
  xlUp: `(min-width: ${BREAKPOINTS.xl}px)`,
  
  // Max-width queries
  mobileDown: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  tabletDown: `(max-width: ${BREAKPOINTS.laptop - 1}px)`,
  laptopDown: `(max-width: ${BREAKPOINTS.desktop - 1}px)`
};

/**
 * Get current breakpoint based on window width
 * @param {number} width - Window width in pixels
 * @returns {string} Current breakpoint name
 */
export const getBreakpoint = (width) => {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.laptop) return 'laptop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

/**
 * Check if current width matches a breakpoint
 * @param {number} width - Window width in pixels
 * @param {string} breakpoint - Breakpoint to check
 * @returns {boolean}
 */
export const isBreakpoint = (width, breakpoint) => {
  return getBreakpoint(width) === breakpoint;
};

/**
 * Check if current width is at or above a breakpoint
 * @param {number} width - Window width in pixels
 * @param {string} breakpoint - Minimum breakpoint
 * @returns {boolean}
 */
export const isBreakpointUp = (width, breakpoint) => {
  return width >= BREAKPOINTS[breakpoint];
};

/**
 * Check if current width is below a breakpoint
 * @param {number} width - Window width in pixels
 * @param {string} breakpoint - Maximum breakpoint
 * @returns {boolean}
 */
export const isBreakpointDown = (width, breakpoint) => {
  return width < BREAKPOINTS[breakpoint];
};

/**
 * Get responsive configuration based on breakpoint
 * @param {string} breakpoint - Current breakpoint
 * @returns {object} Configuration object
 */
export const getResponsiveConfig = (breakpoint) => {
  const configs = {
    mobile: {
      columns: 1,
      padding: '1rem',
      fontSize: '14px',
      sidebarWidth: '100%',
      showSidebar: false,
      gridGap: '1rem'
    },
    tablet: {
      columns: 2,
      padding: '1.5rem',
      fontSize: '15px',
      sidebarWidth: '280px',
      showSidebar: false,
      gridGap: '1.5rem'
    },
    laptop: {
      columns: 3,
      padding: '2rem',
      fontSize: '16px',
      sidebarWidth: '280px',
      showSidebar: true,
      gridGap: '2rem'
    },
    desktop: {
      columns: 4,
      padding: '2rem',
      fontSize: '16px',
      sidebarWidth: '300px',
      showSidebar: true,
      gridGap: '2rem'
    }
  };
  
  return configs[breakpoint] || configs.mobile;
};

/**
 * Debounce function for resize events
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Create a media query listener
 * @param {string} query - Media query string
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function
 */
export const createMediaQueryListener = (query, callback) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia(query);
  
  // Call immediately with current state
  callback(mediaQuery.matches);
  
  // Add listener for changes
  const listener = (e) => callback(e.matches);
  
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }
};