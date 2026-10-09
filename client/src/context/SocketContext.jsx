import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { useWorkspace } from './WorkspaceContext.jsx';
import { useToast } from './ToastContext.jsx';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const socketRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
        : window.location.origin);

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('notification:received', (notification) => {
      toast.info(notification.message, notification.title || 'Notification');
    });

    socketInstance.on('presence:get_online_users', (userIds) => {
      setOnlineUserIds(userIds || []);
    });

    socketInstance.on('presence:online', ({ userId }) => {
      setOnlineUserIds((prev) => Array.from(new Set([...prev, userId])));
    });

    socketInstance.on('presence:offline', ({ userId }) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, token]);

  // Join/leave workspace room on workspace change
  useEffect(() => {
    if (socket && connected && currentWorkspace?._id) {
      socket.emit('workspace:join', { workspaceId: currentWorkspace._id });
      socket.emit('presence:get_online_users', { workspaceId: currentWorkspace._id });

      return () => {
        socket.emit('workspace:leave', { workspaceId: currentWorkspace._id });
      };
    }
  }, [socket, connected, currentWorkspace?._id]);

  const joinProject = (projectId) => {
    if (socket && connected && projectId) {
      socket.emit('project:join', { projectId });
    }
  };

  const leaveProject = (projectId) => {
    if (socket && connected && projectId) {
      socket.emit('project:leave', { projectId });
    }
  };

  const joinChannel = (channelId) => {
    if (socket && connected && channelId) {
      socket.emit('channel:join', { channelId });
    }
  };

  const leaveChannel = (channelId) => {
    if (socket && connected && channelId) {
      socket.emit('channel:leave', { channelId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onlineUserIds,
        joinProject,
        leaveProject,
        joinChannel,
        leaveChannel,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

