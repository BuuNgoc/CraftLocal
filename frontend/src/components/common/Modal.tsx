import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#FFFDF8] rounded-3xl shadow-[0_24px_80px_rgba(61,43,31,0.15)] border border-[#EAD8CC] w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease-out]`}>
        <div className="flex items-center justify-between p-6 border-b border-[#EAD8CC]">
          {title && <h3 className="text-xl font-semibold font-headline-lg text-[#3D2B1F]">{title}</h3>}
          <button onClick={onClose} className="p-2 hover:bg-[#E9E4D9] rounded-xl transition-colors">
            <X size={18} className="text-[#7A6255]" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
