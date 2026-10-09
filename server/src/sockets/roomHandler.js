import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { markUserOnline, markUserOffline } from './presenceHandler.js';

export const setupRoomHandler = (io, socket) => {
  const userId = socket.userId;

  // Workspace rooms
  socket.on(SOCKET_EVENTS.JOIN_WORKSPACE, async ({ workspaceId }) => {
    if (!workspaceId) return;
    const roomName = `workspace:${workspaceId}`;
    socket.join(roomName);
    socket.currentWorkspaceId = workspaceId;
    await markUserOnline(io, userId, workspaceId);
  });

  socket.on(SOCKET_EVENTS.LEAVE_WORKSPACE, async ({ workspaceId }) => {
    if (!workspaceId) return;
    socket.leave(`workspace:${workspaceId}`);
    await markUserOffline(io, userId, workspaceId);
  });

  // Project rooms (Kanban boards, project updates)
  socket.on(SOCKET_EVENTS.JOIN_PROJECT, ({ projectId }) => {
    if (!projectId) return;
    socket.join(`project:${projectId}`);
  });

  socket.on(SOCKET_EVENTS.LEAVE_PROJECT, ({ projectId }) => {
    if (!projectId) return;
    socket.leave(`project:${projectId}`);
  });

  // Channel rooms (Chat & DMs)
  socket.on(SOCKET_EVENTS.JOIN_CHANNEL, ({ channelId }) => {
    if (!channelId) return;
    socket.join(`channel:${channelId}`);
  });

  socket.on(SOCKET_EVENTS.LEAVE_CHANNEL, ({ channelId }) => {
    if (!channelId) return;
    socket.leave(`channel:${channelId}`);
  });
};

