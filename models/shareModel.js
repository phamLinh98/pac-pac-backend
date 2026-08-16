export const sharePost = (requestedPostId, userId, shareText) => ({
  query: `
    WITH requested AS (
      SELECT * FROM list WHERE id = $1 AND delete_flg = 0
    ), source AS (
      SELECT original.* FROM requested
      JOIN list original ON original.id = COALESCE(requested.original_post_id, requested.id)
      WHERE original.delete_flg = 0
        AND (requested.share_snapshot IS NULL OR requested.original_post_id IS NOT NULL)
    ), created_share AS (
      INSERT INTO list (user_id, content, "like", shared, comment, created_at, original_post_id, share_snapshot)
      SELECT $2, jsonb_build_object('text', $3::text, 'image', '[]'::jsonb), 0, 0, 0, NOW(), source.id,
        jsonb_build_object(
          'original_post_id', source.id, 'author_id', source.user_id,
          'author_name', author.name, 'author_avatar', author_image.avatar,
          'content', source.content, 'created_at', source.created_at
        )
      FROM source JOIN public."user" author ON author.id = source.user_id AND author.delete_flg = 0
      LEFT JOIN public.user_image author_image ON author_image.user_id = author.id AND author_image.delete_flg = 0
      RETURNING *
    ), updated_source AS (
      UPDATE list
      SET shared = (SELECT COUNT(*) FROM list shares WHERE shares.original_post_id = list.id AND shares.delete_flg = 0)
      WHERE id IN (SELECT original_post_id FROM created_share) AND delete_flg = 0
      RETURNING id, shared
    ), outbox_event AS (
      INSERT INTO outbox_event (event_type, aggregate_type, aggregate_id, payload)
      SELECT 'notification.created', 'post_share', created_share.id::text,
        jsonb_build_object(
          'receiverUserId', source.user_id,
          'senderUserId', $2::bigint,
          'postId', source.id,
          'sharedPostId', created_share.id,
          'notificationType', 'SHARE'
        )
      FROM source CROSS JOIN created_share
      WHERE source.user_id <> $2
      RETURNING id
    )
    SELECT created_share.id, created_share.original_post_id,
      updated_source.shared::int AS share_count
    FROM created_share JOIN updated_source ON updated_source.id = created_share.original_post_id
  `,
  values: [requestedPostId, userId, shareText],
});
