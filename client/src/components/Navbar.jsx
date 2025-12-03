import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <nav className="bg-[#1E293B] border-b border-[#334155] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          
          {/* LEFT: Logo */}
          <button
            onClick={() => navigate('/')}
            className="text-xl sm:text-2xl font-bold text-[#F1F5F9] hover:text-[#3B82F6] transition-colors"
          >
            TriviaNova
          </button>

          {/* RIGHT: Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-[#CBD5E1] hover:text-[#3B82F6] transition-colors text-sm font-medium"
            >
              Leaderboard
            </button>
            
            <button
              onClick={() => navigate('/achievements')}
              className="text-[#CBD5E1] hover:text-[#3B82F6] transition-colors text-sm font-medium"
            >
              Achievements
            </button>
            
            <button
              onClick={() => navigate('/friends')}
              className="text-[#CBD5E1] hover:text-[#3B82F6] transition-colors text-sm font-medium"
            >
              Friends
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 bg-[#334155] hover:bg-[#475569] px-3 py-2 rounded-lg border border-[#475569] hover:border-[#3B82F6] transition-all"
              >
                <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-[#F1F5F9] text-sm font-semibold hidden lg:inline">{user.username || 'User'}</span>
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform hidden lg:inline ${profileDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[#1E293B] rounded-xl shadow-2xl border border-[#334155] z-20">
                    {/* Stats */}
                    <div className="p-4 border-b border-[#334155]">
                      <p className="text-xs text-[#CBD5E1] mb-1 uppercase tracking-wide">ELO Rating</p>
                      <p className="text-2xl font-bold text-[#FACC15]">{user.elo || 1000}</p>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-[#F1F5F9] hover:bg-[#334155] transition text-sm font-medium"
                    >
                      👤 Profile
                    </button>
                    
                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-[#EF4444] hover:bg-[#991B1B] hover:text-white transition border-t border-[#334155] text-sm font-medium"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#F1F5F9] p-2 hover:bg-[#334155] rounded-lg transition border border-[#475569]"
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
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {/* User Info */}
            <div className="bg-[#0F172A] p-4 rounded-lg border border-[#334155] mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#FACC15] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-[#F1F5F9] font-bold">{user.username || 'User'}</p>
                  <p className="text-[#FACC15] text-sm font-semibold">{user.elo || 1000} ELO</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                navigate('/leaderboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-[#334155] text-[#F1F5F9] rounded-lg hover:bg-[#475569] transition text-sm font-medium"
            >
              🏆 Leaderboard
            </button>
            
            <button
              onClick={() => {
                navigate('/achievements');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-[#334155] text-[#F1F5F9] rounded-lg hover:bg-[#475569] transition text-sm font-medium"
            >
              🎖️ Achievements
            </button>
            
            <button
              onClick={() => {
                navigate('/friends');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-[#334155] text-[#F1F5F9] rounded-lg hover:bg-[#475569] transition text-sm font-medium"
            >
              👥 Friends
            </button>
            
            <button
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-[#334155] text-[#F1F5F9] rounded-lg hover:bg-[#475569] transition text-sm font-medium"
            >
              👤 Profile
            </button>
            
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-[#991B1B] text-white rounded-lg hover:bg-[#EF4444] transition text-sm font-medium border border-[#DC2626]"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
