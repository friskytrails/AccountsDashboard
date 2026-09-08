import React from 'react';

const sizeMap = {
  '2xs': 'w-3 h-3',
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
  '2xl': 'w-8 h-8',
};

export const Icon = React.forwardRef(({
  as: IconComponent,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  if (!IconComponent) return null;
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <IconComponent
      ref={ref}
      className={`shrink-0 ${sizeClass} ${className}`.trim()}
      {...props}
    />
  );
});

Icon.displayName = 'Icon';

export const createIcon = ({ viewBox = '0 0 24 24', path, displayName = 'CustomIcon' }) => {
  const Component = React.forwardRef(({ size = 'md', className = '', ...props }, ref) => {
    const sizeClass = sizeMap[size] || sizeMap.md;
    return (
      <svg
        ref={ref}
        viewBox={viewBox}
        fill="currentColor"
        className={`shrink-0 ${sizeClass} ${className}`.trim()}
        {...props}
      >
        {path}
      </svg>
    );
  });
  Component.displayName = displayName;
  return Component;
};
