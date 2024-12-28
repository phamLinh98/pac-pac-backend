
import * as userDAL from '../DAL/userDAL.js';
export const getUser = async () => {
    const rows = await userDAL.getUser();
    return rows;
}
