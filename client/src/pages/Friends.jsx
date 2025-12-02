import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { getSocket, initSocket } from '../socket/socket';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  useEffect(() => {
    // Initialize socket
    const socketInstance = getSocket();
    if (!socketInstance && user) {
      const newSocket = initSocket(user.id, user.username);
      setSocket(newSocket);
    } else {
      setSocket(socketInstance);
    }
    
    fetchFriends();
    fetchFriendRequests();
  }, [user]);

  useEffect(() => {
    // Listen for chat messages
    if (socket) {
      socket.on('friend_message', (data) => {
        setChatMessages(prev => ({
          ...prev,
          [data.from]: [...(prev[data.from] || []), { from: data.from, message: data.message, timestamp: Date.now() }]
        }));
      });

      socket.on('room_invite', (data) => {
        if (confirm(`${data.fromUsername} invited you to room ${data.roomCode}. Join now?`)) {
          navigate(`/lobby/${data.roomCode}`);
        }
      });

      socket.on('friend_request_received', () => {
        fetchFriendRequests();
      });
    }

    return () => {
      if (socket) {
        socket.off('friend_message');
        socket.off('room_invite');
        socket.off('friend_request_received');
      }
    };
  }, [socket, navigate]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        console.log('No token available');
        setFriends([]);
        setLoading(false);
        return;
      }
      
      const { data } = await axios.get('/api/social/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Friends loaded:', data);
      setFriends(data || []);
    } catch (error) {
      console.error('Failed to fetch friends:', error.response?.data || error.message);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      if (!token) return;
      
      const { data } = await axios.get('/api/social/friend-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFriendRequests(data || []);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      setFriendRequests([]);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      if (!token) {
        setSearchResults([]);
        return;
      }
      
      const { data } = await axios.get(`/api/social/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search failed:', error.response?.data || error.message);
      setSearchResults([]);
    }
  };

  // Real-time search filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sendFriendRequest = async (userId) => {
    try {
      if (!token) {
        alert('Please log in to send friend requests');
        return;
      }
      
      await axios.post('/api/social/friend-request', 
        { targetUserId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Notify via socket
      if (socket) {
        socket.emit('send_friend_request', { targetUserId: userId });
      }
      
      alert('Friend request sent!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert(error.response?.data?.error || 'Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requesterId) => {
    try {
      if (!token) return;
      
      await axios.post('/api/social/friend-request/accept', 
        { requesterId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  const declineFriendRequest = async (requesterId) => {
    try {
      if (!token) return;
      
      await axios.post('/api/social/friend-request/decline', 
        { requesterId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchFriendRequests();
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Remove this friend?')) return;
    
    try {
      if (!token) {
        alert('Please log in');
        return;
      }
      
      await axios.delete(`/api/social/friend/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchFriends();
      if (selectedFriend?._id === friendId) {
        setSelectedFriend(null);
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
      alert('Failed to remove friend');
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) {
      console.log('Empty message');
      return;
    }
    
    if (!selectedFriend) {
      console.log('No friend selected');
      return;
    }
    
    const friendId = selectedFriend._id;
    const message = messageInput.trim();
    
    // Clear input immediately for better UX
    setMessageInput('');
    
    // Add to local chat immediately
    setChatMessages(prev => ({
      ...prev,
      [friendId]: [...(prev[friendId] || []), { from: user.id, message, timestamp: Date.now() }]
    }));
    
    // Send via socket if available
    if (socket && socket.connected) {
      socket.emit('send_friend_message', {
        to: friendId,
        message
      });
    } else {
      console.log('Socket not connected, using API fallback');
      // Fallback to API if socket not connected
      try {
        if (!token) return;
        
        await axios.post('/api/social/messages', 
          { to: friendId, message },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const getCurrentChat = () => {
    if (!selectedFriend) return [];
    return chatMessages[selectedFriend._id] || [];
  };

  const loadChatHistory = async (friendId) => {
    try {
      if (!token) return;
      
      const { data } = await axios.get(`/api/social/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Convert to our format
      const messages = data.map(msg => ({
        from: msg.from,
        message: msg.message,
        timestamp: new Date(msg.createdAt).getTime()
      }));
      
      setChatMessages(prev => ({
        ...prev,
        [friendId]: messages
      }));
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Load chat history when selecting a friend
  useEffect(() => {
    if (selectedFriend && !chatMessages[selectedFriend._id]) {
      loadChatHistory(selectedFriend._id);
    }
  }, [selectedFriend]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, selectedFriend]);



  return (
    <div className="min-h-screen p-3 md:p-4 pb-20 md:pb-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-white mb-4 md:mb-6 hover:underline text-sm md:text-base"
        >
          ← Back to Home
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Friends List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-1 bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl"
          >
            <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">👥 Friends</h1>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search users..."
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
              />

              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 space-y-2 max-h-60 overflow-y-auto"
                  >
                    {searchResults.map((user) => (
                      <div key={user._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-sm">{user.username}</p>
                          <p className="text-xs text-gray-600">{user.elo} ELO</p>
                        </div>
                        <button
                          onClick={() => sendFriendRequest(user._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                  Friend Requests ({friendRequests.length})
                </h3>
                <div className="space-y-2">
                  {friendRequests.map((request) => (
                    <div key={request.from} className="flex justify-between items-center text-sm">
                      <span className="font-semibold">{request.username}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => acceptFriendRequest(request.from)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => declineFriendRequest(request.from)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-600 mb-2">Your Friends ({friends.length})</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-2">👥 No friends yet</p>
                  <p className="text-xs text-gray-400">Friends you add will appear here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {friends.map((friend) => (
                    <motion.div
                      key={friend._id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedFriend(friend)}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        selectedFriend?._id === friend._id
                          ? 'bg-primary text-white'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{friend.username}</p>
                          <p className={`text-xs ${selectedFriend?._id === friend._id ? 'text-white/80' : 'text-gray-600'}`}>
                            {friend.elo} ELO • {friend.stats?.gamesWon || 0} wins
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFriend(friend._id);
                          }}
                          className={`text-xs ${selectedFriend?._id === friend._id ? 'text-white/80 hover:text-white' : 'text-red-500 hover:text-red-700'}`}
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Chat & Invite Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl"
          >
            {selectedFriend ? (
              <>
                <div className="flex justify-between items-center mb-3 md:mb-4 pb-3 md:pb-4 border-b">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl md:text-2xl font-bold truncate">{selectedFriend.username}</h2>
                    <p className="text-xs md:text-sm text-gray-600">{selectedFriend.elo} ELO • {selectedFriend.stats?.gamesWon || 0} wins</p>
                  </div>
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Chat */}
                <div className="flex flex-col h-96">
                  <h3 className="font-semibold mb-2">💬 Chat</h3>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                    {getCurrentChat().length === 0 ? (
                      <p className="text-gray-500 text-center text-sm">No messages yet. Start chatting!</p>
                    ) : (
                      <div className="space-y-2">
                        {getCurrentChat().map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.from === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs px-4 py-2 rounded-lg ${
                                msg.from === user.id
                                  ? 'bg-primary text-white'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                      className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      title={!socket?.connected ? 'Socket disconnected - using API fallback' : 'Send message'}
                    >
                      {socket?.connected ? '📤' : '📨'} Send
                    </button>
                  </div>
                  {!socket?.connected && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ Real-time chat unavailable, using fallback mode</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-6xl mb-4">👈</p>
                  <p className="text-lg">Select a friend to chat and invite to games</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
