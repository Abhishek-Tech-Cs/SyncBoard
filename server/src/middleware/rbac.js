import { ApiError } from '../utils/errors.js';
import { ROLE_HIERARCHY, hasPermission } from '../constants/roles.js';

/**
 * Ensures user has at least the minimum role level in the current workspace.
 * e.g., requireMinRole('MANAGER') allows OWNER, ADMIN, and MANAGER.
 */
export const requireMinRole = (minRole) => {
  return (req, res, next) => {
    try {
      if (!req.userRole) {
        throw ApiError.forbidden('No workspace role found in context');
      }

      const userRoleLevel = ROLE_HIERARCHY[req.userRole] || 0;
      const minRoleLevel = ROLE_HIERARCHY[minRole] || 999;

      if (userRoleLevel < minRoleLevel) {
        throw ApiError.forbidden(`Permission denied: Action requires minimum role '${minRole}'`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Ensures user has a specific granular permission in the workspace.
 * e.g., requirePermission(PERMISSIONS.TASK_DELETE)
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.userRole) {
        throw ApiError.forbidden('No workspace role found in context');
      }

      if (!hasPermission(req.userRole, permission)) {
        throw ApiError.forbidden(`Permission denied: You do not have permission '${permission}'`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

