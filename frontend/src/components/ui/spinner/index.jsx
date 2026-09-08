import React from 'react';

const sizeMap = {
  xs: 'w-3 h-3 border-[1.5px]',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-10 h-10 border-4',
};

export const Spinner = React.forwardRef(({
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <div
      ref={ref}
      role="status"
      aria-label="loading"
      className={`inline-block rounded-full border-solid border-primary border-t-transparent animate-spin ${sizeClass} ${className}`.trim()}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

Spinner.displayName = 'Spinner';
