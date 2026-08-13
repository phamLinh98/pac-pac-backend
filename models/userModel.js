export const finUserViaUserId = (userId) => {
  const query = `
      SELECT u.id, u.name, u.email, ui.avatar, u.namecode, u.list_friend_id, ui.background,
             info.address, info.education, info.bios
      FROM "public"."user" u
      LEFT JOIN "public"."user_image" ui ON ui.user_id = u.id
      LEFT JOIN "public"."user_info" info ON info.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
  `;
  const values = [userId];
  return { query, values };
};

export const getListFriendViaUserId = (userId) => {
  const query = `
    SELECT
      friend_account.id,
      friend_account.name,
      friend_image.avatar,
      friend_account.namecode,
      friend_account.list_friend_id
    FROM "public"."user" AS profile_user
    CROSS JOIN LATERAL unnest(
      COALESCE(profile_user.list_friend_id, ARRAY[]::BIGINT[])
    ) AS friend_id(id)
    JOIN "public"."user" AS friend_account
      ON friend_account.id = friend_id.id
    LEFT JOIN "public"."user_image" AS friend_image ON friend_image.user_id = friend_account.id
    WHERE profile_user.id = $1
    ORDER BY friend_account.name ASC;
  `;
  const values = [userId];
  return { query, values };
};

export const getUserFriendOfLoginUser = (userId) => {
  const query = `SELECT u.id, u.name, ui.avatar, u.list_friend_id
                 FROM "public"."user" u
                 LEFT JOIN "public"."user_image" ui ON ui.user_id = u.id
                 WHERE u.id != $1 `;
  const values = [userId];
  return { query, values };
};

export const searchUsers = (keyword, loginUserId) => ({
  query: `
    SELECT u.id, u.name, ui.avatar, u.namecode
    FROM "public"."user" u
    LEFT JOIN "public"."user_image" ui ON ui.user_id = u.id
    WHERE u.id <> $2
      AND (
        u.name ILIKE '%' || $1 || '%'
        OR COALESCE(u.namecode, '') ILIKE '%' || $1 || '%'
      )
    ORDER BY
      CASE
        WHEN u.name ILIKE $1 || '%' THEN 0
        ELSE 1
      END,
      u.name ASC
    LIMIT 10;
  `,
  values: [keyword, loginUserId],
});

export const updateProfileImage = (userId, imageType, imageKey) => ({
  query: `
    INSERT INTO "public"."user_image" (user_id, ${imageType === "avatar" ? "avatar" : "background"})
    VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE
    SET ${imageType === "avatar" ? "avatar" : "background"} = EXCLUDED.${imageType === "avatar" ? "avatar" : "background"}, updated_at = NOW()
    RETURNING user_id AS id, avatar, background
  `,
  values: [userId, imageKey],
});

export const updateProfileInfo = (userId, { address, education, bios }) => ({
  query: `
    INSERT INTO public.user_info (user_id, address, education, bios)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id) DO UPDATE SET
      address = EXCLUDED.address,
      education = EXCLUDED.education,
      bios = EXCLUDED.bios,
      updated_at = NOW()
    RETURNING user_id, address, education, bios, updated_at
  `,
  values: [userId, address, education, bios],
});

export const getProfileMedia = (userId) => ({
  query: `
    SELECT DISTINCT media.image_key
    FROM (
      SELECT jsonb_array_elements_text(
        CASE
          WHEN jsonb_typeof(content::jsonb->'image') = 'array' THEN content::jsonb->'image'
          ELSE '[]'::jsonb
        END
      ) AS image_key
      FROM list
      WHERE user_id = $1
      UNION ALL
      SELECT image_url AS image_key FROM story WHERE user_id = $1
      UNION ALL
      SELECT unnest(ARRAY[avatar, background]) AS image_key
      FROM "public"."user_image" WHERE user_id = $1
    ) AS media
    WHERE media.image_key IS NOT NULL AND media.image_key <> ''
    ORDER BY media.image_key
  `,
  values: [userId],
});

export const userOwnsMediaKey = (userId, imageKey) => ({
  query: `
    SELECT EXISTS (
      SELECT 1 FROM list
      WHERE user_id = $1
        AND jsonb_typeof(content::jsonb->'image') = 'array'
        AND (content::jsonb->'image') ? $2
      UNION ALL
      SELECT 1 FROM story WHERE user_id = $1 AND image_url = $2
      UNION ALL
      SELECT 1 FROM "public"."user_image"
      WHERE user_id = $1 AND (avatar = $2 OR background = $2)
    ) AS owns_media
  `,
  values: [userId, imageKey],
});

export const getListSendFriend = (userId) => {
  const query = `
    SELECT
      friend_request.*,
      sender.name AS sender_name,
      sender_image.avatar AS sender_avatar,
      receiver.name AS receiver_name,
      receiver_image.avatar AS receiver_avatar
    FROM "public"."friend_requests" AS friend_request
    JOIN "public"."user" AS sender
      ON sender.id = friend_request.sender_id
    JOIN "public"."user" AS receiver
      ON receiver.id = friend_request.receiver_id
    LEFT JOIN "public"."user_image" sender_image ON sender_image.user_id = sender.id
    LEFT JOIN "public"."user_image" receiver_image ON receiver_image.user_id = receiver.id
    WHERE friend_request.sender_id = $1::BIGINT
       OR friend_request.receiver_id = $1::BIGINT
    ORDER BY friend_request.updated_at DESC`;
  const values = [userId];
  return { query, values };
};

export const updateAddFriend = (userId, userId2) => {
  const query = `
BEGIN;

UPDATE users
SET list_friend_id = array_append(list_friend_id, $1)
WHERE id = $2;

UPDATE users
SET list_friend_id = array_append(list_friend_id, $2)
WHERE id = $1;

DELETE FROM friendship_send
WHERE user_second_id = $2 AND user_first_id = $1;

COMMIT;

  `;
  const values = [userId, userId2];
  return { query, values };
};

export const updateListFriend = (userId, userId2) => {
  const query = `
    WITH update_first_user AS (
      UPDATE "public"."user"
      SET 
        list_friend_id = array_append(
          COALESCE(list_friend_id, ARRAY[]::BIGINT[]),
          $2::BIGINT
        ),
        updated_at = NOW()
      WHERE id = $1
        AND NOT (
          $2::BIGINT = ANY(
            COALESCE(list_friend_id, ARRAY[]::BIGINT[])
          )
        )
      RETURNING id
    ),
    update_second_user AS (
      UPDATE "public"."user"
      SET 
        list_friend_id = array_append(
          COALESCE(list_friend_id, ARRAY[]::BIGINT[]),
          $1::BIGINT
        ),
        updated_at = NOW()
      WHERE id = $2
        AND NOT (
          $1::BIGINT = ANY(
            COALESCE(list_friend_id, ARRAY[]::BIGINT[])
          )
        )
      RETURNING id
    )
    SELECT
      EXISTS(SELECT 1 FROM update_first_user) AS first_user_updated,
      EXISTS(SELECT 1 FROM update_second_user) AS second_user_updated;
  `;

  const values = [userId, userId2];

  return { query, values };
};


export const sendFriendRequest = (senderId, receiverId) => {
  const query = `
    INSERT INTO "public"."friend_requests" (
      user_low_id,
      user_high_id,
      sender_id,
      receiver_id,
      status,
      created_at,
      updated_at
    )
    VALUES (
      LEAST($1::BIGINT, $2::BIGINT),
      GREATEST($1::BIGINT, $2::BIGINT),
      $1::BIGINT,
      $2::BIGINT,
      'pending',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_low_id, user_high_id)
    DO UPDATE SET
      sender_id = CASE
        WHEN COALESCE("friend_requests".status, '') IN ('', 'cancelled', 'rejected')
          THEN EXCLUDED.sender_id
        ELSE "friend_requests".sender_id
      END,
      receiver_id = CASE
        WHEN COALESCE("friend_requests".status, '') IN ('', 'cancelled', 'rejected')
          THEN EXCLUDED.receiver_id
        ELSE "friend_requests".receiver_id
      END,
      status = CASE
        WHEN COALESCE("friend_requests".status, '') IN ('', 'cancelled', 'rejected')
          THEN 'pending'
        WHEN "friend_requests".status = 'pending'
          AND "friend_requests".sender_id = EXCLUDED.receiver_id
          AND "friend_requests".receiver_id = EXCLUDED.sender_id
        THEN 'accepted'
        ELSE "friend_requests".status
      END,
      updated_at = NOW()
    RETURNING
      id,
      user_low_id,
      user_high_id,
      sender_id,
      receiver_id,
      status,
      created_at,
      updated_at;
  `;

  const values = [senderId, receiverId];

  return { query, values };
};

export const cancelFriendship = (userId, friendId) => ({
  query: `
    WITH updated_request AS (
      UPDATE "public"."friend_requests"
      SET status = 'cancelled', updated_at = NOW()
      WHERE user_low_id = LEAST($1::BIGINT, $2::BIGINT)
        AND user_high_id = GREATEST($1::BIGINT, $2::BIGINT)
        AND status = 'accepted'
      RETURNING id, status
    ),
    update_current_user AS (
      UPDATE "public"."user"
      SET
        list_friend_id = array_remove(
          COALESCE(list_friend_id, ARRAY[]::BIGINT[]),
          $2::BIGINT
        ),
        updated_at = NOW()
      WHERE id = $1
        AND EXISTS (SELECT 1 FROM updated_request)
      RETURNING id
    ),
    update_friend_user AS (
      UPDATE "public"."user"
      SET
        list_friend_id = array_remove(
          COALESCE(list_friend_id, ARRAY[]::BIGINT[]),
          $1::BIGINT
        ),
        updated_at = NOW()
      WHERE id = $2
        AND EXISTS (SELECT 1 FROM updated_request)
      RETURNING id
    )
    SELECT
      updated_request.id,
      updated_request.status,
      EXISTS(SELECT 1 FROM update_current_user) AS current_user_updated,
      EXISTS(SELECT 1 FROM update_friend_user) AS friend_user_updated
    FROM updated_request;
  `,
  values: [userId, friendId],
});

export const cancelFriendRequest = (senderId, receiverId) => ({
  query: `
    UPDATE "public"."friend_requests"
    SET status = 'cancelled', updated_at = NOW()
    WHERE user_low_id = LEAST($1::BIGINT, $2::BIGINT)
      AND user_high_id = GREATEST($1::BIGINT, $2::BIGINT)
      AND sender_id = $1
      AND receiver_id = $2
      AND status = 'pending'
    RETURNING
      id,
      sender_id,
      receiver_id,
      status,
      updated_at;
  `,
  values: [senderId, receiverId],
});

export const updateLastActive = (userId) => ({
  query: `
    UPDATE public."user" SET last_active_at = NOW() WHERE id = $1
    RETURNING last_active_at
  `,
  values: [userId],
});

export const getFriendPresence = (userId) => ({
  query: `
    SELECT
      friend.id,
      friend.name,
      friend_image.avatar,
      friend.last_active_at,
      (friend.last_active_at >= NOW() - INTERVAL '10 minutes') AS is_online
    FROM public."user" owner
    CROSS JOIN LATERAL UNNEST(COALESCE(owner.list_friend_id, ARRAY[]::BIGINT[])) friend_id(id)
    JOIN public."user" friend ON friend.id = friend_id.id
    LEFT JOIN public.user_image friend_image ON friend_image.user_id = friend.id
    WHERE owner.id = $1
    ORDER BY is_online DESC, friend.name ASC
  `,
  values: [userId],
});
