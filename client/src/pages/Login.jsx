import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const { data} = await axios.post('/api/auth/login', { email, password });
      setAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-black">TriviaNova</h1>
          <p className="text-gray-600 text-sm mt-2">Welcome back! Login to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black placeholder-gray-400"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black placeholder-gray-400"
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg"
          >
            Login
          </button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Don't have an account? <Link to="/register" className="text-black font-semibold hover:opacity-70">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
