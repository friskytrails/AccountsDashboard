import React, { useState } from 'react';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

export const Avatar = React.forwardRef(({
  size = 'md',
  className = '',
  children,
  ...props
}, ref) => {
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <div
      ref={ref}
      className={`relative inline-flex items-center justify-center rounded-full bg-muted border border-border text-foreground font-bold shrink-0 overflow-hidden ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export const AvatarFallbackText = ({ className = '', children, ...props }) => (
  <span className={`uppercase font-semibold select-none ${className}`.trim()} {...props}>
    {children}
  </span>
);

export const AvatarImage = ({ src, alt = '', className = '', ...props }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) return null;

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`w-full h-full object-cover ${className}`.trim()}
      {...props}
    />
  );
};

export const AvatarBadge = ({ className = '', ...props }) => (
  <span
    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background ${className}`.trim()}
    {...props}
  />
);
