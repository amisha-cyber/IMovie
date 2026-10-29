import { Notification } from '../models/Notification.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    return successResponse(res, { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, 'Notification not found.', 404);
    }

    return successResponse(res, notification, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    return successResponse(res, null, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
};
