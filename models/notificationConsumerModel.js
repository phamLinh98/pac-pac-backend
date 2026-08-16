export const insertFromEvent = (eventId, payload) => ({
  query: `
    INSERT INTO public.notification_message (
      receiver_user_id, sender_user_id, post_id, comment_id,
      notification_type, source_event_id, created_at, updated_at, delete_flg
    )
    SELECT $2::bigint, $3::bigint, $4::bigint, $5::bigint, $6::varchar, $1::uuid, NOW(), NOW(), 0
    WHERE EXISTS (SELECT 1 FROM public."user" WHERE id = $2 AND delete_flg = 0)
      AND CASE $6::varchar
        WHEN 'LIKE' THEN EXISTS (
          SELECT 1 FROM public.post_like WHERE post_id = $4 AND user_id = $3 AND delete_flg = 0
        )
        WHEN 'COMMENT_LIKE' THEN EXISTS (
          SELECT 1 FROM public.comment_like WHERE comment_id = $5 AND user_id = $3 AND delete_flg = 0
        )
        WHEN 'SHARE' THEN EXISTS (
          SELECT 1 FROM public.list WHERE id = $7 AND user_id = $3 AND delete_flg = 0
        )
        ELSE EXISTS (
          SELECT 1 FROM public.comment WHERE id = $5 AND delete_flg = 0
        )
      END
    ON CONFLICT (source_event_id) WHERE source_event_id IS NOT NULL DO NOTHING
    RETURNING id
  `,
  values: [
    eventId,
    payload.receiverUserId,
    payload.senderUserId,
    payload.postId,
    payload.commentId ?? null,
    payload.notificationType,
    payload.sharedPostId ?? null,
  ],
});
