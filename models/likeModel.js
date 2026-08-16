export const togglePostLike = (postId, userId) => ({
  query: `
    WITH deleted AS (
      UPDATE post_like SET delete_flg = 1
      WHERE post_id = $1 AND user_id = $2 AND delete_flg = 0
      RETURNING id
    ), inserted AS (
      INSERT INTO post_like (post_id, user_id)
      SELECT $1, $2
      WHERE NOT EXISTS (SELECT 1 FROM deleted)
        AND EXISTS (SELECT 1 FROM list WHERE id = $1 AND delete_flg = 0)
      ON CONFLICT (post_id, user_id) DO UPDATE SET delete_flg = 0
      RETURNING id
    ), removed_notification AS (
      UPDATE notification_message SET delete_flg = 1
      WHERE post_id = $1 AND sender_user_id = $2 AND notification_type = 'LIKE'
        AND delete_flg = 0 AND EXISTS (SELECT 1 FROM deleted)
      RETURNING id
    ), outbox_event AS (
      INSERT INTO outbox_event (event_type, aggregate_type, aggregate_id, payload)
      SELECT 'notification.created', 'post_like', l.id::text,
        jsonb_build_object(
          'receiverUserId', l.user_id,
          'senderUserId', $2::bigint,
          'postId', l.id,
          'notificationType', 'LIKE'
        )
      FROM list l
      WHERE l.id = $1 AND l.user_id <> $2 AND l.delete_flg = 0
        AND EXISTS (SELECT 1 FROM inserted)
      RETURNING id
    ), updated_post AS (
      UPDATE list
      SET "like" = GREATEST(
        0,
        (SELECT COUNT(*) FROM post_like WHERE post_id = $1 AND delete_flg = 0)
      )
      WHERE id = $1 AND delete_flg = 0
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
