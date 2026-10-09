import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const setupChatHandler = (io, socket) => {
  const userId = socket.userId;
  const userName = socket.user?.name || 'User';

  // Typing indicators
  socket.on(SOCKET_EVENTS.TYPING_START, ({ channelId }) => {
    if (!channelId) return;
    socket.to(`channel:${channelId}`).emit(SOCKET_EVENTS.TYPING_START, {
      channelId,
      userId,
      userName,
    });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, ({ channelId }) => {
    if (!channelId) return;
    socket.to(`channel:${channelId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
      channelId,
      userId,
      userName,
    });
  });
};

