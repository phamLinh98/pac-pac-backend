import sql from '../configs/db.js';
import * as userModel from '../models/userModel.js';

export const getUser = async () => {
    const queryObject = userModel.getUser();
    const rows = await sql(queryObject);
    return rows;
}

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