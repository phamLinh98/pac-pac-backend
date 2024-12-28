import * as listDAL from '../DAL/listDAL.js';
export const getList = async() => {
    const rows = await listDAL.getList();
    return rows;
}