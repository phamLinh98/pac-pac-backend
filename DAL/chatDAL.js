import sql from '../configs/db.js';
import * as chatModel from '../models/chatModel.js';

const run = ({ query, values }) => sql(query, values);
export const getChats = (userId) => run(chatModel.getChats(userId));
export const createDirectChat = async (userId, otherUserId) => (await run(chatModel.createDirectChat(userId, otherUserId)))[0];
export const createGroupChat = async (userId, name, memberIds) => (await run(chatModel.createGroupChat(userId, name, memberIds)))[0];
export const getMessages = (chatId, userId, beforeId, limit) => run(chatModel.getMessages(chatId, userId, beforeId, limit));
export const sendMessage = async (chatId, userId, message) => (await run(chatModel.sendMessage(chatId, userId, message)))[0];
export const markChatRead = async (chatId, userId, messageId) => (await run(chatModel.markChatRead(chatId, userId, messageId)))[0];
export const addGroupMembers = (chatId, actorId, memberIds) => run(chatModel.addGroupMembers(chatId, actorId, memberIds));
export const leaveGroup = async (chatId, userId) => (await run(chatModel.leaveGroup(chatId, userId)))[0];
