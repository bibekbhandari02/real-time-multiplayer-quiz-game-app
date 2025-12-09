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
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldError('');
    setLoading(true);
    
    try {
      const { data } = await axios.post('/api/auth/register', { username, email, password });
      
      if (data.success) {
        setAuth(data.token, data.user);
        navigate('/');
      }
    } catch (err) {
      console.log('Registration error:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      const errorField = err.response?.data?.field || '';
      
      setError(errorMessage);
      setFieldError(errorField);
      setLoading(false);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError('');
        setFieldError('');
      }, 5000);
      
      return; // Prevent finally block from running
    }
    
    setLoading(false);
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
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-[#F1F5F9] mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldError === 'username') {
                  setError('');
                  setFieldError('');
                }
              }}
              className={`w-full px-4 py-2 bg-[#334155] border-2 ${
                fieldError === 'username' ? 'border-[#EF4444]' : 'border-[#334155]'
              } text-[#F1F5F9] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] placeholder-[#CBD5E1]`}
              placeholder="Choose a username (3-20 characters)"
              autoComplete="username"
              required
              disabled={loading}
              minLength={3}
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F1F5F9] mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError === 'email') {
                  setError('');
                  setFieldError('');
                }
              }}
              className={`w-full px-4 py-2 bg-[#334155] border-2 ${
                fieldError === 'email' ? 'border-[#EF4444]' : 'border-[#334155]'
              } text-[#F1F5F9] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] placeholder-[#CBD5E1]`}
              placeholder="Enter your email"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F1F5F9] mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldError === 'password') {
                  setError('');
                  setFieldError('');
                }
              }}
              className={`w-full px-4 py-2 bg-[#334155] border-2 ${
                fieldError === 'password' ? 'border-[#EF4444]' : 'border-[#334155]'
              } text-[#F1F5F9] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] placeholder-[#CBD5E1]`}
              placeholder="Create a password (min 6 characters)"
              autoComplete="new-password"
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#EF4444] text-sm bg-[#991B1B]/20 border border-[#EF4444]/30 rounded-lg p-3 flex items-start gap-2"
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3B82F6] text-white py-3 rounded-lg font-semibold hover:bg-[#2563EB] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="text-center mt-4 text-[#CBD5E1]">
          Already have an account? <Link to="/login" className="text-[#F1F5F9] font-semibold hover:opacity-70">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
