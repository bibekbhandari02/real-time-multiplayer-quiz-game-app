import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ToastNotification() {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleShowToast = (event) => {
      const notification = event.detail;
      const id = Date.now();
      
      setToasts(prev => [...prev, { ...notification, id }]);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    window.addEventListener('show-toast-notification', handleShowToast);
    
    return () => {
      window.removeEventListener('show-toast-notification', handleShowToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToastClick = (toast) => {
    if (toast.actionUrl) {
      navigate(toast.actionUrl);
      removeToast(toast.id);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`pointer-events-auto w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border-l-4 ${getPriorityColor(toast.priority)} p-4 cursor-pointer hover:shadow-xl transition`}
            onClick={() => handleToastClick(toast)}
          >
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0">
                {toast.icon || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-bold text-sm">{toast.title}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeToast(toast.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
                {toast.actionLabel && (
                  <div className="mt-2">
                    <span className="text-xs text-primary font-semibold">
                      {toast.actionLabel} →
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
