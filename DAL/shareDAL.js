import sql from '../configs/db.js';
import * as shareModel from '../models/shareModel.js';
import { scheduleNotificationPipeline } from '../services/notificationPipeline.js';

export const sharePost = async (postId, userId, shareText) => {
  const { query, values } = shareModel.sharePost(postId, userId, shareText);
  const [result] = await sql(query, values);
  scheduleNotificationPipeline();
  return result;
};
