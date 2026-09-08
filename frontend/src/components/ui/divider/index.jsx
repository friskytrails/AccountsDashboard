import React from 'react';

export const Divider = React.forwardRef(({
  orientation = 'horizontal',
  className = '',
  ...props
}, ref) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={`border-border ${
        isHorizontal ? 'w-full border-t my-2' : 'h-full border-l mx-2'
      } ${className}`.trim()}
      {...props}
    />
  );
});

Divider.displayName = 'Divider';
