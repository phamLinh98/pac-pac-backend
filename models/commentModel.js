export const getComment = () => {
    const query = `SELECT * FROM comment`;
    return query;
}

export const getCommentByListId = (listId) => {
    const query = `SELECT c.*,u.name AS user_name
                   FROM comment c
                   JOIN list l ON c.post_id = l.id
                   JOIN "public"."user" u ON c.user_id = u.id
                   WHERE l.id = $1` ;
    const values = [listId];
    // const queryObject = {query,values}
    return { query, values };
}