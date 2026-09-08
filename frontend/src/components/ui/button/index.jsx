import React from 'react';

const variantMap = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-destructive/20',
  outline: 'border border-border bg-transparent text-foreground hover:bg-muted',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
  link: 'text-primary underline-offset-4 hover:underline bg-transparent',
};

const sizeMap = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 py-2 text-sm',
  lg: 'h-11 px-8 text-base',
  icon: 'h-9 w-9 p-0',
};

export const Button = React.forwardRef(({
  variant = 'default',
  size = 'default',
  isDisabled = false,
  isLoading = false,
  className = '',
  children,
  as: Component = 'button',
  ...props
}, ref) => {
  const vClass = variantMap[variant] || variantMap.default;
  const sClass = sizeMap[size] || sizeMap.default;

  return (
    <Component
      ref={ref}
      type={Component === 'button' ? 'button' : undefined}
      disabled={isDisabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${vClass} ${sClass} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </Component>
  );
});

Button.displayName = 'Button';

export const ButtonText = ({ className = '', children, ...props }) => (
  <span className={`truncate select-none ${className}`.trim()} {...props}>
    {children}
  </span>
);

export const ButtonIcon = ({ as: IconComponent, className = '', ...props }) => {
  if (!IconComponent) return null;
  return <IconComponent className={`w-4 h-4 shrink-0 ${className}`.trim()} {...props} />;
};

export const ButtonSpinner = ({ className = '', ...props }) => (
  <span
    role="status"
    aria-label="loading"
    className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`.trim()}
    {...props}
  />
);

export const ButtonGroup = ({ space = 'sm', className = '', children, ...props }) => {
  const spaceClass = space === 'xs' ? 'gap-1' : space === 'lg' ? 'gap-4' : 'gap-2';
  return (
    <div className={`inline-flex items-center ${spaceClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};
