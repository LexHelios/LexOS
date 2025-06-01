import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem = ({ toast, onRemove }: ToastProps) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`mb-4 flex items-center gap-3 rounded-lg p-4 shadow-lg ${
        colors[toast.type]
      } text-white`}
    >
      <span className="text-xl">{icons[toast.type]}</span>
      <p className="flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/80 hover:text-white"
      >
        ✕
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return createPortal(
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

// Toast hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string, duration = 3000) =>
      addToast({ type: 'success', message, duration }),
    error: (message: string, duration = 3000) =>
      addToast({ type: 'error', message, duration }),
    info: (message: string, duration = 3000) =>
      addToast({ type: 'info', message, duration }),
    warning: (message: string, duration = 3000) =>
      addToast({ type: 'warning', message, duration }),
  };
}; 