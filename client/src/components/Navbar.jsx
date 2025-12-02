import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Profile', icon: '👤', path: '/profile' },
    { name: 'Leaderboard', icon: '🏆', path: '/leaderboard' },
    { name: 'Achievements', icon: '🎖️', path: '/achievements' },
    { name: 'Friends', icon: '👥', path: '/friends' },
  ];

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <div className="text-3xl transform group-hover:rotate-12 transition-transform">
              🎯
            </div>
            <span className="text-white text-2xl font-bold tracking-tight group-hover:scale-105 transition-transform">
              TriviaNova
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-2 mr-2">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition">
                <span className="text-white text-sm font-semibold">⭐ Level {user.level}</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition">
                <span className="text-white text-sm font-semibold">🎮 {user.elo || 1000} ELO</span>
              </div>
              <div className="bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400 hover:bg-yellow-400 transition">
                <span className="text-white text-sm font-bold">🪙 {user.coins || 0}</span>
              </div>
            </div>

            {/* Notification Bell */}
            <NotificationCenter />

            {/* Nav Items */}
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95 border border-white/20"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            ))}

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <span className="text-lg">🚪</span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <NotificationCenter />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2 hover:bg-white/20 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden pb-4 overflow-hidden"
            >
              {/* Mobile Stats */}
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                  <span className="text-white text-xs font-semibold">⭐ Lvl {user.level}</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                  <span className="text-white text-xs font-semibold">🎮 {user.elo || 1000}</span>
                </div>
                <div className="bg-yellow-500/90 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-400">
                  <span className="text-white text-xs font-bold">🪙 {user.coins || 0}</span>
                </div>
              </div>

              {/* Mobile Nav Items */}
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white px-4 py-3 rounded-lg hover:bg-white/20 transition border border-white/20"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition"
                >
                  <span className="text-xl">🚪</span>
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
