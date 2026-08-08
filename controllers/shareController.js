import * as shareService from '../services/shareService.js';

export const sharePost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const userId = Number(req.checkAccessToken?.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Bài viết không hợp lệ' });
    }
    const result = await shareService.sharePost(postId, userId);
    if (!result) return res.status(404).json({ message: 'Bài đăng không còn tồn tại' });
    return res.status(201).json(result);
  } catch (error) {
    console.error('sharePost error:', error);
    return res.status(500).json({ message: 'Không thể chia sẻ bài viết' });
  }
};
