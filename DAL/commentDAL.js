import sql from '../configs/db.js';
import * as commentModel from '../models/commentModel.js';

export const getComment = async() => {
    const queryObject = commentModel.getComment();
    const rows = await sql(queryObject);
    return rows;
}

export const getCommentByListId = async (listId) => {
    const {query,values} = commentModel.getCommentByListId(listId);
    const rows = await sql(query,values);
    return rows;
}