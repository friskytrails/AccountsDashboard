import React from 'react';

const spaceMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-10',
  '3xl': 'gap-12',
  '4xl': 'gap-16',
};

export const HStack = React.forwardRef(({
  space = 'md',
  reversed = false,
  className = '',
  children,
  ...props
}, ref) => {
  const gapClass = spaceMap[space] || 'gap-4';
  const dirClass = reversed ? 'flex-row-reverse' : 'flex-row';

  return (
    <div
      ref={ref}
      className={`flex ${dirClass} items-center ${gapClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
});

HStack.displayName = 'HStack';
