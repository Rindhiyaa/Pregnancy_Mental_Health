import { useState, useEffect, useRef } from "react";

export const useContentWidth = () => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Content-aware breakpoints based on actual available space
  const isMobile = width > 0 && width < 500;
  const isTablet = width >= 500 && width < 780;
  const isDesktop = width >= 780;

  return { 
    ref, 
    width, 
    isMobile, 
    isTablet, 
    isDesktop 
  };
};

export default useContentWidth;