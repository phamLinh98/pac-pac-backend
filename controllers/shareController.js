import * as shareService from '../services/shareService.js';

export const sharePost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const userId = Number(req.checkAccessToken?.id);
    const shareText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Bài viết không hợp lệ' });
    }
    if (shareText.length > 2000) {
      return res.status(400).json({ message: 'Nội dung chia sẻ không được vượt quá 2000 ký tự' });
    }
    const result = await shareService.sharePost(postId, userId, shareText);
    if (!result) return res.status(404).json({ message: 'Bài đăng không còn tồn tại' });
    return res.status(201).json(result);
  } catch (error) {
    console.error('sharePost error:', error);
    return res.status(500).json({ message: 'Không thể chia sẻ bài viết' });
  }
};
