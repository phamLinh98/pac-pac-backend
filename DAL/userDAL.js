import sql from '../configs/db.js';
import * as userModel from '../models/userModel.js';

export const getUser = async() => {
    const queryObject = userModel.getUser();
    const rows = await sql(queryObject);
    return rows;
}