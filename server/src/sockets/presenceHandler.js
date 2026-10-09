import { getRedisClient } from '../config/redis.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const setupPresenceHandler = (io, socket) => {
  const userId = socket.userId;
  const redis = getRedisClient();

  socket.on(SOCKET_EVENTS.GET_ONLINE_USERS, async ({ workspaceId }) => {
    try {
      if (!workspaceId) return;
      const onlineUserIds = await redis.smembers(`presence:ws:${workspaceId}`);
      socket.emit(SOCKET_EVENTS.GET_ONLINE_USERS, onlineUserIds);
    } catch (err) {
      console.error('[Presence] Error getting online users:', err.message);
    }
  });

  // Track user presence in workspace
  socket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, async ({ workspaceId, status }) => {
    if (!workspaceId) return;
    io.to(`workspace:${workspaceId}`).emit(SOCKET_EVENTS.USER_STATUS_CHANGE, {
      userId,
      status,
    });
  });
};

export const markUserOnline = async (io, userId, workspaceId) => {
  try {
    const redis = getRedisClient();
    await redis.sadd(`presence:ws:${workspaceId}`, String(userId));
    io.to(`workspace:${workspaceId}`).emit(SOCKET_EVENTS.USER_ONLINE, {
      userId,
      workspaceId,
    });
  } catch (err) {
    console.error('[Presence] markUserOnline error:', err.message);
  }
};

export const markUserOffline = async (io, userId, workspaceId) => {
  try {
    const redis = getRedisClient();
    await redis.srem(`presence:ws:${workspaceId}`, String(userId));
    io.to(`workspace:${workspaceId}`).emit(SOCKET_EVENTS.USER_OFFLINE, {
      userId,
      workspaceId,
    });
  } catch (err) {
    console.error('[Presence] markUserOffline error:', err.message);
  }
};

