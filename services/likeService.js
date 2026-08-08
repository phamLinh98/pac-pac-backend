import * as likeDAL from '../DAL/likeDAL.js';

export const togglePostLike = (postId, userId) =>
  likeDAL.togglePostLike(postId, userId);
