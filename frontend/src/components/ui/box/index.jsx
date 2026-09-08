import React from 'react';

export const Box = React.forwardRef(({ className = '', children, as: Component = 'div', ...props }, ref) => {
  return (
    <Component ref={ref} className={className} {...props}>
      {children}
    </Component>
  );
});

Box.displayName = 'Box';
