import sql from "../configs/db.js"; 
import * as listModel from '../models/listModel.js';

export const getList = async() => {
    const queryObject = listModel.getList();
    const rows = await sql(queryObject);
    return rows;
}