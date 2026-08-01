export const getStory = () => {
  return `
    SELECT
      story.*,
      story.image AS image_key,
      user_account.name AS user_name,
      user_account.avatar
    FROM story
    JOIN "public"."user" AS user_account
      ON story.user_id = user_account.id
    WHERE story.created_at > NOW() - INTERVAL '24 hours'
    ORDER BY story.created_at DESC;
  `;
};

export const createStory = (userId, imageKey) => ({
  query: `
    WITH inserted_story AS (
      INSERT INTO story (user_id, image, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    )
    SELECT
      inserted_story.*,
      inserted_story.image AS image_key,
      user_account.name AS user_name,
      user_account.avatar
    FROM inserted_story
    JOIN "public"."user" AS user_account
      ON inserted_story.user_id = user_account.id;
  `,
  values: [userId, imageKey],
});

export const deleteStory = (storyId, userId) => ({
  query: `
    DELETE FROM story
    WHERE id = $1 AND user_id = $2
    RETURNING *, image AS image_key;
  `,
  values: [storyId, userId],
});

export const deleteExpiredStories = () => `
  DELETE FROM story
  WHERE created_at <= NOW() - INTERVAL '24 hours'
  RETURNING *, image AS image_key;
`;
