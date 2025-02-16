export const getUser = () => {
    const query = `SELECT * FROM "public"."user"`;
    return query;
}

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
    const values = [email, password]
    return { query, values };
}

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
   return {query, values};
}