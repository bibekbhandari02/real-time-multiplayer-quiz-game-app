import { useEffect } from 'react';
import { getSocket } from '../socket/socket';

export const useAntiCheat = () => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Track tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        socket.emit('tab_visibility', { hidden: true });
      }
    };

    // Track clipboard usage
    const handleCopy = () => {
      socket.emit('clipboard_event');
    };

    const handlePaste = () => {
      socket.emit('clipboard_event');
    };

    // Track right-click (context menu)
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
};
