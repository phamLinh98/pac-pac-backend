import * as storyDAL from '../DAL/storyDAL.js';
import * as storageService from './storageService.js';

const isStorageKey = (value) =>
    typeof value === 'string' &&
    value.trim() !== '' &&
    !value.startsWith('http://') &&
    !value.startsWith('https://');

const attachSignedUrl = async (story) => {
    if (!story) {
        return story;
    }

    const imageKey = story.image_key ?? story.image_url;
    const imageUrl = await storageService.resolveStoredImageUrl(imageKey);
    const avatarUrl = await storageService.resolveStoredImageUrl(story.avatar);

    return {
        ...story,
        avatar_key: story.avatar,
        avatar: avatarUrl,
        image_key: imageKey,
        image_url: imageUrl,
    };
};

const deleteStoryImages = async (stories) => {
    await storageService.deletePostImages(
        stories.map((story) => story?.image_key ?? story?.image_url).filter(isStorageKey)
    );
};

export const deleteExpiredStories = async () => {
    const expiredStories = await storyDAL.deleteExpiredStories();
    await deleteStoryImages(expiredStories);
    return expiredStories;
};

export const getStory = async () => {
    await deleteExpiredStories();
    const rows = await storyDAL.getStory();
    return Promise.all(rows.map(attachSignedUrl));
};

export const createStory = async (userId, file) => {
    const imageKey = await storageService.uploadStoryImage(userId, file);

    try {
        const rows = await storyDAL.createStory(userId, imageKey);
        return attachSignedUrl(rows[0] ?? null);
    } catch (error) {
        await storageService.deletePostImages([imageKey]).catch(() => undefined);
        throw error;
    }
};

export const deleteStory = async (storyId, userId) => {
    const rows = await storyDAL.deleteStory(storyId, userId);
    const deletedStory = rows[0] ?? null;

    if (deletedStory) {
        await deleteStoryImages([deletedStory]);
    }

    return deletedStory;
};
