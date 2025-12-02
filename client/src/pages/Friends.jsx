import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data } = await axios.get('/api/social/friends', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFriends(data);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const { data } = await axios.get(`/api/social/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const addFriend = async (userId) => {
    try {
      await axios.post('/api/social/friend-request', 
        { targetUserId: userId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchFriends();
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to add friend:', error);
    }
  };

  const removeFriend = async (friendId) => {
    try {
      await axios.delete(`/api/social/friend/${friendId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchFriends();
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-white mb-6 hover:underline"
        >
          ← Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold mb-6">Friends</h1>

          {/* Search */}
          <div className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                placeholder="Search users..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                onClick={searchUsers}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition"
              >
                Search
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((user) => (
                  <div key={user._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-sm text-gray-600">Level {user.level} • {user.elo} ELO</p>
                    </div>
                    <button
                      onClick={() => addFriend(user._id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friends List */}
          <div>
            <h2 className="text-xl font-bold mb-4">Your Friends ({friends.length})</h2>
            {friends.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No friends yet. Search and add some!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <motion.div
                    key={friend._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{friend.username}</h3>
                        <p className="text-sm text-gray-600">Level {friend.level}</p>
                      </div>
                      <button
                        onClick={() => removeFriend(friend._id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="font-bold text-primary">{friend.elo}</p>
                        <p className="text-gray-600">ELO</p>
                      </div>
                      <div>
                        <p className="font-bold text-secondary">{friend.xp}</p>
                        <p className="text-gray-600">XP</p>
                      </div>
                      <div>
                        <p className="font-bold text-green-500">{friend.stats?.gamesWon || 0}</p>
                        <p className="text-gray-600">Wins</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
