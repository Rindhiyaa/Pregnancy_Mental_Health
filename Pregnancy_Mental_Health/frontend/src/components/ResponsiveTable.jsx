import React from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';

/**
 * ResponsiveTable Component
 * Automatically adapts table layout for mobile devices
 */
const ResponsiveTable = ({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}) => {
  const { isMobileDown } = useBreakpoint();
  
  const getTableClasses = () => {
    let classes = 'responsive-table';
    
    if (variant === 'compact') classes += ' table-compact';
    if (variant === 'striped') classes += ' table-striped';
    if (variant === 'bordered') classes += ' table-bordered';
    
    return `${classes} ${className}`.trim();
  };

  // On mobile, we don't need the wrapper since we use card layout
  if (isMobileDown) {
    return (
      <div className="table-responsive">
        <table className={getTableClasses()} {...props}>
          {children}
        </table>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className={getTableClasses()} {...props}>
        {children}
      </table>
    </div>
  );
};

/**
 * TableHeader Component
 * Responsive table header with proper accessibility
 */
export const TableHeader = ({ children, className = '', ...props }) => (
  <thead className={className} {...props}>
    {children}
  </thead>
);

/**
 * TableBody Component
 * Responsive table body
 */
export const TableBody = ({ children, className = '', ...props }) => (
  <tbody className={className} {...props}>
    {children}
  </tbody>
);

/**
 * TableRow Component
 * Responsive table row
 */
export const TableRow = ({ children, className = '', ...props }) => (
  <tr className={className} {...props}>
    {children}
  </tr>
);

/**
 * TableHeaderCell Component
 * Table header cell with sorting support
 */
export const TableHeaderCell = ({ 
  children, 
  sortable = false,
  sortDirection = null,
  onSort = null,
  className = '',
  ...props 
}) => {
  const handleSort = () => {
    if (sortable && onSort) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(newDirection);
    }
  };

  return (
    <th 
      className={`${sortable ? 'cursor-pointer' : ''} ${className}`.trim()}
      onClick={handleSort}
      {...props}
    >
      <div className="flex items-center gap-xs">
        {children}
        {sortable && (
          <span className="text-gray-400">
            {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </div>
    </th>
  );
};

/**
 * TableCell Component
 * Responsive table cell with mobile label support
 */
export const TableCell = ({ 
  children, 
  label = '',
  className = '',
  ...props 
}) => (
  <td 
    className={className}
    data-label={label}
    {...props}
  >
    {children}
  </td>
);

/**
 * TableStatus Component
 * Status badge for table cells
 */
export const TableStatus = ({ 
  status = 'active',
  children,
  className = ''
}) => {
  const statusClass = `table-status status-${status.toLowerCase()}`;
  
  return (
    <span className={`${statusClass} ${className}`.trim()}>
      {children || status}
    </span>
  );
};

/**
 * TableActions Component
 * Action buttons container for table cells
 */
export const TableActions = ({ children, className = '' }) => (
  <div className={`table-actions ${className}`.trim()}>
    {children}
  </div>
);

/**
 * TableActionButton Component
 * Touch-friendly action button for tables
 */
export const TableActionButton = ({ 
  children,
  variant = 'default',
  onClick,
  className = '',
  ...props
}) => {
  const buttonClass = `table-action-btn ${variant === 'primary' ? 'btn-primary' : ''}`;
  
  return (
    <button 
      className={`${buttonClass} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * TableEmpty Component
 * Empty state for tables
 */
export const TableEmpty = ({ message = 'No data available', className = '' }) => (
  <tr>
    <td colSpan="100%" className="table-empty">
      <div className={className}>
        {message}
      </div>
    </td>
  </tr>
);

/**
 * TableLoading Component
 * Loading state for tables
 */
export const TableLoading = ({ message = 'Loading...', className = '' }) => (
  <tr>
    <td colSpan="100%" className="table-loading">
      <div className={className}>
        {message}
      </div>
    </td>
  </tr>
);

export default ResponsiveTable;