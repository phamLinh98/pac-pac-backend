import sql from "../configs/db.js";
import * as listModel from '../models/listModel.js';

export const getList = async () => {
    const queryObject = listModel.getList();
    const rows = await sql(queryObject);
    return rows;
}

export const getListStatusOfOneUser = async (userId) => {
    const { query, values } = listModel.checkUserIdExistInListAndUser(userId);
    const rows = await sql(query, values);
    const checkUserIdExistInListAndUser = rows[0].result;
    switch (checkUserIdExistInListAndUser) {
        case 1: {
            const { query, values } = listModel.getListStatusOfOneUser(userId);
            const rows = await sql(query, values);
            return rows;
        };
        case 2: {
            const { query, values } = listModel.getListReturnWhenUserIdNotExistInBoth(userId);
            const rows = await sql(query, values);
            return rows;
        }
        default:
            return [];
    }
}