import * as chatDAL from '../DAL/chatDAL.js';
import * as storageService from './storageService.js';

const resolveChat = async (chat, loginUserId) => {
  const members = await Promise.all((chat.members || []).map(async (member) => ({
    ...member,
    avatar: await storageService.resolveStoredImageUrl(member.avatar),
  })));
  const other = members.find((member) => Number(member.user_id) !== loginUserId);
  return {
    ...chat,
    members,
    display_name: chat.chat_type === 'GROUP' ? chat.chat_name : (other?.name || 'Cuộc trò chuyện'),
    display_avatar: chat.chat_type === 'GROUP'
      ? await storageService.resolveStoredImageUrl(chat.chat_avatar)
      : other?.avatar,
  };
};

export const getChats = async (userId) => Promise.all((await chatDAL.getChats(userId)).map((chat) => resolveChat(chat, userId)));
export const createDirectChat = (userId, otherUserId) => chatDAL.createDirectChat(userId, otherUserId);
export const createGroupChat = (userId, name, memberIds) => chatDAL.createGroupChat(userId, name, [...new Set([userId, ...memberIds])]);
export const getMessages = async (...args) => {
  const rows = await chatDAL.getMessages(...args);
  return Promise.all(rows.reverse().map(async (row) => ({
    ...row,
    sender_avatar: await storageService.resolveStoredImageUrl(row.sender_avatar),
  })));
};
export const sendMessage = async (...args) => {
  const row = await chatDAL.sendMessage(...args);
  if (!row) return row;
  return {
    ...row,
    sender_avatar: await storageService.resolveStoredImageUrl(row.sender_avatar),
  };
};
export const markChatRead = (...args) => chatDAL.markChatRead(...args);
export const addGroupMembers = (...args) => chatDAL.addGroupMembers(...args);
export const leaveGroup = (...args) => chatDAL.leaveGroup(...args);
