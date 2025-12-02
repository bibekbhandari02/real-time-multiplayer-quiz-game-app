import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => navigate('/')}
            className="text-white text-2xl font-bold hover:opacity-80 transition"
          >
            Quiz Master
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 mr-4">
              <div className="bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-white text-sm">Level {user.level}</span>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-white text-sm">{user.elo || 1000} ELO</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition text-sm"
            >
              Profile
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition text-sm"
            >
              Leaderboard
            </button>
            <button
              onClick={() => navigate('/achievements')}
              className="bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition text-sm"
            >
              Achievements
            </button>
            <button
              onClick={() => navigate('/friends')}
              className="bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition text-sm"
            >
              Friends
            </button>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
