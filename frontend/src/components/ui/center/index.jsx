import React from 'react';

export const Center = React.forwardRef(({
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`flex items-center justify-center ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
});

Center.displayName = 'Center';
