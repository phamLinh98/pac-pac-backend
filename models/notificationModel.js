export const getCommentNotifications = (receiverUserId, limit = 30) => ({
  query: `
    SELECT
      n.id,
      n.receiver_user_id,
      n.sender_user_id,
      n.post_id,
      n.comment_id,
      n.notification_type,
      n.is_read,
      n.created_at,
      n.updated_at,
      post.user_id AS post_owner_user_id,
      sender.name AS sender_name,
      sender_image.avatar AS sender_avatar,
      c.content AS comment_content
    FROM notification_message n
    JOIN public."user" sender ON sender.id = n.sender_user_id
    LEFT JOIN public.user_image sender_image ON sender_image.user_id = sender.id AND sender_image.delete_flg = 0
    LEFT JOIN comment c ON c.id = n.comment_id AND c.delete_flg = 0
    LEFT JOIN list post ON post.id = n.post_id AND post.delete_flg = 0
    WHERE n.receiver_user_id = $1 AND n.delete_flg = 0 AND sender.delete_flg = 0
      AND n.notification_type IN ('COMMENT', 'LIKE', 'SHARE', 'COMMENT_LIKE', 'REPLY', 'MENTION')
    ORDER BY n.created_at DESC
    LIMIT $2
  `,
  values: [receiverUserId, limit],
});

export const markNotificationAsRead = (notificationId, receiverUserId) => ({
  query: `
    UPDATE notification_message
    SET is_read = TRUE, updated_at = NOW()
    WHERE id = $1 AND receiver_user_id = $2 AND delete_flg = 0
    RETURNING *
  `,
  values: [notificationId, receiverUserId],
});

export const markAllCommentNotificationsAsRead = (receiverUserId) => ({
  query: `
    UPDATE notification_message
    SET is_read = TRUE, updated_at = NOW()
    WHERE receiver_user_id = $1 AND delete_flg = 0
      AND notification_type IN ('COMMENT', 'LIKE', 'SHARE', 'COMMENT_LIKE', 'REPLY', 'MENTION')
      AND is_read = FALSE
    RETURNING id
  `,
  values: [receiverUserId],
});
