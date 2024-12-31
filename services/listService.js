import * as listDAL from '../DAL/listDAL.js';
export const getList = async() => {
    const rows = await listDAL.getList();
    return rows;
}

export const getListStatusOfOneUser = async(userId) => {
    const rows = await listDAL.getListStatusOfOneUser(userId);
    return rows;
}