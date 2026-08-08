import * as notificationDAL from '../DAL/notificationDAL.js';

export const getCommentNotifications = (receiverUserId, limit) =>
  notificationDAL.getCommentNotifications(receiverUserId, limit);

export const markNotificationAsRead = (notificationId, receiverUserId) =>
  notificationDAL.markNotificationAsRead(notificationId, receiverUserId);

export const markAllCommentNotificationsAsRead = (receiverUserId) =>
  notificationDAL.markAllCommentNotificationsAsRead(receiverUserId);
