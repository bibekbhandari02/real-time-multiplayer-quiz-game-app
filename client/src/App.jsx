import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
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
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
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
        <Route path="/admin" element={token ? <AdminDashboard /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
