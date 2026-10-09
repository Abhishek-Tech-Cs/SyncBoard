import { ActivityLog } from '../models/ActivityLog.js';
import { getSocketIO } from '../sockets/socketServer.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const ActivityService = {
  log: async ({ workspace, project = null, task = null, actor, action, entityType, entityId, details = {} }) => {
    try {
      const activity = await ActivityLog.create({
        workspace,
        project,
        task,
        actor: actor._id || actor,
        action,
        entityType,
        entityId,
        details,
      });

      const populatedActivity = await ActivityLog.findById(activity._id).populate('actor', 'name email avatar');

      // Real-time broadcast to project room or workspace room
      const io = getSocketIO();
      if (io) {
        if (project) {
          io.to(`project:${project}`).emit(SOCKET_EVENTS.ACTIVITY_LOGGED, populatedActivity);
        } else if (workspace) {
          io.to(`workspace:${workspace}`).emit(SOCKET_EVENTS.ACTIVITY_LOGGED, populatedActivity);
        }
      }

      return populatedActivity;
    } catch (err) {
      console.error('[ActivityService] Failed to create activity log:', err.message);
      return null;
    }
  },
};

