import sql from "../configs/db.js"; 
import * as storyModel from '../models/storyModel.js';

export const getStory = async() => {
    const queryObject = storyModel.getStory();
    const rows = await sql(queryObject);
    return rows;
}