import sql from '../configs/db.js';
import * as shareModel from '../models/shareModel.js';

export const sharePost = async (postId, userId) => {
  const { query, values } = shareModel.sharePost(postId, userId);
  const [result] = await sql(query, values);
  return result;
};
