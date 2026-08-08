import sql from '../configs/db.js';
import * as notificationModel from '../models/notificationModel.js';

const run = async ({ query, values }) => sql(query, values);

export const getCommentNotifications = (receiverUserId, limit) =>
  run(notificationModel.getCommentNotifications(receiverUserId, limit));

export const markNotificationAsRead = async (notificationId, receiverUserId) => {
  const [notification] = await run(
    notificationModel.markNotificationAsRead(notificationId, receiverUserId)
  );
  return notification;
};

export const markAllCommentNotificationsAsRead = (receiverUserId) =>
  run(notificationModel.markAllCommentNotificationsAsRead(receiverUserId));
