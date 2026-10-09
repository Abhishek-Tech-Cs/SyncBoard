import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { setupRoomHandler } from './roomHandler.js';
import { setupPresenceHandler, markUserOffline } from './presenceHandler.js';
import { setupChatHandler } from './chatHandler.js';
import { ENV } from '../config/env.js';

let ioInstance = null;

export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Authentication Handshake Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Also check headers or cookies from handshake
      if (!token && socket.handshake.headers?.authorization) {
        token = socket.handshake.headers.authorization.replace('Bearer ', '');
      }

      if (!token && socket.handshake.headers?.cookie) {
        const cookieMatches = socket.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
        if (cookieMatches) {
          token = decodeURIComponent(cookieMatches[1]);
        }
      }

      if (!token) {
        return next(new Error('Authentication token required for Socket connection'));
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        return next(new Error('Invalid or expired socket authentication token'));
      }

      const user = await User.findById(decoded.id).select('name email avatar status');
      if (!user) {
        return next(new Error('Socket user not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins their private room for direct notifications
    socket.join(`user:${socket.userId}`);

    // Register modular event handlers
    setupRoomHandler(io, socket);
    setupPresenceHandler(io, socket);
    setupChatHandler(io, socket);

    socket.on('disconnect', async () => {
      if (socket.currentWorkspaceId) {
        await markUserOffline(io, socket.userId, socket.currentWorkspaceId);
      }
    });
  });

  ioInstance = io;
  return io;
};

export const getSocketIO = () => {
  return ioInstance;
};

