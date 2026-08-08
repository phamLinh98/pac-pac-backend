import * as chatService from '../services/chatService.js';

const authId = (req) => Number(req.checkAccessToken?.id);
const positiveId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const memberIdsFrom = (value) => Array.isArray(value)
  ? [...new Set(value.map(Number).filter((id) => Number.isInteger(id) && id > 0))]
  : [];
const fail = (res, error, fallback) => {
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

export const getChats = async (req, res) => {
  try { return res.json(await chatService.getChats(authId(req))); }
  catch (error) { return fail(res, error, 'Không thể tải danh sách chat'); }
};

export const createDirectChat = async (req, res) => {
  try {
    const userId = authId(req); const otherUserId = Number(req.body?.userId);
    if (!positiveId(otherUserId) || otherUserId === userId) return res.status(400).json({ message: 'User nhận không hợp lệ' });
    const chat = await chatService.createDirectChat(userId, otherUserId);
    if (!chat) return res.status(404).json({ message: 'Không tìm thấy user' });
    return res.status(201).json(chat);
  } catch (error) { return fail(res, error, 'Không thể tạo chat 1-1'); }
};

export const createGroupChat = async (req, res) => {
  try {
    const userId = authId(req);
    const name = String(req.body?.name || '').trim();
    const memberIds = memberIdsFrom(req.body?.memberIds).filter((id) => id !== userId);
    if (!name || name.length > 255) return res.status(400).json({ message: 'Tên nhóm phải từ 1 đến 255 ký tự' });
    if (memberIds.length < 1 || memberIds.length > 99) return res.status(400).json({ message: 'Nhóm cần ít nhất một thành viên khác' });
    return res.status(201).json(await chatService.createGroupChat(userId, name, memberIds));
  } catch (error) { return fail(res, error, 'Không thể tạo group chat'); }
};

export const getMessages = async (req, res) => {
  try {
    const chatId = Number(req.params.id); const beforeId = positiveId(req.query.before) ? Number(req.query.before) : null;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    if (!positiveId(chatId)) return res.status(400).json({ message: 'Chat không hợp lệ' });
    return res.json(await chatService.getMessages(chatId, authId(req), beforeId, limit));
  } catch (error) { return fail(res, error, 'Không thể tải tin nhắn'); }
};

export const sendMessage = async (req, res) => {
  try {
    const chatId = Number(req.params.id); const message = String(req.body?.message || '').trim();
    if (!positiveId(chatId) || !message || message.length > 5000) return res.status(400).json({ message: 'Tin nhắn phải từ 1 đến 5000 ký tự' });
    const created = await chatService.sendMessage(chatId, authId(req), message);
    if (!created) return res.status(403).json({ message: 'Bạn không thuộc cuộc trò chuyện này' });
    return res.status(201).json(created);
  } catch (error) { return fail(res, error, 'Không thể gửi tin nhắn'); }
};

export const markRead = async (req, res) => {
  try {
    const updated = await chatService.markChatRead(Number(req.params.id), authId(req), Number(req.body?.messageId));
    if (!updated) return res.status(400).json({ message: 'Tin nhắn không hợp lệ' });
    return res.json(updated);
  } catch (error) { return fail(res, error, 'Không thể đánh dấu đã đọc'); }
};

export const addMembers = async (req, res) => {
  try {
    const memberIds = memberIdsFrom(req.body?.memberIds);
    if (!memberIds.length) return res.status(400).json({ message: 'Danh sách thành viên trống' });
    const rows = await chatService.addGroupMembers(Number(req.params.id), authId(req), memberIds);
    if (!rows.length) return res.status(403).json({ message: 'Bạn không có quyền thêm thành viên' });
    return res.json({ added_user_ids: rows.map((row) => row.user_id) });
  } catch (error) { return fail(res, error, 'Không thể thêm thành viên'); }
};

export const leaveGroup = async (req, res) => {
  try {
    const result = await chatService.leaveGroup(Number(req.params.id), authId(req));
    if (!result) return res.status(400).json({ message: 'Bạn không thuộc group chat này' });
    return res.status(204).end();
  } catch (error) { return fail(res, error, 'Không thể rời nhóm'); }
};
