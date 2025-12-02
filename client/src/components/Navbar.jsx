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
    <nav className="bg-gradient-to-r from-black via-gray-900 to-black border-b-2 border-green-500 shadow-lg shadow-green-500/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <div className="text-3xl transform group-hover:rotate-12 transition-transform filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
              🎯
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 text-2xl font-bold tracking-tight group-hover:scale-105 transition-transform drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              TriviaNova
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-2 mr-2">
              <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-green-500/50 hover:border-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition">
                <span className="text-green-400 text-sm font-semibold">⭐ Level {user.level}</span>
              </div>
              <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-green-500/50 hover:border-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition">
                <span className="text-green-400 text-sm font-semibold">🎮 {user.elo || 1000} ELO</span>
              </div>
              <div className="bg-gradient-to-r from-yellow-900/50 to-amber-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-500/50 hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] transition">
                <span className="text-yellow-400 text-sm font-bold">🪙 {user.coins || 0}</span>
              </div>
            </div>

            {/* Notification Bell */}
            <NotificationCenter />

            {/* Nav Items */}
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-800 backdrop-blur-sm text-green-400 px-4 py-2 rounded-lg hover:from-green-900 hover:to-emerald-900 hover:text-green-300 transition-all hover:scale-105 active:scale-95 border border-green-500/30 hover:border-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            ))}

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-gradient-to-r from-red-900 to-red-800 text-red-300 px-4 py-2 rounded-lg hover:from-red-800 hover:to-red-700 hover:text-red-200 transition-all hover:scale-105 active:scale-95 border border-red-500/50 hover:border-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
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
                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 px-3 py-1 rounded-full border border-green-500/50">
                  <span className="text-green-400 text-xs font-semibold">⭐ Lvl {user.level}</span>
                </div>
                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 px-3 py-1 rounded-full border border-green-500/50">
                  <span className="text-green-400 text-xs font-semibold">🎮 {user.elo || 1000}</span>
                </div>
                <div className="bg-gradient-to-r from-yellow-900/50 to-amber-900/50 px-3 py-1 rounded-full border border-yellow-500/50">
                  <span className="text-yellow-400 text-xs font-bold">🪙 {user.coins || 0}</span>
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
                    className="w-full flex items-center gap-3 bg-gradient-to-r from-gray-900 to-gray-800 text-green-400 px-4 py-3 rounded-lg hover:from-green-900 hover:to-emerald-900 transition border border-green-500/30"
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
                  className="w-full flex items-center gap-3 bg-gradient-to-r from-red-900 to-red-800 text-red-300 px-4 py-3 rounded-lg hover:from-red-800 hover:to-red-700 transition border border-red-500/50"
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
