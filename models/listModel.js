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
    const query = `SELECT l.*,u.namecode,u.name,u.avatar
                   FROM list l
                   JOIN "public"."user" u ON l.user_id = u.id
                   WHERE l.user_id = $1`;
    const values = [userId];
    return {query, values};
}