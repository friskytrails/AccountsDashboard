import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const SelectContext = createContext({
  value: '',
  onValueChange: () => {},
  isOpen: false,
  setIsOpen: () => {},
  disabled: false,
});

export const Select = ({
  selectedValue = '',
  onValueChange,
  isDisabled = false,
  children,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <SelectContext.Provider
      value={{
        value: selectedValue,
        onValueChange: (val) => {
          onValueChange?.(val);
          setIsOpen(false);
        },
        isOpen,
        setIsOpen,
        disabled: isDisabled,
      }}
    >
      <div
        ref={selectRef}
        className={`relative w-full ${isDisabled ? 'opacity-50 pointer-events-none' : ''} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = React.forwardRef(({
  variant = 'outline',
  size = 'md',
  className = '',
  children,
  ...props
}, ref) => {
  const { isOpen, setIsOpen, disabled } = useContext(SelectContext);

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={() => setIsOpen(!isOpen)}
      className={`w-full flex items-center justify-between bg-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground hover:bg-muted/80 focus:outline-none focus:border-primary transition-all cursor-pointer ${
        isOpen ? 'border-primary ring-1 ring-primary/20' : ''
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

export const SelectInput = ({ placeholder = 'Select an option', className = '', ...props }) => {
  const { value } = useContext(SelectContext);
  return (
    <span
      className={`truncate text-left flex-1 ${!value ? 'text-muted-foreground' : 'text-foreground font-medium'} ${className}`.trim()}
      {...props}
    >
      {value || placeholder}
    </span>
  );
};

export const SelectIcon = ({ as: IconComponent = ChevronDown, className = '', ...props }) => {
  const { isOpen } = useContext(SelectContext);
  return (
    <IconComponent
      className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
        isOpen ? 'rotate-180' : ''
      } ${className}`.trim()}
      {...props}
    />
  );
};

export const SelectPortal = ({ children }) => <>{children}</>;
export const SelectBackdrop = () => null;

export const SelectContent = ({ className = '', children, ...props }) => {
  const { isOpen } = useContext(SelectContext);
  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-card border border-border rounded-xl p-1 shadow-xl animate-in fade-in-80 zoom-in-95 duration-150 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export const SelectItem = ({ label, value, className = '', children, ...props }) => {
  const { value: selectedValue, onValueChange } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  return (
    <div
      onClick={() => onValueChange(value)}
      className={`flex items-center px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'bg-primary text-primary-foreground font-semibold'
          : 'text-foreground hover:bg-muted'
      } ${className}`.trim()}
      {...props}
    >
      {children || <span>{label}</span>}
    </div>
  );
};

export const SelectItemText = ({ className = '', children, ...props }) => (
  <span className={className} {...props}>
    {children}
  </span>
);
