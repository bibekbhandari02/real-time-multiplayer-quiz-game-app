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
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [rankedCountdown, setRankedCountdown] = useState(null);
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

    socket.on('ranked_starting', ({ countdown }) => {
      console.log(`🎮 Ranked match starting in ${countdown} seconds`);
      setRankedCountdown(countdown);
      setGenerating(true);
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setRankedCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('game_started', () => {
      setGenerating(false);
      setRankedCountdown(null);
      navigate(`/game/${roomCode}`);
    });

    socket.on('error', ({ message }) => {
      setGenerating(false);
      alert(message);
      navigate('/');
    });

    // Listen for online status updates
    socket.on('user_online', (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    });

    socket.on('user_offline', (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    socket.on('online_friends_list', (data) => {
      setOnlineUsers(new Set(data.onlineUserIds || []));
    });

    return () => {
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('generating_questions');
      socket.off('ranked_starting');
      socket.off('game_started');
      socket.off('error');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('online_friends_list');
    };
  }, [roomCode, user.id, user.username, socket, navigate]);

  const startGame = () => {
    socket.emit('start_game', { roomCode, userId: user.id });
  };

  const leaveRoom = () => {
    socket.emit('leave_room', { roomCode, userId: user.id });
    navigate('/');
  };

  const switchToSpectator = () => {
    // Leave the room as a player first
    socket.emit('leave_room', { roomCode, userId: user.id });
    
    // Wait a moment for the server to process the leave, then navigate
    setTimeout(() => {
      navigate(`/spectator/${roomCode}`);
    }, 300);
  };

  const fetchFriends = async () => {
    try {
      if (!token) return;
      const axios = (await import('axios')).default;
      const { data } = await axios.get('/api/social/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(data || []);
      
      // Request online status for these friends
      if (socket && data && data.length > 0) {
        const friendIds = data.map(f => f._id);
        socket.emit('get_online_friends', { friendIds });
      }
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

  if (!room) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white text-2xl">Loading...</div>;

  const isHost = room.host.toString() === user.id;
  const isRanked = room.settings?.isRanked || false;

  return (
    <div className="min-h-screen p-3 md:p-4 pb-20 md:pb-4 bg-[#0F172A]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E293B] rounded-xl md:rounded-2xl p-4 md:p-8 shadow-2xl border border-[#334155]"
        >
          <div className="mb-4 md:mb-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-3xl font-bold text-[#F1F5F9]">Room: {roomCode}</h1>
                  {isRanked && (
                    <span className="px-2 py-1 bg-gradient-to-r from-[#FACC15] to-[#F59E0B] text-black text-xs font-bold rounded-full">
                      RANKED
                    </span>
                  )}
                </div>
                <p className="text-[#CBD5E1] text-sm md:text-base">
                  {isRanked ? 'Matched players - Game starting soon...' : 'Waiting for players...'}
                </p>
              </div>
              <button
                onClick={leaveRoom}
                className="bg-[#EF4444] text-white px-3 md:px-4 py-2 rounded-lg hover:bg-[#DC2626] transition text-sm md:text-base whitespace-nowrap ml-2"
              >
                Leave
              </button>
            </div>
            {!isRanked && (
              <button
                onClick={openInviteModal}
                className="w-full bg-[#22C55E] text-white px-4 py-2 md:py-3 rounded-lg hover:bg-[#16A34A] transition flex items-center justify-center gap-2 text-sm md:text-base shadow-lg"
              >
                <span>👥</span> Invite Friends
              </button>
            )}
          </div>

          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-[#F1F5F9]">Players ({players.length}/{room.settings.maxPlayers})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {players.map((player, index) => (
                <motion.div
                  key={`${player.userId}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white p-3 md:p-4 rounded-lg text-center shadow-lg shadow-[#3B82F6]/30"
                >
                  <p className="font-semibold text-sm md:text-base truncate">{player.username}</p>
                  {player.userId.toString() === room.host.toString() && (
                    <span className="text-xs bg-[#1E293B] text-[#F1F5F9] px-2 py-1 rounded mt-1 md:mt-2 inline-block font-bold">HOST</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-[#334155] p-4 rounded-lg mb-6 border border-[#334155]">
            <h3 className="font-bold mb-2 text-[#F1F5F9]">Game Settings</h3>
            {room.settings.category && (
              <p className="text-[#CBD5E1]">Category: <span className="font-semibold text-[#F1F5F9]">{room.settings.category}</span></p>
            )}
            <p className="text-[#CBD5E1]">Questions: <span className="text-[#F1F5F9] font-semibold">{room.settings.questionsCount}</span></p>
            <p className="text-[#CBD5E1]">Time per question: <span className="text-[#F1F5F9] font-semibold">{room.settings.timePerQuestion}s</span></p>
            {room.settings.difficultyMode && (
              <p className="text-[#CBD5E1]">Difficulty: <span className="font-semibold text-[#F1F5F9] capitalize">
                {room.settings.difficultyMode === 'mixed' && 'Mixed'}
                {room.settings.difficultyMode === 'progressive' && 'Progressive'}
                {room.settings.difficultyMode === 'easy' && 'Easy Only'}
                {room.settings.difficultyMode === 'medium' && 'Medium Only'}
                {room.settings.difficultyMode === 'hard' && 'Hard Only'}
              </span></p>
            )}
          </div>

          {generating && (
            <div className="bg-[#0F172A] border border-[#475569] rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3B82F6]"></div>
                <p className="text-[#F1F5F9] font-semibold">
                  {rankedCountdown !== null ? (
                    <>⚔️ Ranked match starting in {rankedCountdown}s...</>
                  ) : (
                    <>🤖 AI is generating questions for {room.settings.category}...</>
                  )}
                </p>
              </div>
            </div>
          )}

          {!generating && !isRanked && isHost && (
            <button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full bg-[#3B82F6] text-white py-3 rounded-lg font-semibold hover:bg-[#2563EB] transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
            >
              {players.length < 2 ? 'Waiting for more players...' : 'Start Game'}
            </button>
          )}

          {!generating && !isRanked && !isHost && (
            <div className="space-y-3">
              <div className="text-center text-[#CBD5E1] py-2">
                Waiting for host to start the game...
              </div>
              
              {/* Spectate Option - Only for non-hosts */}
              <div className="text-center">
                <button
                  onClick={switchToSpectator}
                  className="inline-flex items-center gap-2 text-sm text-[#CBD5E1] hover:text-[#3B82F6] transition-colors px-4 py-2 rounded-lg hover:bg-[#334155]"
                >
                  <span>👁️</span>
                  <span className="underline">Watch as Spectator Instead</span>
                </button>
              </div>
            </div>
          )}

          {isRanked && !generating && (
            <div className="bg-gradient-to-r from-[#FACC15]/20 to-[#F59E0B]/20 border border-[#FACC15] rounded-lg p-4 text-center">
              <p className="text-[#F1F5F9] font-semibold">
                ⚔️ Ranked Match - Game will start automatically
              </p>
              <p className="text-[#CBD5E1] text-sm mt-1">
                Get ready to compete!
              </p>
            </div>
          )}
        </motion.div>

        {/* Invite Friends Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1E293B] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#334155]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#F1F5F9]">Invite Friends</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-[#CBD5E1] hover:text-[#3B82F6] text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-sm text-[#CBD5E1] mb-4">
                Send room code <span className="font-bold text-[#F1F5F9]">{roomCode}</span> to your friends
              </p>

              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#CBD5E1] mb-4">No friends yet</p>
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      navigate('/friends');
                    }}
                    className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-[#2563EB] transition shadow-lg"
                  >
                    Add Friends
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {friends.map((friend) => (
                    <div
                      key={friend._id}
                      className="flex justify-between items-center p-3 bg-[#334155] rounded-lg hover:bg-[#0F172A] transition border border-[#334155]"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {/* Active Status Indicator */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${
                            onlineUsers.has(friend._id)
                              ? 'bg-[#22C55E]'
                              : 'bg-gray-400'
                          }`}>
                            {onlineUsers.has(friend._id) && (
                              <span className="absolute inset-0 w-2 h-2 bg-[#22C55E] rounded-full animate-ping opacity-75"></span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-[#F1F5F9]">{friend.username}</p>
                          <p className="text-xs text-[#CBD5E1]">{friend.elo} ELO</p>
                        </div>
                      </div>
                      <button
                        onClick={() => inviteFriend(friend)}
                        className="bg-[#22C55E] text-white px-4 py-2 rounded-lg hover:bg-[#22C55E] transition text-sm shadow-lg"
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full mt-4 bg-[#334155] text-[#F1F5F9] px-4 py-2 rounded-lg hover:bg-[#475569] transition border border-[#475569]"
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

