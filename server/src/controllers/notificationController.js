import { Notification } from '../models/Notification.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getUserNotifications = async (req, res, next) => {
  try {
    const { unreadOnly = 'false', limit = 30 } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate('sender', 'name email avatar')
      .populate('workspace', 'name slug');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return ApiResponse.success(res, { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    return ApiResponse.success(res, { notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    return ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    return ApiResponse.success(res, null, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

