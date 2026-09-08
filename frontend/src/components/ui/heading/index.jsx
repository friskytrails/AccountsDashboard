import React from 'react';

const sizeMap = {
  xs: 'text-sm font-semibold',
  sm: 'text-base font-bold',
  md: 'text-lg font-bold',
  lg: 'text-xl font-bold',
  xl: 'text-2xl font-bold',
  '2xl': 'text-3xl font-bold',
  '3xl': 'text-4xl font-extrabold',
  '4xl': 'text-5xl font-extrabold',
};

export const Heading = React.forwardRef(({
  size = 'lg',
  bold = true,
  className = '',
  children,
  as: Component = 'h2',
  ...props
}, ref) => {
  const sizeClass = sizeMap[size] || 'text-xl font-bold';
  const weightClass = bold ? 'font-bold' : '';

  return (
    <Component
      ref={ref}
      className={`text-foreground tracking-tight ${sizeClass} ${weightClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
});

Heading.displayName = 'Heading';
