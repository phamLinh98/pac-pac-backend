export const claimEvents = (limit) => ({
  query: `
    WITH picked AS (
      SELECT id
      FROM public.outbox_event
      WHERE delete_flg = 0
        AND attempt_count < 10
        AND available_at <= NOW()
        AND (status = 'AVAILABLE' OR (status = 'PROCESSING' AND locked_until <= NOW()))
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT $1
    )
    UPDATE public.outbox_event event
    SET status = 'PROCESSING', locked_until = NOW() + INTERVAL '60 seconds',
        attempt_count = attempt_count + 1, updated_at = NOW()
    FROM picked
    WHERE event.id = picked.id
    RETURNING event.id, event.event_type, event.payload, event.attempt_count
  `,
  values: [limit],
});

export const markPublished = (eventId) => ({
  query: `
    UPDATE public.outbox_event
    SET status = 'PUBLISHED', published_at = NOW(), locked_until = NULL,
        last_error = NULL, updated_at = NOW()
    WHERE id = $1::uuid AND status = 'PROCESSING' AND delete_flg = 0
    RETURNING id
  `,
  values: [eventId],
});

export const releaseForRetry = (eventId, error, delaySeconds) => ({
  query: `
    UPDATE public.outbox_event
    SET status = CASE WHEN attempt_count >= 10 THEN 'FAILED' ELSE 'AVAILABLE' END,
        available_at = NOW() + ($3::text || ' seconds')::interval,
        locked_until = NULL, last_error = LEFT($2, 2000), updated_at = NOW()
    WHERE id = $1::uuid AND status = 'PROCESSING' AND delete_flg = 0
    RETURNING id, status
  `,
  values: [eventId, error, delaySeconds],
});
