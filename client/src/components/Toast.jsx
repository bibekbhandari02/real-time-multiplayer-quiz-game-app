import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠'
  };

  const colors = {
    success: 'bg-[#22C55E]',
    error: 'bg-[#EF4444]',
    info: 'bg-[#3B82F6]',
    warning: 'bg-[#FACC15]'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`${colors[type]} text-[#F1F5F9] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}
    >
      <span className="text-2xl">{icons[type]}</span>
      <p className="flex-1 font-semibold">{message}</p>
      <button
        onClick={onClose}
        className="text-[#F1F5F9]/80 hover:text-[#F1F5F9] text-xl font-bold"
      >
        ×
      </button>
    </motion.div>
  );
}
