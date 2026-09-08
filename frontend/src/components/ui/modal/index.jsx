import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen = false,
  onClose,
  children,
  size = 'md',
  ...props
}) => {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" {...props}>
      {children}
    </div>
  );
};

export const ModalBackdrop = ({ onClose, className = '', ...props }) => (
  <div
    onClick={onClose}
    className={`fixed inset-0 bg-black/70 backdrop-blur-sm -z-10 cursor-pointer ${className}`.trim()}
    {...props}
  />
);

export const ModalContent = ({ className = '', children, ...props }) => (
  <div
    className={`bg-card text-card-foreground border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 ${className}`.trim()}
    {...props}
  >
    {children}
  </div>
);

export const ModalHeader = ({ className = '', children, ...props }) => (
  <div className={`mb-5 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const ModalBody = ({ className = '', children, ...props }) => (
  <div className={`space-y-4 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const ModalFooter = ({ className = '', children, ...props }) => (
  <div className={`flex items-center justify-end gap-3 pt-4 border-t border-border mt-4 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const ModalCloseButton = ({ onClose, className = '', ...props }) => (
  <button
    type="button"
    onClick={onClose}
    className={`absolute top-5 right-5 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ${className}`.trim()}
    {...props}
  >
    <X className="w-5 h-5" />
  </button>
);
