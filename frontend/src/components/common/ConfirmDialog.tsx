import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  message,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning',
  isLoading = false,
}) => {
  const iconColors = {
    danger: 'text-red-600 bg-red-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-[#A65A3A] bg-[#A65A3A]/10',
  };

  const dialogText = message || description || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div className={`p-4 rounded-full mb-4 ${iconColors[type]}`}>
          <AlertTriangle size={32} />
        </div>
        <p className="text-[#7A6A5E] mb-6 text-base leading-relaxed">{dialogText}</p>
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={type === 'danger' ? 'danger' : 'primary'}
            fullWidth
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
