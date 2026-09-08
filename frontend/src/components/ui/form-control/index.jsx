import React, { createContext, useContext } from 'react';

const FormControlContext = createContext({
  isInvalid: false,
  isDisabled: false,
  isRequired: false,
  size: 'md',
});

export const useFormControl = () => useContext(FormControlContext);

export const FormControl = React.forwardRef(({
  isInvalid = false,
  isDisabled = false,
  isRequired = false,
  size = 'md',
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <FormControlContext.Provider value={{ isInvalid, isDisabled, isRequired, size }}>
      <div
        ref={ref}
        className={`flex flex-col gap-1.5 w-full ${isDisabled ? 'opacity-50 pointer-events-none' : ''} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    </FormControlContext.Provider>
  );
});

FormControl.displayName = 'FormControl';

export const FormControlLabel = ({ className = '', children, ...props }) => {
  const { isRequired } = useFormControl();
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold text-foreground ${className}`.trim()} {...props}>
      {children}
      {isRequired && <span className="text-destructive">*</span>}
    </div>
  );
};

export const FormControlLabelText = ({ className = '', children, ...props }) => (
  <span className={className} {...props}>
    {children}
  </span>
);

export const FormControlHelper = ({ className = '', children, ...props }) => (
  <div className={`text-[11px] text-muted-foreground ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const FormControlHelperText = ({ className = '', children, ...props }) => (
  <span className={className} {...props}>
    {children}
  </span>
);

export const FormControlError = ({ className = '', children, ...props }) => {
  const { isInvalid } = useFormControl();
  if (!isInvalid) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs text-destructive font-medium ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export const FormControlErrorText = ({ className = '', children, ...props }) => (
  <span className={className} {...props}>
    {children}
  </span>
);

export const FormControlErrorIcon = ({ as: IconComponent, className = '', ...props }) => {
  if (!IconComponent) return null;
  return <IconComponent className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()} {...props} />;
};
