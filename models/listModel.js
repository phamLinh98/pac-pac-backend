/**
 * Lấy toàn bộ bài viết.
 *
 * Giữ nguyên logic hiện tại:
 * trước khi SELECT sẽ cập nhật số comment cho từng post.
 */
export const getList = (viewerUserId) => {
  const query = `
    SELECT
      l.id,
      l.user_id,
      l.content,
      l.original_post_id,
      l.share_snapshot,
      (l.share_snapshot IS NOT NULL) AS is_shared_post,
      (op.id IS NOT NULL) AS original_post_exists,
      op.content AS original_content,
      op.created_at AS original_created_at,
      ou.id AS original_author_id,
      ou.name AS original_author_name,
      oui.avatar AS original_author_avatar,
      CASE WHEN l.share_snapshot IS NOT NULL AND op.id IS NOT NULL THEN op.shared ELSE l.shared END AS shared,
      (SELECT COUNT(*) FROM comment c WHERE c.list_id = l.id)::int AS comment,
      (SELECT COUNT(*) FROM post_like pl WHERE pl.post_id = l.id)::int AS "like",
      CASE WHEN l.share_snapshot IS NOT NULL AND op.id IS NOT NULL THEN op.shared ELSE l.shared END AS shared,
      EXISTS (SELECT 1 FROM post_like pl WHERE pl.post_id = l.id AND pl.user_id = $1) AS likestatus,
      l.created_at,
      u.name AS user_name,
      ui.avatar AS avatar,
      ui.background AS background
    FROM list l
    JOIN public."user" u
      ON l.user_id = u.id
    LEFT JOIN public.user_image ui ON ui.user_id = u.id
    LEFT JOIN list op ON op.id = l.original_post_id
    LEFT JOIN public."user" ou ON ou.id = op.user_id
    LEFT JOIN public.user_image oui ON oui.user_id = ou.id
    ORDER BY l.created_at DESC;
  `;
  return { query, values: [viewerUserId] };
};

/**
 * Lấy toàn bộ bài viết của một user.
 */
export const getListStatusOfOneUser = (
  userId,
  viewerUserId
) => {
  const query = `
    SELECT
      l.*,
      (l.share_snapshot IS NOT NULL) AS is_shared_post,
      (op.id IS NOT NULL) AS original_post_exists,
      op.content AS original_content,
      op.created_at AS original_created_at,
      ou.id AS original_author_id,
      ou.name AS original_author_name,
      oui.avatar AS original_author_avatar,
      (SELECT COUNT(*) FROM comment c WHERE c.list_id = l.id)::int AS comment,
      (SELECT COUNT(*) FROM post_like pl WHERE pl.post_id = l.id)::int AS "like",
      EXISTS (SELECT 1 FROM post_like pl WHERE pl.post_id = l.id AND pl.user_id = $2) AS likestatus,
      u.namecode,
      u.name,
      ui.avatar,
      ui.background,
      info.address,
      info.education,
      info.bios,
      u.list_friend_id
    FROM list l
    JOIN public."user" u
      ON l.user_id = u.id
    LEFT JOIN public.user_image ui ON ui.user_id = u.id
    LEFT JOIN public.user_info info ON info.user_id = u.id
    LEFT JOIN list op ON op.id = l.original_post_id
    LEFT JOIN public."user" ou ON ou.id = op.user_id
    LEFT JOIN public.user_image oui ON oui.user_id = ou.id
    WHERE l.user_id = $1
    ORDER BY l.created_at DESC;
  `;

  const values = [userId, viewerUserId];

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
       (l.share_snapshot IS NOT NULL) AS is_shared_post,
       (op.id IS NOT NULL) AS original_post_exists,
       op.content AS original_content,
       op.created_at AS original_created_at,
       ou.id AS original_author_id,
       ou.name AS original_author_name,
       oui.avatar AS original_author_avatar,
       CASE WHEN l.share_snapshot IS NOT NULL AND op.id IS NOT NULL THEN op.shared ELSE l.shared END AS shared,
       (SELECT COUNT(*) FROM comment c WHERE c.list_id = l.id)::int AS comment,
       (SELECT COUNT(*) FROM post_like pl WHERE pl.post_id = l.id)::int AS "like",
       EXISTS (SELECT 1 FROM post_like pl WHERE pl.post_id = l.id AND pl.user_id = $1) AS likestatus,
       friend_user.namecode,
       friend_user.name,
       friend_image.avatar,
       friend_image.background,
       friend_user.list_friend_id
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
     LEFT JOIN public.user_image friend_image ON friend_image.user_id = friend_user.id
     LEFT JOIN list op ON op.id = l.original_post_id
     LEFT JOIN public."user" ou ON ou.id = op.user_id
     LEFT JOIN public.user_image oui ON oui.user_id = ou.id
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
        ui.avatar,
        ui.background,
        list_friend_id,
        '{}'::jsonb AS content
      FROM public."user" u
      LEFT JOIN public.user_image ui ON ui.user_id = u.id
      WHERE u.id = $1;
    `;

    const values = [userId];

    return {
      query,
      values,
    };
  };

export const getListUserIdWithEmptyContent = (userId) => {
  const query = `
    SELECT
      u.id,
      u.id AS user_id,
      '{}'::jsonb AS content,
      0 AS comment,
      0 AS "like",
      0 AS shared,
      false AS likestatus,
      NULL::timestamptz AS created_at,
      NULL::timestamptz AS updated_at,
      u.namecode,
      u.name,
      ui.avatar,
      ui.background,
      info.address,
      info.education,
      info.bios,
      u.list_friend_id
    FROM public."user" u
    LEFT JOIN public.user_image ui ON ui.user_id = u.id
    LEFT JOIN public.user_info info ON info.user_id = u.id
    WHERE u.id = $1;
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

export const getPostByIdAndUser = (postId, userId) => ({
  query: `SELECT id, user_id, content FROM list WHERE id = $1 AND user_id = $2 LIMIT 1`,
  values: [postId, userId],
});

/**
 * Cập nhật bài viết.
 *
 * content.image chỉ lưu S3 object key:
 * posts/{userId}/{fileName}
 */
export const updatePost = (
  postId,
  userId,
  content
) => {
  const query = `
    UPDATE list
    SET content = $1::jsonb
    WHERE id = $2 AND user_id = $3
    RETURNING *;
  `;

  const values = [
    JSON.stringify(content),
    postId,
    userId,
  ];

  return {
    query,
    values,
  };
};

/**
 * Xoá bài viết.
 *
 * Trả về bài viết vừa bị xoá
 * để frontend và service có thể
 * lấy danh sách ảnh cần xoá từ S3.
 */
export const deletePost = (
  postId,
  userId
) => {
  const query = `
    WITH target AS (
      SELECT * FROM list WHERE id = $1 AND user_id = $2
    ), updated_original AS (
      UPDATE list
      SET shared = GREATEST(0, shared - 1)
      WHERE id IN (SELECT original_post_id FROM target WHERE original_post_id IS NOT NULL)
    )
    DELETE FROM list
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;

  const values = [
    postId,
    userId,
  ];

  return {
    query,
    values,
  };
};
