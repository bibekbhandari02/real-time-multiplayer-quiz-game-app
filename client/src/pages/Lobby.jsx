import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { getSocket, initSocket } from '../socket/socket';

export default function Lobby() {
  const { roomCode } = useParams();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const hasJoinedRef = useRef(false);
  
  // Initialize socket if not already initialized
  const socket = getSocket() || initSocket(user.id, user.username);

  useEffect(() => {
    // Only join once
    if (!hasJoinedRef.current) {
      socket.emit('join_room', {
        roomCode,
        userId: user.id,
        username: user.username
      });
      hasJoinedRef.current = true;
    }

    socket.on('room_joined', ({ room }) => {
      setRoom(room);
      setPlayers(room.players);
    });

    socket.on('player_joined', ({ players }) => {
      setPlayers(players);
    });

    socket.on('player_left', ({ players }) => {
      setPlayers(players);
    });

    socket.on('generating_questions', ({ message }) => {
      setGenerating(true);
    });

    socket.on('game_started', () => {
      setGenerating(false);
      navigate(`/game/${roomCode}`);
    });

    socket.on('error', ({ message }) => {
      setGenerating(false);
      alert(message);
      navigate('/');
    });

    return () => {
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('generating_questions');
      socket.off('game_started');
      socket.off('error');
    };
  }, [roomCode, user.id, user.username, socket, navigate]);

  const startGame = () => {
    socket.emit('start_game', { roomCode, userId: user.id });
  };

  const leaveRoom = () => {
    socket.emit('leave_room', { roomCode, userId: user.id });
    navigate('/');
  };

  const fetchFriends = async () => {
    try {
      if (!token) return;
      const axios = (await import('axios')).default;
      const { data } = await axios.get('/api/social/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(data || []);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      setFriends([]);
    }
  };

  const inviteFriend = (friend) => {
    if (!socket) return;
    
    socket.emit('invite_to_room', {
      friendId: friend._id,
      roomCode: roomCode,
      fromUsername: user.username
    });
    
    alert(`Invite sent to ${friend.username}!`);
  };

  const openInviteModal = () => {
    fetchFriends();
    setShowInviteModal(true);
  };

  if (!room) return <div className="min-h-screen flex items-center justify-center text-white text-2xl">Loading...</div>;

  const isHost = room.host.toString() === user.id;

  return (
    <div className="min-h-screen p-3 md:p-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-4 md:p-8 shadow-2xl border-2 border-green-500/50"
        >
          <div className="mb-4 md:mb-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h1 className="text-xl md:text-3xl font-bold text-green-400">Room: {roomCode}</h1>
                <p className="text-gray-400 text-sm md:text-base">Waiting for players...</p>
              </div>
              <button
                onClick={leaveRoom}
                className="bg-gradient-to-r from-red-900 to-red-800 text-red-300 px-3 md:px-4 py-2 rounded-lg hover:from-red-800 hover:to-red-700 transition text-sm md:text-base whitespace-nowrap ml-2 border border-red-500/50"
              >
                Leave
              </button>
            </div>
            <button
              onClick={openInviteModal}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 md:py-3 rounded-lg hover:from-green-500 hover:to-emerald-500 transition flex items-center justify-center gap-2 text-sm md:text-base shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <span>👥</span> Invite Friends
            </button>
          </div>

          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-green-400">Players ({players.length}/{room.settings.maxPlayers})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {players.map((player, index) => (
                <motion.div
                  key={`${player.userId}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 md:p-4 rounded-lg text-center shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <p className="font-semibold text-sm md:text-base truncate">{player.username}</p>
                  {player.userId.toString() === room.host.toString() && (
                    <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded mt-1 md:mt-2 inline-block font-bold">HOST</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg mb-6 border border-green-500/30">
            <h3 className="font-bold mb-2 text-green-400">Game Settings</h3>
            {room.settings.category && (
              <p className="text-gray-400">Category: <span className="font-semibold text-green-400">{room.settings.category}</span></p>
            )}
            <p className="text-gray-400">Questions: <span className="text-green-400 font-semibold">{room.settings.questionsCount}</span></p>
            <p className="text-gray-400">Time per question: <span className="text-green-400 font-semibold">{room.settings.timePerQuestion}s</span></p>
          </div>

          {generating && (
            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                <p className="text-cyan-400 font-semibold">
                  🤖 AI is generating questions for {room.settings.category}...
                </p>
              </div>
            </div>
          )}

          {!generating && isHost && (
            <button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition disabled:bg-gray-700 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-700 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              {players.length < 2 ? 'Waiting for more players...' : 'Start Game'}
            </button>
          )}

          {!generating && !isHost && (
            <div className="text-center text-gray-400">
              Waiting for host to start the game...
            </div>
          )}

          {/* Spectate Option */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate(`/spectator/${roomCode}`)}
              className="text-sm text-gray-400 hover:text-green-400 underline"
            >
              👁️ Watch as Spectator Instead
            </button>
          </div>
        </motion.div>

        {/* Invite Friends Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-green-500/50"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Invite Friends</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Send room code <span className="font-bold text-primary">{roomCode}</span> to your friends
              </p>

              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No friends yet</p>
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      navigate('/friends');
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
                  >
                    Add Friends
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {friends.map((friend) => (
                    <div
                      key={friend._id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div>
                        <p className="font-semibold">{friend.username}</p>
                        <p className="text-xs text-gray-600">{friend.elo} ELO</p>
                      </div>
                      <button
                        onClick={() => inviteFriend(friend)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
