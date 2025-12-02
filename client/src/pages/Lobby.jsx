import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { getSocket, initSocket } from '../socket/socket';

export default function Lobby() {
  const { roomCode } = useParams();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Initialize socket if not already initialized
  const socket = getSocket() || initSocket(user.id, user.username);

  useEffect(() => {
    socket.emit('join_room', {
      roomCode,
      userId: user.id,
      username: user.username
    });

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

    socket.on('game_started', () => {
      navigate(`/game/${roomCode}`);
    });

    socket.on('error', ({ message }) => {
      alert(message);
      navigate('/');
    });

    return () => {
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_started');
      socket.off('error');
    };
  }, [roomCode, user, socket, navigate]);

  const startGame = () => {
    socket.emit('start_game', { roomCode, userId: user.id });
  };

  const leaveRoom = () => {
    socket.emit('leave_room', { roomCode, userId: user.id });
    navigate('/');
  };

  if (!room) return <div className="min-h-screen flex items-center justify-center text-white text-2xl">Loading...</div>;

  const isHost = room.host.toString() === user.id;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Room: {roomCode}</h1>
              <p className="text-gray-600">Waiting for players...</p>
            </div>
            <button
              onClick={leaveRoom}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Leave
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Players ({players.length}/{room.settings.maxPlayers})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {players.map((player, index) => (
                <motion.div
                  key={player.userId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-lg text-center"
                >
                  <p className="font-semibold">{player.username}</p>
                  {player.userId.toString() === room.host.toString() && (
                    <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded mt-2 inline-block">HOST</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="font-bold mb-2">Game Settings</h3>
            <p>Questions: {room.settings.questionsCount}</p>
            <p>Time per question: {room.settings.timePerQuestion}s</p>
          </div>

          {isHost && (
            <button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {players.length < 2 ? 'Waiting for more players...' : 'Start Game'}
            </button>
          )}

          {!isHost && (
            <div className="text-center text-gray-600">
              Waiting for host to start the game...
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
