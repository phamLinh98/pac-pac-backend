import sql from '../configs/db.js';
import * as userModel from '../models/userModel.js';

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

export const loginUserByEmailAndPassword = async (email, password) => {
    const { query, values } = userModel.loginUserByEmailAndPassword(email, password);
    const rows = await sql(query, values);
    return rows;
}

export const saveRefeshToken = async (userId, token) => {
   const {query, values} = userModel.saveRefeshToken(userId, token);
   const rows = await sql(query, values);
   return rows;
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
