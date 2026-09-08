import React from 'react';

export const Card = React.forwardRef(({
  size = 'md',
  variant = 'elevated',
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-card/85 backdrop-blur-xl text-card-foreground rounded-2xl border border-border/80 shadow-xl transition-all duration-300 hover:border-border hover:shadow-2xl ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`p-6 border-b border-border/60 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardBody = ({ className = '', children, ...props }) => (
  <div className={`p-6 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }) => (
  <div className={`p-6 border-t border-border/60 flex items-center ${className}`.trim()} {...props}>
    {children}
  </div>
);
