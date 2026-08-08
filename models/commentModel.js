export const getComment = () => {
    const query = `SELECT * FROM comment`;
    return query;
}

export const getCommentByListId = (listId) => {
    const query = `
      SELECT
          c.*,
          u.name AS user_name,
          u.avatar AS avatar
      FROM comment c
      JOIN list l ON c.list_id = l.id
      JOIN public."user" u ON c.user_id = u.id
      WHERE l.id = $1
      ORDER BY c.created_at ASC;
  `;
    const values = [listId];
    return { query, values };
};

export const addComment = (userId, listId, content) => {
  const query = `
    WITH new_comment AS (
      INSERT INTO comment (
      list_id,
      user_id,
      content,
      created_at
      )
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    ), updated_post AS (
      UPDATE list
      SET comment = (SELECT COUNT(*) FROM comment WHERE list_id = $1) + 1
      WHERE id = $1
      RETURNING id
    ), new_notification AS (
      INSERT INTO notification_message (
        receiver_user_id,
        sender_user_id,
        post_id,
        comment_id,
        notification_type
      )
      SELECT
        l.user_id,
        $2,
        l.id,
        nc.id,
        'COMMENT'
      FROM list l
      CROSS JOIN new_comment nc
      WHERE l.id = $1 AND l.user_id <> $2
      RETURNING id
    )
    SELECT nc.*
    FROM new_comment nc
  `;

  const values = [listId, userId, content];

  return { query, values };
};
