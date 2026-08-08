export const togglePostLike = (postId, userId) => ({
  query: `
    WITH deleted AS (
      DELETE FROM post_like
      WHERE post_id = $1 AND user_id = $2
      RETURNING id
    ), inserted AS (
      INSERT INTO post_like (post_id, user_id)
      SELECT $1, $2
      WHERE NOT EXISTS (SELECT 1 FROM deleted)
        AND EXISTS (SELECT 1 FROM list WHERE id = $1)
      ON CONFLICT (post_id, user_id) DO NOTHING
      RETURNING id
    ), removed_notification AS (
      DELETE FROM notification_message
      WHERE post_id = $1 AND sender_user_id = $2 AND notification_type = 'LIKE'
        AND EXISTS (SELECT 1 FROM deleted)
      RETURNING id
    ), new_notification AS (
      INSERT INTO notification_message (
        receiver_user_id, sender_user_id, post_id, notification_type
      )
      SELECT l.user_id, $2, l.id, 'LIKE'
      FROM list l
      WHERE l.id = $1 AND l.user_id <> $2 AND EXISTS (SELECT 1 FROM inserted)
      RETURNING id
    ), updated_post AS (
      UPDATE list
      SET "like" = GREATEST(
        0,
        (SELECT COUNT(*) FROM post_like WHERE post_id = $1)
          + (SELECT COUNT(*) FROM inserted)
          - (SELECT COUNT(*) FROM deleted)
      )
      WHERE id = $1
      RETURNING id, "like"
    )
    SELECT
      updated_post.id AS post_id,
      updated_post."like"::int AS like_count,
      EXISTS (SELECT 1 FROM inserted) AS liked
    FROM updated_post
  `,
  values: [postId, userId],
});
