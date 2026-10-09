import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      <div 
        className="relative bg-surface border border-borderSubtle rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-6 border-b border-borderSubtle">
          <h3 className="text-xl font-bold text-textPrimary">{title}</h3>
          <button 
            onClick={onClose}
            className="text-textSecondary hover:text-textPrimary transition-colors p-1 rounded-md hover:bg-surfaceSecondary"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
