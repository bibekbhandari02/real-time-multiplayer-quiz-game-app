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
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* LEFT: Logo */}
          <button
            onClick={() => navigate('/')}
            className="text-black text-2xl font-bold hover:opacity-70 transition-opacity"
          >
            TriviaNova
          </button>

          {/* RIGHT: Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-gray-600 hover:text-black transition-colors text-sm font-medium"
            >
              Leaderboard
            </button>
            
            <button
              onClick={() => navigate('/achievements')}
              className="text-gray-600 hover:text-black transition-colors text-sm font-medium"
            >
              Achievements
            </button>
            
            <button
              onClick={() => navigate('/friends')}
              className="text-gray-600 hover:text-black transition-colors text-sm font-medium"
            >
              Friends
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-black text-sm font-semibold">{user.username || 'User'}</span>
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} 
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-2xl border border-gray-200 z-20">
                    {/* Stats */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-xs">ELO Rating</span>
                        <span className="text-black font-bold">{user.elo || 1000}</span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition text-sm"
                    >
                      Profile
                    </button>
                    
                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition border-t border-gray-200 text-sm"
                    >
                      Logout
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
              className="text-black p-2 hover:bg-gray-100 rounded-lg transition border border-gray-300"
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
            <button
              onClick={() => {
                navigate('/leaderboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Leaderboard
            </button>
            
            <button
              onClick={() => {
                navigate('/achievements');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Achievements
            </button>
            
            <button
              onClick={() => {
                navigate('/friends');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Friends
            </button>
            
            <button
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Profile
            </button>
            
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
