import * as storyDAL from '../DAL/storyDAL.js';
export const getStory = async() => {
    const rows = await storyDAL.getStory();
    return rows;
}