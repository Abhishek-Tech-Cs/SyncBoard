export const SOCKET_EVENTS = {
  // Connection & Room Management
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_WORKSPACE: 'workspace:join',
  LEAVE_WORKSPACE: 'workspace:leave',
  JOIN_PROJECT: 'project:join',
  LEAVE_PROJECT: 'project:leave',
  JOIN_CHANNEL: 'channel:join',
  LEAVE_CHANNEL: 'channel:leave',

  // Presence
  USER_ONLINE: 'presence:online',
  USER_OFFLINE: 'presence:offline',
  USER_STATUS_CHANGE: 'presence:status_change',
  GET_ONLINE_USERS: 'presence:get_online_users',

  // Tasks (Real-time Kanban)
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_MOVED: 'task:moved',
  TASK_DELETED: 'task:deleted',
  TASK_ASSIGNED: 'task:assigned',

  // Comments & Activity
  COMMENT_ADDED: 'comment:added',
  COMMENT_DELETED: 'comment:deleted',
  ACTIVITY_LOGGED: 'activity:logged',

  // Chat
  MESSAGE_SENT: 'message:sent',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  TYPING_START: 'chat:typing_start',
  TYPING_STOP: 'chat:typing_stop',
  NEW_CHANNEL: 'channel:created',

  // Notifications
  NOTIFICATION_RECEIVED: 'notification:received',
  NOTIFICATION_READ: 'notification:read',
};

