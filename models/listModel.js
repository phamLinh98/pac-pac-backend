/**
 * Lấy toàn bộ bài viết.
 *
 * Giữ nguyên logic hiện tại:
 * trước khi SELECT sẽ cập nhật số comment cho từng post.
 */
export const getList = () => {
  const query = `
    WITH updated_list AS (
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
      l."like",
      l.shared,
      l.likestatus,
      l.created_at,
      u.name AS user_name,
      u.avatar AS avatar
    FROM updated_list l
    JOIN public."user" u
      ON l.user_id = u.id
    ORDER BY l.created_at DESC;
  `;

  return query;
};

/**
 * Lấy toàn bộ bài viết của một user.
 */
export const getListStatusOfOneUser = (
  userId
) => {
  const query = `
    SELECT
      l.*,
      u.namecode,
      u.name,
      u.avatar,
      u.friends
    FROM list l
    JOIN public."user" u
      ON l.user_id = u.id
    WHERE l.user_id = $1
    ORDER BY l.created_at DESC;
  `;

  const values = [userId];

  return {
    query,
    values,
  };
};

/**
 * Lấy bài viết của những user nằm trong list_friend_id
 * của user đang đăng nhập.
 */
 export const getListStatusAllUserViaId = (userId) => {
   const query = `
     SELECT
       l.*,
       friend_user.namecode,
       friend_user.name,
       friend_user.avatar,
       friend_user.friends
     FROM public."user" AS cu
     JOIN list AS l
       ON l.user_id = ANY(
         COALESCE(
           cu.list_friend_id,
           ARRAY[]::bigint[]
         )
       )
     JOIN public."user" AS friend_user
       ON friend_user.id = l.user_id
     WHERE cu.id = $1
     ORDER BY l.created_at DESC;
   `;

   return {
     query,
     values: [userId],
   };
 };

/**
 * User tồn tại nhưng chưa có bài viết.
 */
export const getListReturnWhenUserIdNotExistInBoth =
  (userId) => {
    const query = `
      SELECT
        id AS user_id,
        name,
        namecode,
        avatar,
        friends,
        '{}'::jsonb AS content
      FROM public."user"
      WHERE id = $1;
    `;

    const values = [userId];

    return {
      query,
      values,
    };
  };

/**
 * Kiểm tra user tồn tại và có post hay không.
 *
 * 1: user tồn tại và có post
 * 2: user tồn tại nhưng chưa có post
 * 3: user không tồn tại
 */
export const checkUserIdExistInListAndUser = (
  userId
) => {
  const query = `
    SELECT
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM list
          WHERE user_id = $1
        )
        AND EXISTS (
          SELECT 1
          FROM public."user"
          WHERE id = $1
        )
        THEN 1

        WHEN NOT EXISTS (
          SELECT 1
          FROM list
          WHERE user_id = $1
        )
        AND EXISTS (
          SELECT 1
          FROM public."user"
          WHERE id = $1
        )
        THEN 2

        ELSE 3
      END AS result;
  `;

  const values = [userId];

  return {
    query,
    values,
  };
};

/**
 * Tạo bài viết mới.
 *
 * content.image chỉ lưu S3 object key:
 * posts/{userId}/{fileName}
 */
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
