import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Profile', path: '/profile', icon: '👤' },
    { label: 'Friends', path: '/friends', icon: '👥' },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
    { label: 'Achievements', path: '/achievements', icon: '🎖️' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#1E293B] border-b border-[#334155] text-[#F1F5F9] z-40 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              navigate('/');
              setIsOpen(false);
            }}
            className="text-xl font-bold text-[#F1F5F9] hover:text-[#3B82F6] transition-colors active:scale-95"
          >
            TriviaNova
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-[#334155] rounded-lg transition"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-full bg-[#F1F5F9] transition-transform ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block h-0.5 w-full bg-[#F1F5F9] transition-opacity ${isOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 w-full bg-[#F1F5F9] transition-transform ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="fixed top-0 right-0 bottom-0 w-64 bg-[#1E293B] z-50 shadow-2xl border-l border-[#334155]"
            >
              <div className="p-4 bg-[#0F172A] border-b border-[#334155]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#FACC15] rounded-full flex items-center justify-center text-2xl text-white shadow-lg shadow-[#3B82F6]/20">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[#F1F5F9]">{user?.username}</p>
                    <p className="text-xs text-[#CBD5E1]">{user?.elo || 1000} ELO</p>
                  </div>
                </div>
              </div>

              <nav className="p-4">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#334155] hover:bg-[#3B82F6] transition text-left mb-2 border border-[#475569] text-[#F1F5F9] hover:shadow-lg hover:shadow-[#3B82F6]/20"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </button>
                ))}
                
                <hr className="my-4 border-[#334155]" />
                
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#991B1B] hover:bg-[#EF4444] text-white transition text-left border border-[#DC2626] shadow-lg shadow-[#EF4444]/20"
                >
                  <span className="text-2xl">🚪</span>
                  <span className="font-semibold">Logout</span>
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

