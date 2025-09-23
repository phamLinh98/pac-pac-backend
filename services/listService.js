import * as listDAL from '../DAL/listDAL.js';
export const getList = async() => {
    const rows = await listDAL.getList();
    return rows;
}

export const getListStatusOfOneUser = async(userId) => {
    const rows = await listDAL.getListStatusOfOneUser(userId);
    return rows;
}

export const getListUserStatusByUserId = async(userId) => {
    const rows = await listDAL.getListUserStatusByUserId(userId);
    return rows;
}

export const createNewPost = async(userId, content) => {
    const rows = await listDAL.createNewPost(userId, content);
    return rows;
}