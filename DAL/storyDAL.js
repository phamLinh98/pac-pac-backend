import sql from "../configs/db.js"; 
import * as storyModel from '../models/storyModel.js';

export const getStory = async() => {
    const query = storyModel.getStory();
    const rows = await sql(query);
    return rows;
}

export const createStory = async (userId, imageKey) => {
    const { query, values } = storyModel.createStory(userId, imageKey);
    return sql(query, values);
}

export const deleteStory = async (storyId, userId) => {
    const { query, values } = storyModel.deleteStory(storyId, userId);
    return sql(query, values);
}

export const deleteExpiredStories = async () => {
    return sql(storyModel.deleteExpiredStories());
}
