import React from 'react';

const variantMap = {
  success: 'bg-primary/15 text-primary border-primary/30 shadow-sm shadow-primary/10',
  error: 'bg-destructive/15 text-destructive border-destructive/30 shadow-sm shadow-destructive/10',
  warning: 'bg-accent/30 text-accent-foreground border-accent/40',
  info: 'bg-primary/10 text-primary border-primary/20',
  muted: 'bg-muted/70 text-muted-foreground border-border/80',
  outline: 'border border-border/80 bg-transparent text-foreground',
  secondary: 'bg-secondary text-secondary-foreground border-border/80',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge = React.forwardRef(({
  variant = 'success',
  size = 'md',
  hasDot = false,
  className = '',
  children,
  ...props
}, ref) => {
  const vClass = variantMap[variant] || variantMap.success;
  const sClass = sizeMap[size] || sizeMap.md;

  return (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-lg border tracking-wide select-none ${vClass} ${sClass} ${className}`.trim()}
      {...props}
    >
      {hasDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success'
              ? 'bg-primary animate-pulse'
              : variant === 'error'
              ? 'bg-destructive'
              : 'bg-current'
          }`}
        />
      )}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export const BadgeText = ({ className = '', children, ...props }) => (
  <span className={`select-none ${className}`.trim()} {...props}>
    {children}
  </span>
);

export const BadgeIcon = ({ as: IconComponent, className = '', ...props }) => {
  if (!IconComponent) return null;
  return <IconComponent className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()} {...props} />;
};
