import * as notificationService from '../services/notificationService.js';

const getAuthenticatedUserId = (req) => Number(req.checkAccessToken?.id);

export const getCommentNotifications = async (req, res) => {
  try {
    const receiverUserId = getAuthenticatedUserId(req);
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 30;
    const notifications = await notificationService.getCommentNotifications(
      receiverUserId,
      limit
    );
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error getting comment notifications:', error);
    res.status(500).json({ message: 'Không thể tải thông báo' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const receiverUserId = getAuthenticatedUserId(req);
    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({ message: 'Thông báo không hợp lệ' });
    }
    const notification = await notificationService.markNotificationAsRead(
      notificationId,
      receiverUserId
    );
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    return res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Không thể cập nhật thông báo' });
  }
};

export const markAllCommentNotificationsAsRead = async (req, res) => {
  try {
    const receiverUserId = getAuthenticatedUserId(req);
    const updated = await notificationService.markAllCommentNotificationsAsRead(
      receiverUserId
    );
    res.status(200).json({ updated_count: updated.length });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Không thể cập nhật thông báo' });
  }
};
