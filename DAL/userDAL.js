import sql from '../configs/db.js';
import * as userModel from '../models/userModel.js';
import crypto from 'crypto';

const tokenDigest = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const getUser = async () => {
    try {
      const queryObject = userModel.getUser();
      const rows = await sql(queryObject);
  
      if (rows && rows.length > 0) {
        // Tạo một mảng mới chỉ chứa id, name, email và avatar
        const users = rows.map(user => {
          const { id, name, email, avatar } = user;
          return { id, name, email, avatar };
        });
  
        return users; // Trả về mảng các đối tượng người dùng
      } else {
        // Không tìm thấy người dùng nào
        return []; // Trả về mảng rỗng
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      return []; // Trả về mảng rỗng trong trường hợp lỗi
    }
  };

export const finUserViaUserId = async(userId) => {
    const {query, values} = userModel.finUserViaUserId(userId);
    const rows = await sql(query, values);
    return rows;

}

export const findUserForLogin = async (email) => {
    const { query, values } = userModel.findUserForLogin(email);
    const rows = await sql(query, values);
    return rows;
}

export const updatePasswordHash = async (userId, passwordHash) => {
    const { query, values } = userModel.updatePasswordHash(userId, passwordHash);
    return sql(query, values);
}

export const saveRefeshToken = async (userId, token) => {
   const {query, values} = userModel.saveRefeshToken(userId, tokenDigest(token));
   const rows = await sql(query, values);
   return rows;
}

export const findValidRefreshToken = async (userId, token) => {
    const { query, values } = userModel.findValidRefreshToken(userId, token, tokenDigest(token));
    return sql(query, values);
}

export const revokeRefreshToken = async (token) => {
    const { query, values } = userModel.revokeRefreshToken(token, tokenDigest(token));
    return sql(query, values);
}


export const getListFriendViaUserId = async(userId) => {
    const {query, values} = userModel.getListFriendViaUserId(userId);
    const rows = await sql(query,values);
    return rows;
}

export const getUserFriendOfLoginUser = async(userId) => {
    const {query, values} = userModel.getUserFriendOfLoginUser(userId);
    const rows = await sql(query,values);
    return rows;
}

export const searchUsers = async (keyword, loginUserId) => {
    const { query, values } = userModel.searchUsers(keyword, loginUserId);
    return sql(query, values);
}

export const createNewUser = async(name, email, password) => {
    const {query, values} = userModel.createNewUser(name, email, password);
    const rows = await sql(query, values);
    return rows;
}

export const createUserList = async(userId) => {
    const {query, values} = userModel.createUserList(userId);
    const rows = await sql(query, values);
    return rows;
}

export const updateProfileImage = async(userId, imageType, imageKey) => {
    const {query, values} = userModel.updateProfileImage(userId, imageType, imageKey);
    const rows = await sql(query, values);
    return rows;
}

export const getProfileMedia = async (userId) => {
    const { query, values } = userModel.getProfileMedia(userId);
    return sql(query, values);
}

export const userOwnsMediaKey = async (userId, imageKey) => {
    const { query, values } = userModel.userOwnsMediaKey(userId, imageKey);
    const rows = await sql(query, values);
    return rows[0]?.owns_media === true;
}

export const getListSendFriend = async(userId) => {
    const {query, values} = userModel.getListSendFriend(userId);
    const rows = await sql(query, values);
    return rows;
}

export const updateAddFriend = async(userId, userId2) => {
    const {query, values} = userModel.updateAddFriend(userId, userId2);
    const rows = await sql(query, values);
    return rows;
}

export const updateListFriend = async (userId, userId2) => {
    const { query, values } = userModel.updateListFriend(userId, userId2);
    const rows = await sql(query, values);
    return rows;
}

export const sendFriendRequest = async (userId, userId2) => {
    const { query, values } = userModel.sendFriendRequest(userId, userId2);
    const rows = await sql(query, values);
    return rows;
}

export const cancelFriendship = async (userId, friendId) => {
    const { query, values } = userModel.cancelFriendship(userId, friendId);
    return sql(query, values);
}

export const cancelFriendRequest = async (senderId, receiverId) => {
    const { query, values } = userModel.cancelFriendRequest(senderId, receiverId);
    return sql(query, values);
}
