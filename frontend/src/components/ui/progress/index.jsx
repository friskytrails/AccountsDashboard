import React from 'react';

export const Progress = React.forwardRef(({
  value = 0,
  size = 'md',
  className = '',
  children,
  ...props
}, ref) => {
  const heightClass = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div
      ref={ref}
      className={`w-full bg-muted rounded-full overflow-hidden ${heightClass} ${className}`.trim()}
      {...props}
    >
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, { value }) : child
      )}
    </div>
  );
});

Progress.displayName = 'Progress';

export const ProgressFilledTrack = ({ value = 0, className = '', ...props }) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`h-full bg-primary rounded-full transition-all duration-500 ${className}`.trim()}
      style={{ width: `${clamped}%` }}
      {...props}
    />
  );
};
