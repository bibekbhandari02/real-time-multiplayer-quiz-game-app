import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../api/axios';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F172A]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1E293B] rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Join TriviaNova</h1>
          <p className="text-[#CBD5E1] text-sm mt-2">Create your account to get started</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F1F5F9] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-[#334155] border-2 border-[#334155] text-[#F1F5F9] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] placeholder-[#CBD5E1]"
              placeholder="Choose a username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F1F5F9] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#334155] border-2 border-[#334155] text-[#F1F5F9] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] placeholder-[#CBD5E1]"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F1F5F9] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#334155] border-2 border-[#334155] text-[#F1F5F9] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] placeholder-[#CBD5E1]"
              placeholder="Create a password"
              required
            />
          </div>
          {error && <p className="text-[#EF4444] text-sm bg-[#991B1B]/20 border border-[#EF4444]/30 rounded-lg p-2">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#3B82F6] text-white py-3 rounded-lg font-semibold hover:bg-[#2563EB] transition shadow-lg"
          >
            Register
          </button>
        </form>
        <p className="text-center mt-4 text-[#CBD5E1]">
          Already have an account? <Link to="/login" className="text-[#F1F5F9] font-semibold hover:opacity-70">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
