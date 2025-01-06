export const getUser = () => {
    const query = `SELECT * FROM "public"."user"`;
    return query;
}