import React from 'react';

export const Pressable = React.forwardRef(({
  onPress,
  disabled = false,
  className = '',
  children,
  as: Component = 'button',
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      type={Component === 'button' ? 'button' : undefined}
      disabled={disabled}
      onClick={onPress}
      className={`transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
});

Pressable.displayName = 'Pressable';
