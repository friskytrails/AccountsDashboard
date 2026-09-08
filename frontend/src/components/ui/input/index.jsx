import React from 'react';

export const Input = React.forwardRef(({
  size = 'md',
  isDisabled = false,
  isInvalid = false,
  className = '',
  children,
  ...props
}, ref) => {
  const invalidClass = isInvalid ? 'border-destructive focus-within:border-destructive' : 'border-border focus-within:border-primary';
  const disabledClass = isDisabled ? 'opacity-50 pointer-events-none' : '';
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-4 py-3 text-base' : 'px-3.5 py-2.5 text-sm';

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 bg-muted border rounded-xl transition-all text-foreground ${sizeClass} ${invalidClass} ${disabledClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
});

Input.displayName = 'Input';

export const InputField = React.forwardRef(({
  className = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={`flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none min-w-0 ${className}`.trim()}
      {...props}
    />
  );
});

InputField.displayName = 'InputField';

export const InputSlot = ({ className = '', children, ...props }) => (
  <div className={`flex items-center text-muted-foreground shrink-0 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const InputIcon = ({ as: IconComponent, className = '', ...props }) => {
  if (!IconComponent) return null;
  return <IconComponent className={`w-4 h-4 shrink-0 ${className}`.trim()} {...props} />;
};
