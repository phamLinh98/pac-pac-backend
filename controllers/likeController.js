import * as likeService from '../services/likeService.js';

export const togglePostLike = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const userId = Number(req.checkAccessToken?.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Bài viết không hợp lệ' });
    }
    const result = await likeService.togglePostLike(postId, userId);
    if (!result) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    return res.status(200).json(result);
  } catch (error) {
    console.error('togglePostLike error:', error);
    return res.status(500).json({ message: 'Không thể cập nhật lượt thích' });
  }
};
