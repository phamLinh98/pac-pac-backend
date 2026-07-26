export const getList = () => {
  const query = `WITH updated_list AS (
    UPDATE list
    SET comment = (
        SELECT COUNT(*)
        FROM comment c
        WHERE c.post_id = list.id
    )
    RETURNING *
)
SELECT
    l.id,
    l.user_id,
    l.content,
    l.comment,
    l.like,
    l.shared,
    l.likestatus,
    l.created_at,
    u.name AS user_name,
    u.avatar AS avatar
FROM
    updated_list l
JOIN
    "public"."user" u ON l.user_id = u.id;`;
  return query;
};

// After click user profile get all list status of that user
export const getListStatusOfOneUser = (userId) => {
  const query = `SELECT l.*,u.namecode,u.name,u.avatar, u.friends
                   FROM list l
                   JOIN "public"."user" u ON l.user_id = u.id
                   WHERE l.user_id = $1`;
  const values = [userId];
  return { query, values };
};

export const getListStatusAllUserViaId = (userId) => {
  const query = `
    SELECT
      l.*,
      uu.namecode,
      uu.name,
      uu.avatar,
      uu.friends
    FROM public.user u
    JOIN list l
      ON l.user_id = ANY(u.list_friend_id)
    JOIN public.user uu
      ON l.user_id = uu.id
    WHERE u.id = $1
    ORDER BY l.created_at DESC;
  `;

  return {
    query,
    values: [userId],
  };
};

//If userId exist in user table but not in list table
export const getListReturnWhenUserIdNotExistInBoth = (userId) => {
  const query = `SELECT id as user_id, name,namecode, avatar,friends,'{}'::jsonb
                   AS content
                   FROM "public"."user"
                   WHERE id = $1;`;
  const values = [userId];
  return { query, values };
};

// check userId exist in user and list or not
export const checkUserIdExistInListAndUser = (userId) => {
  const query = `
        SELECT
            CASE
                WHEN EXISTS (SELECT 1 FROM list WHERE user_id = $1)
                AND EXISTS (SELECT 1 FROM "public"."user" WHERE id = $1)
                THEN 1
                WHEN NOT EXISTS (SELECT 1 FROM list WHERE user_id = $1)
                AND EXISTS (SELECT 1 FROM "public"."user" WHERE id = $1)
                THEN 2
                ELSE 3
                END AS result`;
  const values = [userId];
  return { query, values };
};

export const createNewPost = (
  userId,
  content
) => {
  const query = `
    INSERT INTO list (
      user_id,
      content,
      "like",
      shared,
      comment,
      created_at
    )
    VALUES (
      $1,
      $2::jsonb,
      0,
      0,
      0,
      NOW()
    )
    RETURNING *;
  `;

  const values = [
    userId,
    JSON.stringify(content),
  ];

  return {
    query,
    values,
  };
};
