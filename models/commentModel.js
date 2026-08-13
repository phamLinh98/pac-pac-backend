export const getComment = () => `SELECT * FROM comment`;

export const getCommentByListId = (listId, viewerUserId) => ({
  query: `
    SELECT c.*, u.name AS user_name, ui.avatar,
      COALESCE(likes.like_count, 0)::INTEGER AS like_count,
      COALESCE(likes.is_liked, FALSE) AS is_liked,
      COALESCE(mentions.users, '[]'::JSON) AS mentions
    FROM comment c
    JOIN public."user" u ON u.id = c.user_id
    LEFT JOIN public.user_image ui ON ui.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS like_count,
        BOOL_OR(cl.user_id = $2) AS is_liked
      FROM comment_like cl WHERE cl.comment_id = c.id
    ) likes ON TRUE
    LEFT JOIN LATERAL (
      SELECT JSON_AGG(JSON_BUILD_OBJECT('id', mu.id, 'name', mu.name)) AS users
      FROM comment_mention cm JOIN public."user" mu ON mu.id = cm.user_id
      WHERE cm.comment_id = c.id
    ) mentions ON TRUE
    WHERE c.list_id = $1
    ORDER BY c.created_at ASC
  `,
  values: [listId, viewerUserId],
});

export const addComment = (userId, listId, content, imageKey, parentCommentId, mentionUserIds) => ({
  query: `
    WITH new_comment AS (
      INSERT INTO comment (list_id, user_id, content, image_key, parent_comment_id, created_at, updated_at)
      SELECT $1, $2, NULLIF($3, ''), $4, pc.id, NOW(), NOW()
      FROM (SELECT 1) seed
      LEFT JOIN comment pc ON pc.id = $5 AND pc.list_id = $1
      RETURNING *
    ), inserted_mentions AS (
      INSERT INTO comment_mention (comment_id, user_id)
      SELECT nc.id, mentioned_id
      FROM new_comment nc
      CROSS JOIN UNNEST($6::BIGINT[]) mentioned_id
      JOIN public."user" mentioned_user ON mentioned_user.id = mentioned_id
      WHERE mentioned_id <> $2
      ON CONFLICT DO NOTHING
      RETURNING user_id
    ), updated_post AS (
      UPDATE list SET comment = (SELECT COUNT(*) FROM comment WHERE list_id = $1) + 1
      WHERE id = $1 RETURNING id
    ), candidates AS (
      SELECT im.user_id receiver_id, 'MENTION'::VARCHAR notification_type, 1 priority
      FROM inserted_mentions im
      UNION ALL
      SELECT pc.user_id, 'REPLY'::VARCHAR, 2
      FROM comment pc JOIN new_comment nc ON pc.id = nc.parent_comment_id
      WHERE pc.user_id <> $2
      UNION ALL
      SELECT l.user_id, 'COMMENT'::VARCHAR, 3
      FROM list l WHERE l.id = $1 AND l.user_id <> $2
    ), unique_receivers AS (
      SELECT DISTINCT ON (receiver_id) receiver_id, notification_type
      FROM candidates WHERE receiver_id <> $2 ORDER BY receiver_id, priority
    ), new_notifications AS (
      INSERT INTO notification_message (receiver_user_id, sender_user_id, post_id, comment_id, notification_type)
      SELECT ur.receiver_id, $2, $1, nc.id, ur.notification_type
      FROM unique_receivers ur CROSS JOIN new_comment nc
    )
    SELECT * FROM new_comment
  `,
  values: [listId, userId, content, imageKey, parentCommentId, mentionUserIds],
});

export const toggleCommentLike = (commentId, userId) => ({
  query: `
    WITH target AS (
      SELECT c.id, c.user_id, c.list_id FROM comment c WHERE c.id = $1
    ), removed AS (
      DELETE FROM comment_like WHERE comment_id = $1 AND user_id = $2 RETURNING id
    ), inserted AS (
      INSERT INTO comment_like (comment_id, user_id)
      SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM removed) AND EXISTS (SELECT 1 FROM target)
      RETURNING id
    ), removed_notification AS (
      DELETE FROM notification_message
      WHERE comment_id = $1 AND sender_user_id = $2 AND notification_type = 'COMMENT_LIKE'
        AND EXISTS (SELECT 1 FROM removed)
    ), new_notification AS (
      INSERT INTO notification_message (receiver_user_id, sender_user_id, post_id, comment_id, notification_type)
      SELECT t.user_id, $2, t.list_id, t.id, 'COMMENT_LIKE'
      FROM target t WHERE t.user_id <> $2 AND EXISTS (SELECT 1 FROM inserted)
    )
    SELECT EXISTS(SELECT 1 FROM inserted) AS is_liked,
      (SELECT COUNT(*)::INTEGER FROM comment_like WHERE comment_id = $1) AS like_count
  `,
  values: [commentId, userId],
});

export const updateComment = (commentId, userId, content) => ({
  query: `
    UPDATE comment SET content = NULLIF($3, ''), updated_at = NOW()
    WHERE id = $1 AND user_id = $2 AND (NULLIF($3, '') IS NOT NULL OR image_key IS NOT NULL)
    RETURNING *
  `,
  values: [commentId, userId, content],
});

export const deleteComment = (commentId, userId) => ({
  query: `
    WITH deleted_notifications AS (
      DELETE FROM notification_message
      WHERE comment_id = $1
        AND EXISTS (SELECT 1 FROM comment WHERE id = $1 AND user_id = $2)
    ), deleted AS (
      DELETE FROM comment WHERE id = $1 AND user_id = $2
      RETURNING id, list_id, image_key
    ), updated_post AS (
      UPDATE list SET comment = (SELECT COUNT(*) FROM comment WHERE list_id = (SELECT list_id FROM deleted)) - 1
      WHERE id = (SELECT list_id FROM deleted)
    )
    SELECT * FROM deleted
  `,
  values: [commentId, userId],
});
