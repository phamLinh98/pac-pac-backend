export const getList = () => {
    const query = `SELECT l.*,u.name AS user_name,u.avatar AS avatar
                   FROM list l
                   JOIN "public"."user" u ON l.user_id = u.id`;
    return query;
}