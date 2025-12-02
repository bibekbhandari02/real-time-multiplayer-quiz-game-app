import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const { data } = await axios.post('/api/auth/register', { username, email, password });
      setAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border-2 border-green-500/50 hover:border-green-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">🎯</div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">Join TriviaNova</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border-2 border-green-500/50 text-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 placeholder-gray-600"
              placeholder="Choose a username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border-2 border-green-500/50 text-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 placeholder-gray-600"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border-2 border-green-500/50 text-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 placeholder-gray-600"
              placeholder="Create a password"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/50 rounded-lg p-2">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
          >
            Register
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          Already have an account? <Link to="/login" className="text-green-400 font-semibold hover:text-green-300">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
