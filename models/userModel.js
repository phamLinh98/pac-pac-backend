export const getUser = () => {
  const query = `SELECT * FROM "public"."user"`;
  return query;
};

export const finUserViaUserId = (userId) => {
  const query = `
      SELECT id, name, email, avatar, namecode, friends, background
      FROM "public"."user"
      WHERE id = $1
      LIMIT 1
  `;
  const values = [userId];
  return { query, values };
};

export const loginUserByEmailAndPassword = (email, password) => {
  const query = `
            SELECT id, name, email, avatar, namecode, friends, background, list_friend_id
            FROM "public"."user"
            WHERE email = $1 AND password = $2
            LIMIT 1`;
  const values = [email, password];
  return { query, values };
};

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
      VALUES ($1,$2, NOW() + INTERVAL '1 day', NOW())
      RETURNING token_id, user_id, token, expiry_at, created_at)
      SELECT * FROM InsertNew `;
  const values = [userId, token];
  return { query, values };
};

export const getListFriendViaUserId = (userId) => {
  const query = `
   SELECT * from list_friend where user_id = $1`;
  const values = [userId];
  return { query, values };
};

export const getUserFriendOfLoginUser = (userId) => {
  const query = `SELECT id, name, email, avatar, list_friend_id
                 FROM "public"."user"
                 WHERE id != $1 `;
  const values = [userId];
  return { query, values };
};

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

export const updateAvatar = (userId, avatar) => {
  const query = `
       UPDATE "public"."user"
       SET avatar = $1
       WHERE id = $2
   `;
  const values = [avatar, userId];
  return { query, values };
};

export const getListSendFriend = (userId) => {
  const query = `
   SELECT * FROM friendships_send WHERE user_id_second= $1`;
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
      status = CASE
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
