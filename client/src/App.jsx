import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import { getSocket, initSocket } from './socket/socket';
import ToastContainer from './components/ToastContainer';
import ToastNotification from './components/ToastNotification';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Matchmaking from './pages/Matchmaking';
import Achievements from './pages/Achievements';
import Friends from './pages/Friends';
import Spectator from './pages/Spectator';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    // Initialize socket
    const socket = getSocket() || initSocket(user.id, user.username);

    // Global listener for room invites
    const handleRoomInvite = (data) => {
      setInvite(data);
    };

    socket.on('room_invite', handleRoomInvite);

    return () => {
      socket.off('room_invite', handleRoomInvite);
    };
  }, [token, user]);

  const acceptInvite = () => {
    if (invite) {
      navigate(`/lobby/${invite.roomCode}`);
      setInvite(null);
    }
  };

  const declineInvite = () => {
    setInvite(null);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={token ? <Home /> : <Navigate to="/login" />} />
        <Route path="/lobby/:roomCode" element={token ? <Lobby /> : <Navigate to="/login" />} />
        <Route path="/game/:roomCode" element={token ? <Game /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={token ? <Leaderboard /> : <Navigate to="/login" />} />
        <Route path="/matchmaking" element={token ? <Matchmaking /> : <Navigate to="/login" />} />
        <Route path="/achievements" element={token ? <Achievements /> : <Navigate to="/login" />} />
        <Route path="/friends" element={token ? <Friends /> : <Navigate to="/login" />} />
        <Route path="/spectator/:roomCode" element={token ? <Spectator /> : <Navigate to="/login" />} />
        <Route path="/admin" element={token ? <AdminDashboard /> : <Navigate to="/login" />} />
      </Routes>

      {/* Game Invite Modal */}
      <AnimatePresence>
        {invite && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                  🎮
                </div>
                <h2 className="text-3xl font-bold mb-2">Game Invite!</h2>
                <p className="text-gray-600 text-lg">
                  <span className="font-bold text-primary">{invite.fromUsername}</span> invited you to play
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6 border-2 border-blue-200">
                <p className="text-sm text-gray-600 text-center mb-1">Room Code</p>
                <p className="text-3xl font-bold text-center text-primary tracking-wider">
                  {invite.roomCode}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={declineInvite}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Decline
                </button>
                <button
                  onClick={acceptInvite}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
                >
                  Accept & Join
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Toast Notifications */}
      <ToastNotification />
    </>
  );
}

function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <ToastContainer />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
