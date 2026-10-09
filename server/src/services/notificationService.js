import { Notification } from '../models/Notification.js';
import { getSocketIO } from '../sockets/socketServer.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const NotificationService = {
  create: async ({ recipient, sender = null, workspace = null, type, title, message, link = '', data = {} }) => {
    try {
      // Don't notify oneself
      if (sender && String(recipient) === String(sender._id || sender)) {
        return null;
      }

      const notification = await Notification.create({
        recipient,
        sender: sender ? (sender._id || sender) : null,
        workspace,
        type,
        title,
        message,
        link,
        data,
      });

      const populated = await Notification.findById(notification._id)
        .populate('sender', 'name email avatar')
        .populate('workspace', 'name slug');

      const io = getSocketIO();
      if (io) {
        io.to(`user:${recipient}`).emit(SOCKET_EVENTS.NOTIFICATION_RECEIVED, populated);
      }

      return populated;
    } catch (err) {
      console.error('[NotificationService] Failed to create notification:', err.message);
      return null;
    }
  },

  createMany: async (recipients, { sender = null, workspace = null, type, title, message, link = '', data = {} }) => {
    const promises = recipients.map((recipientId) =>
      NotificationService.create({
        recipient: recipientId,
        sender,
        workspace,
        type,
        title,
        message,
        link,
        data,
      })
    );
    return Promise.all(promises);
  },
};

