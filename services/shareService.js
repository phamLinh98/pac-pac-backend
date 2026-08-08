import * as shareDAL from '../DAL/shareDAL.js';

export const sharePost = (postId, userId, shareText) =>
  shareDAL.sharePost(postId, userId, shareText);
