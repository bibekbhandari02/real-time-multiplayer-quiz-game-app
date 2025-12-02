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
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-black via-gray-900 to-black border-b-2 border-green-500 text-white z-40 shadow-lg shadow-green-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              navigate('/');
              setIsOpen(false);
            }}
            className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 hover:opacity-80 transition active:scale-95 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          >
            TriviaNova
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-green-500/20 rounded-lg transition"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-full bg-green-400 transition-transform ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block h-0.5 w-full bg-green-400 transition-opacity ${isOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 w-full bg-green-400 transition-transform ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
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
              className="fixed top-0 right-0 bottom-0 w-64 bg-gradient-to-b from-gray-900 to-black z-50 shadow-2xl border-l-2 border-green-500/50"
            >
              <div className="p-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-b border-green-500/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-green-400">{user?.username}</p>
                    <p className="text-xs text-gray-400">{user?.elo || 1000} ELO</p>
                  </div>
                </div>
              </div>

              <nav className="p-4">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:from-green-900 hover:to-emerald-900 transition text-left mb-2 border border-green-500/20 hover:border-green-500/40 text-green-400"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </button>
                ))}
                
                <hr className="my-4 border-green-500/30" />
                
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-red-300 transition text-left border border-red-500/50"
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
