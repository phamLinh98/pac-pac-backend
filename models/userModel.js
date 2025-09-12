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
            SELECT id, name, email, avatar, namecode, friends, background
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
  const query = `SELECT id, name, email, avatar
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
