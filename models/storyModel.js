export const getStory = () => {
  return `
    SELECT
      story.id,
      story.user_id,
      story.content,
      story.image_url,
      story.expires_at,
      story.created_at,
      story.image_url AS image_key,
      user_account.name AS user_name,
      COALESCE(story.avatar, user_image.avatar) AS avatar
    FROM story
    JOIN "public"."user" AS user_account
      ON story.user_id = user_account.id
    LEFT JOIN "public"."user_image" AS user_image ON user_image.user_id = user_account.id AND user_image.delete_flg = 0
    WHERE story.delete_flg = 0 AND user_account.delete_flg = 0 AND COALESCE(
      story.expires_at,
      story.created_at + INTERVAL '24 hours'
    ) > NOW()
    ORDER BY story.created_at DESC;
  `;
};

export const createStory = (userId, imageKey) => ({
  query: `
    WITH inserted_story AS (
      INSERT INTO story (
        user_id,
        image_url,
        expires_at,
        avatar
      )
      SELECT
        $1,
        $2,
        NOW() + INTERVAL '24 hours',
        user_image.avatar
      FROM "public"."user" AS user_account
      LEFT JOIN "public"."user_image" AS user_image ON user_image.user_id = user_account.id AND user_image.delete_flg = 0
      WHERE user_account.id = $1 AND user_account.delete_flg = 0
      RETURNING *
    )
    SELECT
      inserted_story.id,
      inserted_story.user_id,
      inserted_story.content,
      inserted_story.image_url,
      inserted_story.expires_at,
      inserted_story.created_at,
      inserted_story.image_url AS image_key,
      user_account.name AS user_name,
      COALESCE(inserted_story.avatar, user_image.avatar) AS avatar
    FROM inserted_story
    JOIN "public"."user" AS user_account
      ON inserted_story.user_id = user_account.id
    LEFT JOIN "public"."user_image" AS user_image ON user_image.user_id = user_account.id AND user_image.delete_flg = 0;
  `,
  values: [userId, imageKey],
});

export const deleteStory = (storyId, userId) => ({
  query: `
    UPDATE story
    SET delete_flg = 1
    WHERE id = $1 AND user_id = $2 AND delete_flg = 0
    RETURNING *, image_url AS image_key;
  `,
  values: [storyId, userId],
});

export const deleteExpiredStories = () => `
  UPDATE story
  SET delete_flg = 1
  WHERE delete_flg = 0 AND COALESCE(
    expires_at,
    created_at + INTERVAL '24 hours'
  ) <= NOW()
  RETURNING *, image_url AS image_key;
`;
