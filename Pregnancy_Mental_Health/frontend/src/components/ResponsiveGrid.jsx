import React from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';

/**
 * ResponsiveGrid Component
 * Provides flexible grid layouts that adapt to different screen sizes
 */
const ResponsiveGrid = ({ 
  children, 
  columns = 'auto', 
  gap = 'lg',
  className = '',
  minItemWidth = '280px',
  ...props 
}) => {
  const { breakpoint } = useBreakpoint();

  // Determine grid class based on columns prop
  const getGridClass = () => {
    if (typeof columns === 'number') {
      return `grid-${Math.min(columns, 4)}`;
    }
    
    if (columns === 'auto') {
      return 'grid-auto';
    }
    
    if (columns === 'stats') {
      return 'stats-grid';
    }
    
    if (columns === 'cards') {
      return 'cards-grid';
    }
    
    return 'grid-auto';
  };

  const gridClass = getGridClass();
  const gapClass = `gap-${gap}`;
  
  // Custom styles for auto-fit with custom min width
  const customStyles = columns === 'auto' && minItemWidth !== '280px' ? {
    gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
  } : {};

  return (
    <div 
      className={`grid ${gridClass} ${gapClass} ${className}`.trim()}
      style={customStyles}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * StatsGrid Component
 * Specialized grid for dashboard statistics
 */
export const StatsGrid = ({ children, className = '', ...props }) => (
  <ResponsiveGrid 
    columns="stats" 
    gap="lg" 
    className={`stats-grid ${className}`.trim()}
    {...props}
  >
    {children}
  </ResponsiveGrid>
);

/**
 * CardsGrid Component  
 * Specialized grid for content cards
 */
export const CardsGrid = ({ children, className = '', minWidth = '300px', ...props }) => (
  <ResponsiveGrid 
    columns="cards" 
    gap="xl" 
    minItemWidth={minWidth}
    className={`cards-grid ${className}`.trim()}
    {...props}
  >
    {children}
  </ResponsiveGrid>
);

/**
 * Container Component
 * Responsive container with proper padding and max-width
 */
export const Container = ({ children, className = '', ...props }) => (
  <div className={`container ${className}`.trim()} {...props}>
    {children}
  </div>
);

/**
 * FlexBox Component
 * Utility component for flexbox layouts
 */
export const Flex = ({ 
  children, 
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  gap = 'md',
  className = '',
  ...props 
}) => {
  const directionClass = direction === 'column' ? 'flex-col' : 'flex-row';
  const alignClass = align !== 'stretch' ? `items-${align}` : '';
  const justifyClass = justify !== 'start' ? `justify-${justify}` : '';
  const wrapClass = wrap ? 'flex-wrap' : '';
  const gapClass = `gap-${gap}`;

  return (
    <div 
      className={`flex ${directionClass} ${alignClass} ${justifyClass} ${wrapClass} ${gapClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Grid Item Component
 * For controlling individual grid items
 */
export const GridItem = ({ 
  children, 
  span = 1, 
  spanTablet, 
  spanDesktop,
  className = '',
  ...props 
}) => {
  const { isTabletUp, isDesktopUp } = useBreakpoint();
  
  let gridColumn = `span ${span}`;
  
  if (isDesktopUp && spanDesktop) {
    gridColumn = `span ${spanDesktop}`;
  } else if (isTabletUp && spanTablet) {
    gridColumn = `span ${spanTablet}`;
  }

  return (
    <div 
      className={className}
      style={{ gridColumn }}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;