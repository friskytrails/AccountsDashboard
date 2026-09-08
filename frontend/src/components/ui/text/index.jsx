import React from 'react';

const sizeMap = {
  '2xs': 'text-[10px]',
  'xs': 'text-xs',
  'sm': 'text-sm',
  'md': 'text-base',
  'lg': 'text-lg',
  'xl': 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

export const Text = React.forwardRef(({
  size = 'md',
  bold = false,
  isTruncated = false,
  className = '',
  children,
  as: Component = 'span',
  ...props
}, ref) => {
  const sizeClass = sizeMap[size] || 'text-base';
  const weightClass = bold ? 'font-bold' : '';
  const truncateClass = isTruncated ? 'truncate' : '';

  return (
    <Component
      ref={ref}
      className={`text-foreground ${sizeClass} ${weightClass} ${truncateClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
});

Text.displayName = 'Text';
