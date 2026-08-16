export const getChats = (userId) => ({
  query: `
    SELECT
      c.id, c.chat_type, c.chat_name, c.chat_avatar, c.created_by,
      c.created_at, c.updated_at, me.member_role, me.is_muted,
      lm.id AS last_message_id, lm.message AS last_message,
      lm.message_type AS last_message_type, lm.created_at AS last_message_at,
      lm.sender_id AS last_sender_id,
      COALESCE(unread.unread_count, 0)::int AS unread_count,
      COALESCE(members.members, '[]'::jsonb) AS members
    FROM chat_member me
    JOIN chat c ON c.id = me.chat_id AND c.delete_flg = 0
    LEFT JOIN LATERAL (
      SELECT m.id, m.message, m.message_type, m.created_at, m.sender_id
      FROM chat_message m
      WHERE m.chat_id = c.id AND m.is_deleted = FALSE AND m.delete_flg = 0
      ORDER BY m.id DESC LIMIT 1
    ) lm ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS unread_count
      FROM chat_message m
      WHERE m.chat_id = c.id
        AND m.id > COALESCE(me.last_read_message_id, 0)
        AND m.sender_id IS DISTINCT FROM $1
        AND m.is_deleted = FALSE AND m.delete_flg = 0
    ) unread ON TRUE
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', cm.user_id, 'name', u.name, 'avatar', ui.avatar,
        'member_role', cm.member_role
      ) ORDER BY cm.joined_at) AS members
      FROM chat_member cm
      JOIN public."user" u ON u.id = cm.user_id AND u.delete_flg = 0
      LEFT JOIN public.user_image ui ON ui.user_id = u.id AND ui.delete_flg = 0
      WHERE cm.chat_id = c.id AND cm.left_at IS NULL AND cm.delete_flg = 0
    ) members ON TRUE
    WHERE me.user_id = $1 AND me.left_at IS NULL AND me.delete_flg = 0
    ORDER BY COALESCE(lm.created_at, c.updated_at) DESC
  `,
  values: [userId],
});

export const createDirectChat = (userId, otherUserId) => ({
  query: `
    WITH existing AS (
      SELECT c.id
      FROM chat c
      JOIN chat_member mine ON mine.chat_id = c.id AND mine.user_id = $1 AND mine.left_at IS NULL AND mine.delete_flg = 0
      JOIN chat_member theirs ON theirs.chat_id = c.id AND theirs.user_id = $2 AND theirs.left_at IS NULL AND theirs.delete_flg = 0
      WHERE c.chat_type = 'DIRECT' AND c.delete_flg = 0
        AND (SELECT COUNT(*) FROM chat_member cm WHERE cm.chat_id = c.id AND cm.left_at IS NULL AND cm.delete_flg = 0) = 2
      LIMIT 1
    ), created AS (
      INSERT INTO chat (chat_type, created_by)
      SELECT 'DIRECT', $1
      WHERE NOT EXISTS (SELECT 1 FROM existing)
        AND EXISTS (SELECT 1 FROM public."user" WHERE id = $2 AND delete_flg = 0)
      RETURNING id
    ), inserted_members AS (
      INSERT INTO chat_member (chat_id, user_id, member_role)
      SELECT created.id, member.user_id, 'MEMBER'
      FROM created CROSS JOIN (VALUES ($1::bigint), ($2::bigint)) member(user_id)
      RETURNING chat_id
    )
    SELECT id FROM existing UNION ALL SELECT id FROM created LIMIT 1
  `,
  values: [userId, otherUserId],
});

export const createGroupChat = (userId, chatName, memberIds) => ({
  query: `
    WITH created AS (
      INSERT INTO chat (chat_type, chat_name, created_by)
      VALUES ('GROUP', $2, $1) RETURNING id
    ), inserted_members AS (
      INSERT INTO chat_member (chat_id, user_id, member_role)
      SELECT created.id, ids.user_id,
        CASE WHEN ids.user_id = $1 THEN 'OWNER' ELSE 'MEMBER' END
      FROM created
      CROSS JOIN unnest($3::bigint[]) ids(user_id)
      JOIN public."user" u ON u.id = ids.user_id AND u.delete_flg = 0
      ON CONFLICT (chat_id, user_id) DO NOTHING
      RETURNING chat_id
    )
    SELECT id FROM created
  `,
  values: [userId, chatName, memberIds],
});

export const getMessages = (chatId, userId, beforeId, limit) => ({
  query: `
    SELECT m.id, m.chat_id, m.sender_id, m.message, m.message_type,
      m.media_url, m.reply_to_message_id, m.is_deleted, m.created_at, m.updated_at,
      u.name AS sender_name, ui.avatar AS sender_avatar
    FROM chat_message m
    LEFT JOIN public."user" u ON u.id = m.sender_id AND u.delete_flg = 0
    LEFT JOIN public.user_image ui ON ui.user_id = u.id AND ui.delete_flg = 0
    WHERE m.chat_id = $1 AND m.delete_flg = 0
      AND ($3::bigint IS NULL OR m.id < $3)
      AND EXISTS (
        SELECT 1 FROM chat_member cm
        WHERE cm.chat_id = m.chat_id AND cm.user_id = $2 AND cm.left_at IS NULL AND cm.delete_flg = 0
      )
    ORDER BY m.id DESC LIMIT $4
  `,
  values: [chatId, userId, beforeId, limit],
});

export const sendMessage = (chatId, userId, message) => ({
  query: `
    WITH inserted AS (
      INSERT INTO chat_message (chat_id, sender_id, message, message_type)
      SELECT $1, $2, $3, 'TEXT'
      WHERE EXISTS (
        SELECT 1 FROM chat_member cm
        WHERE cm.chat_id = $1 AND cm.user_id = $2 AND cm.left_at IS NULL AND cm.delete_flg = 0
      ) RETURNING *
    ), touched AS (
      UPDATE chat SET updated_at = NOW()
      WHERE id IN (SELECT chat_id FROM inserted) AND delete_flg = 0
    )
    SELECT inserted.*, u.name AS sender_name, ui.avatar AS sender_avatar
    FROM inserted JOIN public."user" u ON u.id = inserted.sender_id AND u.delete_flg = 0
    LEFT JOIN public.user_image ui ON ui.user_id = u.id AND ui.delete_flg = 0
  `,
  values: [chatId, userId, message],
});

export const canAccessChat = (chatId, userId) => ({
  query: `SELECT EXISTS (
    SELECT 1 FROM chat_member
    WHERE chat_id = $1 AND user_id = $2 AND left_at IS NULL AND delete_flg = 0
  ) AS can_access`,
  values: [chatId, userId],
});

export const sendImageMessage = (chatId, userId, mediaKey, caption) => ({
  query: `
    WITH inserted AS (
      INSERT INTO chat_message (chat_id, sender_id, message, message_type, media_url)
      SELECT $1, $2, NULLIF($4, ''), 'IMAGE', $3
      WHERE EXISTS (
        SELECT 1 FROM chat_member cm
        WHERE cm.chat_id = $1 AND cm.user_id = $2 AND cm.left_at IS NULL AND cm.delete_flg = 0
      ) RETURNING *
    ), touched AS (
      UPDATE chat SET updated_at = NOW() WHERE id IN (SELECT chat_id FROM inserted) AND delete_flg = 0
    )
    SELECT inserted.*, u.name AS sender_name, ui.avatar AS sender_avatar
    FROM inserted JOIN public."user" u ON u.id = inserted.sender_id AND u.delete_flg = 0
    LEFT JOIN public.user_image ui ON ui.user_id = u.id AND ui.delete_flg = 0
  `,
  values: [chatId, userId, mediaKey, caption],
});

export const markChatRead = (chatId, userId, messageId) => ({
  query: `
    UPDATE chat_member cm
    SET last_read_message_id = target.id
    FROM chat_message target
    WHERE cm.chat_id = $1 AND cm.user_id = $2 AND cm.left_at IS NULL AND cm.delete_flg = 0
      AND target.id = $3 AND target.chat_id = cm.chat_id AND target.delete_flg = 0
    RETURNING cm.chat_id, cm.last_read_message_id
  `,
  values: [chatId, userId, messageId],
});

export const addGroupMembers = (chatId, actorId, memberIds) => ({
  query: `
    INSERT INTO chat_member (chat_id, user_id, member_role, left_at, joined_at)
    SELECT $1, ids.user_id, 'MEMBER', NULL, NOW()
    FROM unnest($3::bigint[]) ids(user_id)
      JOIN public."user" u ON u.id = ids.user_id AND u.delete_flg = 0
    WHERE EXISTS (
      SELECT 1 FROM chat c
      JOIN chat_member actor ON actor.chat_id = c.id
      WHERE c.id = $1 AND c.chat_type = 'GROUP' AND c.delete_flg = 0 AND actor.user_id = $2
        AND actor.left_at IS NULL AND actor.delete_flg = 0 AND actor.member_role IN ('OWNER', 'ADMIN')
    )
    ON CONFLICT (chat_id, user_id) DO UPDATE SET left_at = NULL, joined_at = NOW(), delete_flg = 0
    RETURNING user_id
  `,
  values: [chatId, actorId, memberIds],
});

export const leaveGroup = (chatId, userId) => ({
  query: `
    WITH leaving AS (
      SELECT cm.member_role
      FROM chat_member cm JOIN chat c ON c.id = cm.chat_id
      WHERE cm.chat_id = $1 AND cm.user_id = $2 AND cm.left_at IS NULL
        AND cm.delete_flg = 0 AND c.chat_type = 'GROUP' AND c.delete_flg = 0
    ), successor AS (
      SELECT cm.id
      FROM chat_member cm
      WHERE cm.chat_id = $1 AND cm.user_id <> $2 AND cm.left_at IS NULL AND cm.delete_flg = 0
      ORDER BY CASE WHEN cm.member_role = 'ADMIN' THEN 0 ELSE 1 END, cm.joined_at
      LIMIT 1
    ), promoted AS (
      UPDATE chat_member SET member_role = 'OWNER'
      WHERE id IN (SELECT id FROM successor)
        AND EXISTS (SELECT 1 FROM leaving WHERE member_role = 'OWNER')
      RETURNING id
    )
    UPDATE chat_member cm SET left_at = NOW()
    WHERE cm.chat_id = $1 AND cm.user_id = $2 AND cm.left_at IS NULL AND cm.delete_flg = 0
      AND EXISTS (SELECT 1 FROM leaving)
    RETURNING chat_id
  `,
  values: [chatId, userId],
});
