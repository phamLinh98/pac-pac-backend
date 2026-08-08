export const getUser = () => {
  const query = `SELECT * FROM "public"."user"`;
  return query;
};

export const finUserViaUserId = (userId) => {
  const query = `
      SELECT id, name, email, avatar, namecode, list_friend_id, background
      FROM "public"."user"
      WHERE id = $1
      LIMIT 1
  `;
  const values = [userId];
  return { query, values };
};

export const findUserForLogin = (email) => {
  const query = `
            SELECT id, name, email, password, avatar, namecode, list_friend_id, background
            FROM "public"."user"
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1`;
  const values = [email];
  return { query, values };
};

export const updatePasswordHash = (userId, passwordHash) => ({
  query: `UPDATE "public"."user" SET password = $2, updated_at = NOW() WHERE id = $1`,
  values: [userId, passwordHash],
});

export const saveRefeshToken = (userId, token) => {
  const query = `
      WITH DeleteExisting 
      AS (
          DELETE FROM "public"."refresh_tokens"
          WHERE user_id = $1
          RETURNING token_id
        ),
      InsertNew AS (
      INSERT INTO "public"."refresh_tokens" (user_id,token, expiry_at, created_at)
      VALUES ($1,$2, NOW() + INTERVAL '1 year', NOW())
      RETURNING token_id, user_id, token, expiry_at, created_at)
      SELECT * FROM InsertNew `;
  const values = [userId, token];
  return { query, values };
};

export const findValidRefreshToken = (userId, token, tokenDigest) => ({
  query: `
    SELECT token_id
    FROM "public"."refresh_tokens"
    WHERE user_id = $1 AND token IN ($2, $3) AND expiry_at > NOW()
    LIMIT 1
  `,
  values: [userId, token, tokenDigest],
});

export const revokeRefreshToken = (token, tokenDigest) => ({
  query: `DELETE FROM "public"."refresh_tokens" WHERE token IN ($1, $2)`,
  values: [token, tokenDigest],
});

export const getListFriendViaUserId = (userId) => {
  const query = `
    SELECT
      friend_account.id,
      friend_account.name,
      friend_account.avatar,
      friend_account.namecode,
      friend_account.list_friend_id
    FROM "public"."user" AS profile_user
    CROSS JOIN LATERAL unnest(
      COALESCE(profile_user.list_friend_id, ARRAY[]::BIGINT[])
    ) AS friend_id(id)
    JOIN "public"."user" AS friend_account
      ON friend_account.id = friend_id.id
    WHERE profile_user.id = $1
    ORDER BY friend_account.name ASC;
  `;
  const values = [userId];
  return { query, values };
};

export const getUserFriendOfLoginUser = (userId) => {
  const query = `SELECT id, name, avatar, list_friend_id
                 FROM "public"."user"
                 WHERE id != $1 `;
  const values = [userId];
  return { query, values };
};

export const searchUsers = (keyword, loginUserId) => ({
  query: `
    SELECT id, name, avatar, namecode
    FROM "public"."user"
    WHERE id <> $2
      AND (
        name ILIKE '%' || $1 || '%'
        OR COALESCE(namecode, '') ILIKE '%' || $1 || '%'
      )
    ORDER BY
      CASE
        WHEN name ILIKE $1 || '%' THEN 0
        ELSE 1
      END,
      name ASC
    LIMIT 10;
  `,
  values: [keyword, loginUserId],
});

export const createNewUser = (name, email, password) => {
  const query = `
    WITH new_user AS (
  INSERT INTO "public"."user" (name, email, password, avatar, created_at)
  VALUES ($1, $2, $3, 'https://i.pinimg.com/1200x/2f15f2e8c688b3120d3d26467b06330c.jpg', NOW())
  RETURNING id, name, email, avatar
),
insert_list AS (
  INSERT INTO list (user_id)
  SELECT id FROM new_user
  RETURNING user_id
)
SELECT new_user.id AS user_id, new_user.name, new_user.email, new_user.avatar
FROM new_user;

  `;
  const values = [name, email, password];
  return { query, values };
};

export const updateProfileImage = (userId, imageType, imageKey) => ({
  query: `
    UPDATE "public"."user"
    SET ${imageType === "avatar" ? "avatar" : "background"} = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING id, name, email, avatar, background, namecode, list_friend_id
  `,
  values: [userId, imageKey],
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
      FROM "public"."user" WHERE id = $1
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
      SELECT 1 FROM "public"."user"
      WHERE id = $1 AND (avatar = $2 OR background = $2)
    ) AS owns_media
  `,
  values: [userId, imageKey],
});

export const getListSendFriend = (userId) => {
  const query = `
    SELECT
      friend_request.*,
      sender.name AS sender_name,
      sender.avatar AS sender_avatar,
      receiver.name AS receiver_name,
      receiver.avatar AS receiver_avatar
    FROM "public"."friend_requests" AS friend_request
    JOIN "public"."user" AS sender
      ON sender.id = friend_request.sender_id
    JOIN "public"."user" AS receiver
      ON receiver.id = friend_request.receiver_id
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
      friend.avatar,
      friend.last_active_at,
      (friend.last_active_at >= NOW() - INTERVAL '10 minutes') AS is_online
    FROM public."user" owner
    CROSS JOIN LATERAL UNNEST(COALESCE(owner.list_friend_id, ARRAY[]::BIGINT[])) friend_id(id)
    JOIN public."user" friend ON friend.id = friend_id.id
    WHERE owner.id = $1
    ORDER BY is_online DESC, friend.name ASC
  `,
  values: [userId],
});
