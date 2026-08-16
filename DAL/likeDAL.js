import sql from '../configs/db.js';
import * as likeModel from '../models/likeModel.js';
import { scheduleNotificationPipeline } from '../services/notificationPipeline.js';

export const togglePostLike = async (postId, userId) => {
  const { query, values } = likeModel.togglePostLike(postId, userId);
  const [result] = await sql(query, values);
  scheduleNotificationPipeline();
  return result;
};
