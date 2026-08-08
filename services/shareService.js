import * as shareDAL from '../DAL/shareDAL.js';

export const sharePost = (postId, userId) => shareDAL.sharePost(postId, userId);
