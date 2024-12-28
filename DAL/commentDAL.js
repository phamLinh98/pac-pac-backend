import sql from '../configs/db.js';
import * as commentModel from '../models/commentModel.js';

export const getComment = async() => {
    const queryObject = commentModel.getComment();
    const rows = await sql(queryObject);
    return rows;
}